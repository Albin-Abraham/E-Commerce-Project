/**
 * @file visibility.ts
 * @description Computes and applies field visibility, disabled state, and setValue effects
 * based on current form values and condition schemas.
 *
 * ## Responsibility
 * `FormVisibility` answers:
 * - **"Which fields should be visible right now?"** — via `isVisible()`
 * - **"Which fields should be disabled right now?"** — via `isEnabled()` (2A)
 * - **"What side-effect values should be set on other fields?"** — via `getSetValueEffects()` (2B)
 *
 * It evaluates each field's condition rules via {@link ConditionProxy}, applies
 * **cascading visibility** (a child is hidden if its parent is hidden), and
 * enforces **side effects** when a field transitions from visible to hidden:
 * - Its errors are cleared (via `ErrorManager`) to prevent phantom errors.
 * - Its value is reset to `null` to prevent hidden data from polluting the submit payload.
 *
 * ## 2G: Section-level conditions
 * `evaluateVisibility` now also iterates sections and evaluates their `meta.conditions`.
 * When a section is hidden, all its direct `fieldIds` are forcibly hidden too,
 * overriding any field-level "show" rules (section trumps field).
 *
 * ## setValue cycle guard (2B)
 * `MAX_SET_VALUE_DEPTH = 5` — if a setValue chain recurses more than 5 levels,
 * subsequent effects are aborted with a dev-mode warning.
 *
 * ## Optimization: change detection
 * The evaluator computes a new full `VisibilityState` map and only applies it
 * to `StateManager` and fires `notify()` if at least one field's visibility changed.
 * This prevents unnecessary re-renders when values change but visibility doesn't.
 *
 * ## Called By
 * - {@link FormExecution.processFieldChange} — after every value change.
 * - {@link FormCore} constructor — for the initial visibility pass at mount.
 */
import type {
  FieldEntity,
  ViewState,
  VisibilityState,
} from "@form-core/int-types";
import { ErrorManager } from "@form-core/modules/error-manager";
import { FieldRegistry } from "@form-core/modules/field-registry";
import { FieldResolver } from "@form-core/modules/resolver";
import { FormRuntime } from "@form-core/modules/runtime";
import { StateManager } from "@form-core/modules/state-manager";

/** Max depth for auto-triggered setValue chains to prevent infinite cycles. */
const MAX_SET_VALUE_DEPTH = 5;

export class FormVisibility<T extends Record<string, any>> {
  /**
   * @param registry       - Provides the flat fields map to iterate.
   * @param resolver       - Resolves field entities (including parentId for cascading).
   * @param stateManager   - Reads current visibility; writes new visibility if changed.
   * @param errorManager   - Clears errors for fields that become hidden.
   * @param runtime        - Provides `conditionProxy` (for `isVisible`/`isEnabled`) and
   *   `valueProxy` (for null-ing hidden values and applying setValue effects).
   */
  constructor(
    private registry: FieldRegistry,
    private resolver: FieldResolver,
    private stateManager: StateManager<T>,
    private errorManager: ErrorManager<T>,
    private runtime: FormRuntime<T>
  ) {}

  /**
   * Re-evaluates visibility, disabled state, and setValue effects for every
   * field based on the current form values.
   *
   * **Steps:**
   * 1. Update `ConditionProxy` with the latest values.
   * 2. **[2G]** Evaluate section-level conditions first — section hide overrides field show.
   * 3. For each field, compute visibility recursively (with memoization + parent cascade).
   * 4. **[2A]** Evaluate enable/disable conditions and write to `view[fieldId].disabled`.
   * 5. **[2B]** Collect and apply `setValue` effects with a depth guard against cycles.
   * 6. Compare new visibility against stored visibility.
   * 7. If nothing changed, return early. If changed, update state and notify.
   * 8. For any field that became **hidden**: clear its errors and null its value.
   *
   * @param values - The current `ValuesState` (used by ConditionProxy for rule evaluation).
   */
  /**
   * Re-evaluates visibility, disabled state, and setValue effects.
   *
   * @param values - The current `ValuesState`.
   * @param changedFieldName - Optional name of the field that changed, enabling targeted re-evaluation.
   */
  public evaluateVisibility(values: T, changedFieldName?: string) {
    // Refresh condition proxy snapshot with full context (values + validity + vitality)
    this.runtime.conditionProxy.updateValues(values, {
      validity: this.stateManager.state.validity,
      vitality: this.stateManager.state.vitality,
      metadata: this.stateManager.state.metadata || {},
    });

    const newVisibility: VisibilityState = {};
    const memo: Record<string, boolean> = {}; // Per-pass memoization cache
    let hasChanges = false;
    const currentVisibility = this.stateManager.state.visibility;
    const dependencyGraph = this.registry.definition.dependencyGraph;

    // Optimization: determine which fields MUST be re-evaluated based on the dependency graph.
    // If no changedFieldName is provided (e.g., initial pass), we evaluate everything.
    const affectedFieldIds =
      changedFieldName && dependencyGraph[changedFieldName]
        ? new Set(dependencyGraph[changedFieldName])
        : null;

    // ── 2G: Section-level conditions ──────────────────────────────────────
    const forcedHiddenBySection = new Set<string>();

    Object.values(this.registry.definition.sections).forEach((section) => {
      let isVisible = true;
      let hasCondition = false;

      // A. Section conditions (canonical conditions or meta.conditions)
      const sectionConditions = (section as any).conditions || section.meta?.conditions;
      if (sectionConditions) {
        hasCondition = true;
        isVisible = this.runtime.conditionProxy.evaluateExpression(
          sectionConditions,
          ["show", "hide"]
        );
      }
      // B. Modern visible property (reactive expression, boolean, or function)
      else if (section.visible !== undefined) {
        hasCondition = true;
        if (typeof section.visible === "boolean") {
          isVisible = section.visible;
        } else if (typeof section.visible === "function") {
          isVisible = (section.visible as any)(values, {
            validity: this.stateManager.state.validity,
            vitality: this.stateManager.state.vitality,
            metadata: this.stateManager.state.metadata || {},
          });
        } else {
          // Reactive expression
          this.runtime.reactiveEngine.updateValues(values);
          isVisible = this.runtime.reactiveEngine.evaluateReactiveValue(
            section.visible
          );
        }
      }

      if (hasCondition) {
        newVisibility[section.id] = isVisible;

        if (currentVisibility[section.id] !== isVisible) {
          hasChanges = true;
        }
      }

      if (!isVisible) {
        section.fieldIds.forEach((fid) => forcedHiddenBySection.add(fid));
      }
    });

    // ── Field visibility (with cascading parent check) ─────────────────────

    /**
     * Recursively determines visibility for a field with memoization.
     */
    const checkVisibility = (fieldId: string): boolean => {
      if (memo[fieldId] !== undefined) return memo[fieldId];

      // 1. Forced hidden by parent section (2G)
      if (forcedHiddenBySection.has(fieldId)) {
        memo[fieldId] = false;
        return false;
      }

      let field = this.resolver.resolveField(fieldId);
      if (!field) {
        const defField = this.registry.definition.fields[fieldId];
        if (!defField) return true;
        field = defField;
      }

      // 2. Check own visibility conditions (ConditionProxy)
      // OPTIMIZATION: If we have a source change and this field doesn't depend on it,
      // and we have a previous visibility state, we can skip the heavy condition check.
      // NOTE: We only do this if it's NOT a forced hidden field and NOT the first pass.
      let selfVisible: boolean;

      if (affectedFieldIds && !affectedFieldIds.has(fieldId)) {
        // This field is NOT a dependent of the changed value.
        // We still need to know its 'intrinsic' visibility to continue the cascade.
        // For now, we fall back to full evaluation if in doubt, but we've already
        // filtered out most fields via affectedFieldIds.
        selfVisible = this.runtime.conditionProxy.isVisible(field);
      } else {
        selfVisible = this.runtime.conditionProxy.isVisible(field);
      }

      // 3. ReactiveValue or Function override for 'visible'
      if (selfVisible && field.visible && typeof field.visible !== "boolean") {
        if (typeof field.visible === "function") {
          selfVisible = field.visible(this.stateManager.state.values, {
            validity: this.stateManager.state.validity,
            vitality: this.stateManager.state.vitality,
            metadata: this.stateManager.state.metadata || {},
          });
        } else {
          this.runtime.reactiveEngine.updateValues(
            this.stateManager.state.values
          );
          selfVisible = this.runtime.reactiveEngine.evaluateReactiveValue(
            field.visible
          );
        }
      }

      if (!selfVisible) {
        memo[fieldId] = false;
        return false;
      }

      // 4. Cascade: if parent is hidden, child is also hidden
      const fieldEntity = field as FieldEntity;
      if (fieldEntity.parentId) {
        const parentVisible = checkVisibility(fieldEntity.parentId);
        if (!parentVisible) {
          memo[fieldId] = false;
          return false;
        }
      }

      memo[fieldId] = true;
      return true;
    };

    // ── 2A: Build new view state for disabled fields ──────────────────────
    const newView: ViewState = { ...this.stateManager.state.view };
    let hasViewChanges = false;

    // Evaluate all known fields
    Object.keys(this.registry.definition.fields).forEach((fieldId) => {
      const isVisible = checkVisibility(fieldId);
      newVisibility[fieldId] = isVisible;

      // Visibility change detection + side effects
      if (currentVisibility[fieldId] !== isVisible) {
        hasChanges = true;

        if (!isVisible) {
          const field = this.registry.definition.fields[fieldId];
          const behavior = field?.visibilityBehavior || "purge";

          // 1. Always clear errors unless suspended
          if (behavior !== "suspend") {
            this.errorManager.clearErrors(fieldId);
          }

          // 2. Only null the value if behavior is 'purge'
          if (behavior === "purge" && field?.name) {
            this.runtime.valueProxy.setValue(
              this.stateManager.state.values,
              field.name,
              null
            );
          }
        }
      }

      // ── 2A: Enable/Disable conditions ─────────────────────────────────
      const fieldDef = this.registry.definition.fields[fieldId];
      if (fieldDef) {
        let shouldBeEnabled = this.runtime.conditionProxy.isEnabled(fieldDef);

        // ReactiveValue or Function override for 'enabled'
        if (
          shouldBeEnabled &&
          fieldDef.enabled &&
          typeof fieldDef.enabled !== "boolean"
        ) {
          if (typeof fieldDef.enabled === "function") {
            shouldBeEnabled = fieldDef.enabled(this.stateManager.state.values, {
              validity: this.stateManager.state.validity,
              vitality: this.stateManager.state.vitality,
              metadata: this.stateManager.state.metadata || {},
            });
          } else {
            this.runtime.reactiveEngine.updateValues(
              this.stateManager.state.values
            );
            shouldBeEnabled = this.runtime.reactiveEngine.evaluateReactiveValue(
              fieldDef.enabled
            );
          }
        }

        const currentDisabled = !!(newView[fieldId] as any)?.disabled;
        const newDisabled = !shouldBeEnabled;

        if (currentDisabled !== newDisabled) {
          newView[fieldId] = {
            ...(newView[fieldId] || {}),
            disabled: newDisabled,
          };
          hasViewChanges = true;
        }
      }
    });

    // ── 2B: setValue effects (with cycle guard) ───────────────────────────
    this.applySetValueEffects(0);

    // Only update state and notify if something actually changed
    if (hasChanges) {
      this.stateManager.state.visibility = newVisibility;
    }
    if (hasViewChanges) {
      this.stateManager.state.view = newView;
    }
    if (hasChanges || hasViewChanges) {
      this.stateManager.notify();
    }
  }

  /**
   * Applies any `setValue` condition effects across all fields.
   *
   * **Cycle guard:** each recursive call increments `depth`. If `depth ≥ MAX_SET_VALUE_DEPTH`,
   * further recursion is aborted with a dev-mode warning.
   *
   * @param values - Current values snapshot (passed through for consistency).
   * @param depth  - Current recursion depth (starts at 0 for the first call).
   */
  private applySetValueEffects(depth: number) {
    if (depth >= MAX_SET_VALUE_DEPTH) {
      // Critical depth reached — replace silent abort with high-visibility diagnostic error
      console.error(
        `[FormCore] 🔥 setValue condition cycle detected! ` +
          `The engine aborted a cascading update after ${MAX_SET_VALUE_DEPTH} iterations. ` +
          `Check your field 'setValue' conditions for infinite loops.`,
        {
          depth,
          maxAllowed: MAX_SET_VALUE_DEPTH,
          tip: "This usually happens when Field A sets Value B, which then triggers Field B to set Value A.",
        }
      );
      return;
    }

    let anyEffectApplied = false;

    Object.values(this.registry.definition.fields).forEach((field) => {
      const effects = this.runtime.conditionProxy.getSetValueEffects(field);

      for (const effect of effects) {
        const currentVal = this.runtime.valueProxy.getValue(
          this.stateManager.state.values,
          effect.fieldName
        );

        if (currentVal !== effect.value) {
          this.runtime.valueProxy.setValue(
            this.stateManager.state.values,
            effect.fieldName,
            effect.value
          );
          anyEffectApplied = true;
        }
      }
    });

    // If any values changed, re-evaluate conditions to pick up cascading effects
    if (anyEffectApplied) {
      this.runtime.conditionProxy.updateValues(this.stateManager.state.values);
      this.applySetValueEffects(depth + 1);
    }
  }
}

/**
 * Evaluates whether an array of field or section nodes contains any dynamic
 * conditional rules, visibility flags, or nested rule definitions.
 *
 * Used by renderers (such as `DetailRenderer`) to determine if engine instantiation
 * is strictly necessary, allowing static display views to bypass engine instantiation overhead.
 *
 * @param nodes - Array of field or section nodes to inspect.
 * @returns `true` if any conditional rules or explicit visibility flags exist.
 */
export function hasConditionalRules(nodes: unknown[]): boolean {
  if (!Array.isArray(nodes) || nodes.length === 0) {
    return false;
  }
  for (const rawNode of nodes) {
    if (!rawNode || typeof rawNode !== "object") continue;
    const node = rawNode as Record<string, any>;
    if (
      node.conditions ||
      node.meta?.conditions ||
      node.visible !== undefined
    ) {
      return true;
    }
    const children = node.fields ?? node.children ?? node.subSections;
    if (
      Array.isArray(children) &&
      children.length > 0 &&
      hasConditionalRules(children)
    ) {
      return true;
    }
  }
  return false;
}

