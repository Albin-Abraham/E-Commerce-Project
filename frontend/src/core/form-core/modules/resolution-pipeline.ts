import type {
  InternalFormState,
  RenderNode,
  ResolvedFieldProps,
} from "@form-core/int-types";
import { get } from "lodash-es";

import { fieldTypeRegistry } from "./capability-registry";

export interface IFieldTypeRegistry {
  get(type: string): {
    resolveProps?: (
      resolved: any,
      state: any,
      context: any
    ) => Record<string, any>;
  } | null;
}

/**
 * Context passed through the resolution pipeline.
 * Carries shared state across field resolutions in a single render pass.
 */
export interface ResolutionContext {
  /** Shared cache across fields in the same render pass */
  cache: Map<string, unknown>;
  /** Abort signal for cancellation (e.g., when a new render supersedes this one) */
  signal?: AbortSignal;
  /** The FormCore instance — enables resolveProps to access the full engine */
  form?: any;
}

/**
 * Pure functions to resolve a field's visual and behavioral props
 * from the 5V state matrix and i18n context.
 *
 * This is the Layer 2 (Resolution Pipeline) of the Zenith Render Engine.
 */
export class ResolutionPipeline {
  /**
   * Resolves a RenderNode into final React props.
   * Returns null if the field is hidden (V3 gate).
   *
   * @param node - The static render node from the RenderTree.
   * @param state - The current 5V state matrix.
   * @param density - Visual density hint for the layout engine.
   * @param registry - The field type capability registry (DIP decoupled).
   * @param context - Optional resolution context for cross-field coordination.
   */
  public static resolve(
    node: RenderNode,
    state: InternalFormState<any>,
    density: "compact" | "comfortable" | "spacious" = "comfortable",
    registry: IFieldTypeRegistry = fieldTypeRegistry,
    context?: ResolutionContext
  ): ResolvedFieldProps | null {
    // 1. V3 Gate (Visibility)
    // We use the stable stateKey for visibility subscriptions.
    if (!state.visibility[node.stateKey]) return null;

    // 2. V4 Resolution (View State)
    // We use the stable stateKey for dynamic view property subscriptions.
    const view = state.view[node.stateKey] || {};

    const props: ResolvedFieldProps = {
      dataPath: node.dataPath,
      stateKey: node.stateKey,
      id: node.stateKey, // Legacy id points to stateKey
      label: view.label,
      description: view.description,
      placeholder: view.placeholder,
      rowGroup: node.rowGroup,
      density,
      componentProps: view.componentProps || {},
      options: view.options,
      isLoading: view.isLoading,
      disabled: view.disabled,
    };

    // 3. Capability-gated Input Props (V1, V2, V5)
    const caps = node.capabilities || {
      hasValue: true,
      hasValidity: true,
      hasVisibility: true,
      hasView: true,
      hasVitality: true,
      derivesValidityFromChildren: false,
    };
    if (caps.hasValue) {
      // DUAL ADDRESSING LOGIC:
      // dataPath is positional/custom: "users[0].email" or "users#abc.email"
      // stateKey is identity-based engine key: "users__abc__email"
      const dataPath = node.dataPath;
      const stateKey = node.stateKey;

      props.inputProps = {
        value: get(state.values, dataPath),
        valid: state.validity[stateKey]?.valid ?? true,
        errors: state.validity[stateKey]?.errors || [],
        touched: state.vitality[stateKey]?.touched ?? false,
        dirty: state.vitality[stateKey]?.dirty ?? false,
        focused: state.vitality[stateKey]?.focused ?? false,
        version: state.vitality[stateKey]?.version ?? 0,
        conflict: state.concurrency?.conflicts?.[stateKey] || null,
      };
    }

    // 4. Custom Handler Hook (Level 2 Extension)
    // Run custom resolveProps if defined for this field type.
    const fieldType = registry.get(node.fieldType);
    if (fieldType?.resolveProps) {
      const fieldState = {
        value: props.inputProps?.value,
        valid: props.inputProps?.valid,
        errors: props.inputProps?.errors,
        touched: props.inputProps?.touched,
        view: view,
      };

      const augmentedProps = fieldType.resolveProps(
        props,
        fieldState,
        context ?? null
      );
      return { ...props, ...augmentedProps };
    }

    return props;
  }
}
