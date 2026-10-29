import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { usePrimitiveRuntime } from "@ui/form/context/FormOrchestratorContext";
import {
  FormOrchestratorProvider,
  useFormOrchestrator,
} from "@ui/form/context/FormOrchestratorContext";
import { useFormRegistry } from "@ui/form/context/FormRegistryContext";
import { useFieldRouter } from "@ui/form/context/FormRoutingContext";
import {
  useFormTheme,
  useStyleAdapter,
} from "@ui/form/context/FormThemeContext";
import type { FormField } from "@ui/form/fields";
import { layoutRendererRegistry } from "@ui/form/layout/LayoutRendererRegistry";
// Side-effect import: registers default layout renderers
import "@ui/form/layout/layout-renderers";
import type { RuntimeLayoutConfig } from "@ui/form/types/layout";
import { cn } from "@ui/form/utils/form-styles";
import { resolveTranslation } from "@ui/form/utils/i18n.utils";
import {
  type BoxModelProperties,
  parseLayoutConfig,
  renderBoxModel,
} from "@ui/form/utils/layout-generator";
import type { SpacingConfig } from "@ui/form/utils/spacing-calculator";

export interface SectionComposerProps {
  field: FormField;
  /**
   * @deprecated Resolved from context via usePrimitiveRuntime().
   * Kept for backward-compatibility only.
   */
  getComponentProps?: (fieldId: string) => any;
  /**
   * @deprecated Resolved from context via usePrimitiveRuntime().
   * Kept for backward-compatibility only.
   */
  visibility?: Record<string, boolean>;
  spacing?: SpacingConfig;
  parentLayout?: RuntimeLayoutConfig;
  dcsStyles?: any;
}

/**
 * Renders child fields via the FieldRouter from FormRoutingContext.
 * getComponentProps and visibility are resolved from context — not passed as args.
 */
function renderChildFields(
  fields: FormField[],
  getComponentProps: (id: string) => any,
  visibility: Record<string, boolean>,
  spacing?: SpacingConfig,
  parentLayout?: RuntimeLayoutConfig,
  renderField?: ReturnType<typeof useFieldRouter>
): React.ReactNode {
  if (!renderField) return null;
  return (
    <>
      {fields.map((childField) =>
        renderField({
          field: childField,
          getComponentProps,
          visibility,
          spacing,
          parentLayout,
        })
      )}
    </>
  );
}

export interface SectionContentProps {
  layoutConfig: RuntimeLayoutConfig;
  children: React.ReactNode;
  spacing?: SpacingConfig;
  headless?: boolean;
}

/**
 * Semantic gap names → Zenith spacing token numbers. Matches the gap scale used
 * by `getSpacingMapper` in layout-generator.tsx (none/xs/sm/md/lg/xl/xxl).
 */
const GAP_VALUE_TO_TOKEN: Record<string, number | undefined> = {
  none: 0,
  xs: 1,
  sm: 2,
  md: 4,
  lg: 8,
  xl: 12,
  xxl: 16,
};

/** Valid Zenith spacing steps (4pt grid). */
const SPACING_STEPS = [0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16];

function closestSpacingStep(value: number): number {
  return SPACING_STEPS.reduce((prev, curr) =>
    Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev
  );
}

/**
 * Resolve an author-provided gap into *exact* Tailwind gap/space classes.
 *
 * Accepted forms:
 * - Raw Tailwind utilities (`gap-4`, `gap-x-3`, `space-y-6`) → passed through untouched
 * - Semantic names (`xs`/`sm`/`md`/`lg`/`xl`/`xxl`, aliases `small`/`medium`/`large`)
 * - Numeric values (`4`, `6`) — snapped to the nearest valid spacing step
 *
 * `axis`:
 * - "both" → uniform `gap-*`
 * - "x"    → `gap-x-*`
 * - "y"    → `gap-y-*`
 * - "col"  → `space-y-*` (vertical stack semantics)
 *
 * Explicit author gaps bypass the SpacingCalculator entirely.
 */
function resolveGapClasses(
  value: string | number | null | undefined,
  axis: "both" | "x" | "y" | "col"
): string {
  if (value === null || value === undefined || value === "") return "";
  const raw = String(value).trim();

  // Raw Tailwind utilities (or arbitrary values) pass through as-is.
  if (/^(gap|space-(y|x))-/.test(raw) || /^\[var\(/.test(raw)) return raw;

  // Normalize semantic aliases.
  const normalized =
    raw === "small" ? "sm" : raw === "medium" ? "md" : raw === "large" ? "lg" : raw;

  let step: number | undefined = GAP_VALUE_TO_TOKEN[normalized.toLowerCase()];
  if (step === undefined && /^\d+(\.\d+)?$/.test(raw)) {
    step = closestSpacingStep(parseFloat(raw));
  }
  if (step === undefined) step = GAP_VALUE_TO_TOKEN.md; // Unknown → sensible fallback

  const token = step === 0 ? "0" : `[var(--space-${step})]`;
  if (axis === "x") return `gap-x-${token}`;
  if (axis === "y") return `gap-y-${token}`;
  if (axis === "col") return `space-y-${token}`;
  return `gap-${token}`;
}

/** Grid-like layout types render child fields into a 12-col grid. */
const GRID_LIKE_TYPES = new Set([
  "grid",
  "card",
  "container",
  "fieldset",
  "group",
  "section",
  "accordion",
]);

/**
 * SectionContent — Resolves a section's layout algorithm and renders its child fields.
 *
 * Supports three layout modes:
 * - **Grid** (default) — CSS Grid with configurable columns via `parseLayoutConfig`
 * - **Flex** — horizontal flex layout
 * - **Block** — vertical stack layout
 *
 * SPACING PRECEDENCE (highest → lowest):
 * 1. **Author override** — explicit `layout.gap` / `layout.rowGap` / `layout.colGap`
 *    wins, bypasses the SpacingCalculator entirely, and preserves per-field margins.
 * 2. **Idiom defaults (calculator)** — grid-like sections consume the *exact*
 *    automatic tokens (`fieldGapX`/`fieldGapY`) as real Tailwind classes instead of
 *    routing them through the coarse Flex/Grid `gap` variant. The section then marks
 *    the tree with `spacingAuthority: "gap"` so leaf fields drop their own vertical
 *    margins (the gap becomes the single vertical spacing source — fixes double
 *    spacing in e.g. the AuthPortal login form).
 * 3. Flex row / group → `fieldHorizontal`; block / flex column → `fieldVertical`.
 *    These never take vertical-spacing authority (horizontal layouts keep authored
 *    vertical rhythm).
 *
 * BREAKS THE CIRCULAR DEPENDENCY: receives pre-rendered ReactNode children
 * instead of raw FormField[] + rendering callbacks.
 *
 * Wrapped in `React.memo` to avoid re-renders when the layout config hasn't changed.
 */
export const SectionContent = React.memo<SectionContentProps>(
  function SectionContent({
    layoutConfig,
    children,
    spacing,
    headless = false,
  }) {
    const layoutType = layoutConfig.type || "grid";
    const orchestrator = useFormOrchestrator();

    const resolved = useMemo((): BoxModelProperties & {
      extraClass?: string;
      authority: "gap" | "none";
    } => {
      const config = parseLayoutConfig(layoutConfig);
      const raw = layoutConfig as any;
      const explicitGap = raw.gap as string | number | undefined;
      const explicitColGap = raw.colGap as string | number | undefined;
      const explicitRowGap = raw.rowGap as string | number | undefined;
      const direction = (raw.direction as string) || "row";
      const isGridLike = GRID_LIKE_TYPES.has(layoutType);
      const isColumn =
        direction === "column" || direction === "column-reverse" || layoutType === "block";

      let gapClasses = "";
      let authority: "gap" | "none" = "none";

      // ── 1. Author override wins ─────────────────────────────────────
      if (isColumn) {
        // Flex columns use inline gap; block stacks use space-y.
        const columnAxis = layoutType === "flex" ? "y" : "col";
        const authorGap = explicitGap ?? explicitRowGap;
        if (authorGap !== undefined) {
          gapClasses = resolveGapClasses(authorGap, columnAxis);
        } else {
          gapClasses = spacing?.fieldVertical || "space-y-4";
        }
      } else if (layoutType === "flex") {
        if (explicitGap !== undefined) {
          gapClasses = resolveGapClasses(explicitGap, "x");
        } else {
          gapClasses = spacing?.fieldHorizontal || "";
        }
      } else if (isGridLike) {
        const hasExplicit =
          explicitGap !== undefined ||
          explicitColGap !== undefined ||
          explicitRowGap !== undefined;

        if (hasExplicit) {
          const hasAxisGaps =
            explicitColGap !== undefined || explicitRowGap !== undefined;
          if (hasAxisGaps) {
            // colGap/rowGap are more specific than a uniform gap.
            const x = explicitColGap ?? explicitGap;
            const y = explicitRowGap ?? explicitGap;
            gapClasses = cn(
              x !== undefined ? resolveGapClasses(x, "x") : "",
              y !== undefined ? resolveGapClasses(y, "y") : ""
            );
          } else {
            // Plain layout.gap → uniform gap in both axes.
            gapClasses = resolveGapClasses(explicitGap, "both");
          }
        } else if (spacing) {
          // ── 2. Calculator idiom default ── the grid gap becomes the
          // single vertical spacing authority for the subtree.
          gapClasses = cn(spacing.fieldGapX, spacing.fieldGapY);
          authority = "gap";
        }
      }

      // ── Render strategy by layout idiom ─────────────────────────────
      if (layoutType === "flex") {
        return {
          ...config,
          gap: undefined,
          extraClass: cn("w-full", gapClasses),
          authority,
        };
      }

      if (isColumn) {
        return {
          ...config,
          gap: undefined,
          extraClass: cn("block w-full", gapClasses),
          authority,
        };
      }

      if (isGridLike) {
        config.display = "grid";
        config.columns = config.columns || 12;
        config.gap = undefined;
      }

      return {
        ...config,
        extraClass: cn("w-full auto-rows-min", gapClasses),
        authority,
      };
    }, [layoutConfig, layoutType, spacing]);

    if (headless) return <>{children}</>;

    const content = renderBoxModel(
      resolved as BoxModelProperties,
      children,
      resolved.extraClass
    );

    // Calculator-driven grid gap owns vertical spacing — leaf fields suppress
    // their own vertical margins (fixes double-spacing). Explicit author gaps
    // do NOT strip margins: the author owns spacing.
    if (resolved.authority !== "gap") return content;

    return (
      <FormOrchestratorProvider
        value={{ ...orchestrator, spacingAuthority: "gap" }}
      >
        {content}
      </FormOrchestratorProvider>
    );
  }
);

/**
 * SectionComposer — Renders structural containers via the layout renderer registry.
 *
 * Resolves the layout config from field schema, then delegates to the registered
 * renderer for the given layout type. If no renderer is registered, falls back
 * to the default section renderer.
 *
 * The renderer registry replaces the previous if/else chain, making new layout
 * types extensible without modifying core renderer code.
 */
export const SectionComposer = React.memo<SectionComposerProps>(
  function SectionComposer({
    field,
    getComponentProps: propGetCP,
    visibility: propVisibility,
    spacing,
    parentLayout: _parentLayout,
    dcsStyles,
  }) {
    const { i18nNamespace } = useFormRegistry();
    const renderField = useFieldRouter();
    const adapter = useStyleAdapter();
    useTranslation();

    // Phase 1: prefer context over props — completes prop-drilling elimination
    const { getComponentProps: ctxGetCP, visibility: ctxVisibility } =
      usePrimitiveRuntime();
    const getComponentProps = propGetCP ?? ctxGetCP;
    const visibility = propVisibility ?? ctxVisibility;

    const layoutConfig: RuntimeLayoutConfig = useMemo(() => {
      const rawLayout = field.layout as Record<string, any> | undefined;
      if (rawLayout?.type) return rawLayout as RuntimeLayoutConfig;

      const structuralTypes = new Set([
        "card",
        "container",
        "accordion",
        "fieldset",
        "group",
        "tabs",
        "steps",
        "block",
      ]);
      if (field.type && structuralTypes.has(field.type)) {
        return { type: field.type as any, ...rawLayout } as RuntimeLayoutConfig;
      }

      return { type: "grid" as const, columns: 12 };
    }, [field.layout, field.type]);

    const theme = useFormTheme();

    const classes = useMemo(() => {
      const sectionDef = field.customData?.originalSection || {
        id: field.id,
        title: resolveTranslation(field.label, i18nNamespace),
        fields: field.fields || [],
        layout: layoutConfig,
        meta: field.meta,
      };
      return adapter.buildSectionStyles(sectionDef as any, theme as any);
    }, [adapter, field, layoutConfig, i18nNamespace, theme]);

    const childFields = field.fields || [];
    const styles = dcsStyles || {};

    /** Group / tabs arrange children themselves. Accordion is chrome around an inner grid. */
    const ownsChildLayout = field.type === "group" || field.type === "tabs";

    const contentLayout: RuntimeLayoutConfig = useMemo(() => {
      if (field.type === "group") {
        return {
          type: "flex",
          direction: "row",
          gap: (layoutConfig as any).gap,
        } as RuntimeLayoutConfig;
      }
      if (
        field.type === "card" ||
        field.type === "container" ||
        field.type === "fieldset" ||
        field.type === "section" ||
        field.type === "accordion"
      ) {
        const explicitGap =
          (layoutConfig as any).gap ?? (field.properties as any)?.gap;
        return {
          type: "grid",
          columns:
            (layoutConfig as any).columns ||
            (field.properties as any)?.columns ||
            12,
          // No gap default — SectionContent falls back to the automatic
          // spacing config when an explicit gap is not provided.
          ...(explicitGap !== undefined ? { gap: explicitGap } : {}),
        } as RuntimeLayoutConfig;
      }
      return layoutConfig;
    }, [field.type, field.properties, layoutConfig]);

    const renderedChildren = useMemo(
      () =>
        renderChildFields(
          childFields,
          getComponentProps,
          visibility,
          spacing,
          contentLayout,
          renderField
        ),
      [
        childFields,
        getComponentProps,
        visibility,
        spacing,
        contentLayout,
        renderField,
      ]
    );

    // ── Registry-based renderer resolution ──────────────────────────────
    const rendererType = layoutConfig.type;
    const Renderer = layoutRendererRegistry.get(rendererType);

    if (Renderer) {
      return (
        <Renderer
          field={field}
          styles={styles}
          className={classes.base}
          context={{
            getComponentProps,
            visibility,
            spacing,
            parentLayout: contentLayout,
            renderSectionContent: SectionContent as any,
            renderChildField: renderField as any,
          }}
        >
          <SectionContent
            layoutConfig={contentLayout}
            spacing={spacing}
            headless={ownsChildLayout}
          >
            {renderedChildren}
          </SectionContent>
        </Renderer>
      );
    }

    // ── Fallback: default section grouping ──────────────────────────────
    return (
      <div className={classes.base}>
        {(field.label || field.customData?.description) && (
          <div className={classes.header}>
            {field.label && (
              <h2 className={classes.title}>
                {resolveTranslation(field.label, i18nNamespace)}
              </h2>
            )}
            {field.customData?.description && (
              <p className={classes.description}>
                {resolveTranslation(
                  field.customData.description,
                  i18nNamespace
                )}
              </p>
            )}
          </div>
        )}
        <div className={classes.content}>
          <SectionContent layoutConfig={layoutConfig} spacing={spacing}>
            {renderedChildren}
          </SectionContent>
        </div>
      </div>
    );
  }
);
