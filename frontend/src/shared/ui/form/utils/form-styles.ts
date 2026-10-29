import type { FieldLayout, FormField } from "@ui/form/fields";
import type {
  ComponentStateStyles,
  FormTheme,
} from "@ui/form/styles/FormTheme";
import type { FormDefinition } from "@ui/form/types";
import type { RuntimeLayoutConfig } from "@ui/form/types/layout";
import type { FormSection } from "@ui/form/types/section";
import { getLayoutItemClasses } from "@ui/form/utils/layout-generator";

import { tokens } from "@shared/theme";

import { cn } from "@libs/utils";

// Re-export cn for backward compatibility (38+ consumers import from here)
export { cn };

// Re-export FormTheme type for backward compatibility
export type {
  FormTheme,
  ComponentStateStyles,
} from "@ui/form/styles/FormTheme";

/**
 * Matches vertical margin utilities (top/bottom), including responsive
 * variants (`sm:mb-2`, `lg:mt-4`) and negative values (`-mt-1`). Zero margins
 * (`mb-0`) and horizontal margins (mx/mr/ml utilities) are preserved.
 */
const VERTICAL_MARGIN_RE =
  /^(?:(sm|md|lg|xl|2xl):)?-?m(?:t|b|y)?-(?!0(?![\w-]))/;

/**
 * Remove vertical margin utilities (top/bottom/all margin classes, non-zero)
 * from a Tailwind class string. Used when a grid-like section owns vertical
 * spacing via `gap` so fields do not stack their own margins on top of the gap.
 */
export function stripVerticalMargins(classes: string): string {
  if (!classes) return "";
  return classes
    .split(/\s+/)
    .filter((cls) => cls && !VERTICAL_MARGIN_RE.test(cls))
    .join(" ");
}

const formTokens = tokens.form;

/**
 * Default form theme derived from global tokens.
 * Replaces the deleted DEFAULT_FORM_THEME from FormTheme.ts.
 */
const DEFAULT_FORM_THEME: FormTheme = {
  density: "comfortable",
  radius: "large",
  motion: true,
  colors: {
    primary: "var(--color-primary)",
    secondary: "var(--color-secondary)",
    background: "var(--color-background)",
    surface: "var(--color-surface)",
    border: "var(--color-border)",
    text: {
      primary: "var(--color-foreground)",
      secondary: "var(--text-foreground/70)",
      inverse: "var(--color-background)",
    },
    error: "var(--color-danger)",
    success: "var(--color-success)",
    warning: "var(--color-warning)",
  },
  spacing: {
    xs: "0.25rem",
    sm: "var(--space-sm)",
    md: "var(--space-md)",
    lg: "var(--space-lg)",
    xl: "var(--space-xl)",
    xxl: "4rem",
  },
  borderRadius: {
    sm: "var(--radius-sm)",
    md: "var(--radius-md)",
    lg: "var(--radius-lg)",
    full: "var(--radius-full)",
  },
  typography: {
    fontFamily: "var(--font-sans)",
    fontSize: {
      sm: "var(--text-sm)",
      base: "var(--text-base)",
      lg: "var(--text-lg)",
      xl: "var(--text-xl)",
    },
  },
  components: {
    input: {
      variants: {
        outlined: formTokens.inputVariants.outlined,
        filled: formTokens.inputVariants.filled,
        underlined: formTokens.inputVariants.underlined,
      },
    },
    label: {
      base: "block font-semibold text-foreground/80 mb-1.5 leading-snug",
      requiredIndicator:
        "after:content-['*'] after:ml-0.5 after:text-danger after:font-bold",
    },
    helpText: {
      base: "text-[length:var(--text-xs)] text-muted mt-1",
    },
    error: {
      base: "text-[length:var(--text-xs)] text-danger font-medium mt-1.5",
    },
    section: {
      title:
        "text-[length:var(--text-lg)] font-bold text-foreground tracking-tight",
      description:
        "text-[length:var(--text-sm)] text-muted mt-1 leading-relaxed",
      card: "app-card",
      header: "mb-[var(--space-md)]",
      content: "flex flex-col gap-6",
    },
    shell: {
      header: {
        padding: "py-[var(--space-md)] px-1",
        border: "border-b border-border",
        background: "bg-background/80",
        shadow: "shadow-sm",
      },
      body: {
        padding:
          "data-[layout-mode=portal]:p-0 p-[var(--space-md)] lg:p-[var(--space-xl)]",
      },
      footer: {
        padding: "py-[var(--space-md)]",
        border: "border-t border-border",
        background: "bg-background/80",
      },
      stepper: {
        margin: "mb-8",
      },
    },
  },
};

export const BASE_FIELD_STYLES = {
  /** Outer container: flex traits and grid alignment basics. */
  base: `form-field ${formTokens.field.shell} flex flex-col opacity-100`,
  /** Label foundation: font-weight, dark mode support, and hover transitions. */
  label: `${formTokens.text.label} mb-2 transition-all group-hover:text-primary group-focus-within:text-primary`,
  /** Interactive box: The boundary for borders, backgrounds, and focus-rings. */
  inputWrapper: `${formTokens.field.surface.idle} overflow-hidden isolation-auto flex items-center transition-all duration-300`,
  /** Raw control: Stripped of native borders/outlines to live cleanly inside the wrapper. */
  input: `${formTokens.input.base} ${formTokens.text.value}`,
  description: `${formTokens.text.description} mt-2 font-medium border-l-2 border-primary/20 pl-3 opacity-60`,
  errorMessage: `${formTokens.text.error} mt-1.5 flex items-center gap-1.5`,
  helperWrapper: "mt-2",
  clearButton:
    "absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-foreground cursor-pointer transition-all hover:scale-125 z-[var(--z-overlap)]",
} as const;

/**
 * Helper to get Tailwind classes for visual variants
 */
export function getFieldVariantClasses(
  field: FormField,
  hasError: boolean = false,
  theme: FormTheme = DEFAULT_FORM_THEME,
  useFocusWithin: boolean = false
): string {
  const variant = (field.meta?.ui?.variant || "outlined") as keyof NonNullable<
    NonNullable<NonNullable<FormTheme["components"]>["input"]>["variants"]
  >;

  // Helper to extract state string
  const getVariantString = (styles?: ComponentStateStyles) => {
    if (!styles) return "";
    const parts = [styles.base];
    // Note: Hover/Focus/Error states in the theme are strings containing pseudo-modifiers (e.g. "hover:bg-red-500")
    parts.push(styles.hover || "");

    let focusClass = styles.focus || "";
    if (useFocusWithin) {
      focusClass = focusClass.replace(/focus:/g, "focus-within:");
    }
    parts.push(focusClass);

    if (hasError) parts.push(styles.error || "");
    return parts.filter(Boolean).join(" ");
  };

  const componentTheme = theme.components?.input?.variants;

  if (componentTheme && componentTheme[variant]) {
    return getVariantString(componentTheme[variant]);
  }

  // Fallback to Default Theme
  const defaultDetails =
    DEFAULT_FORM_THEME.components?.input?.variants?.[variant];
  return getVariantString(defaultDetails);
}

/**
 * Build layout dynamically from FieldLayout semantic properties
 */
export function buildFieldLayoutCSS(
  layout?: FieldLayout
): Record<string, string> {
  if (!layout) return {};

  const style: Record<string, string> = {};

  if (layout.fullWidth) style.width = "100%";
  // NOTE: columnSpan is now handled via Tailwind grid classes in buildFieldWrapperClasses.
  // We avoid inline flex-basis to prevent grid-layout conflicts.
  // if (layout.columnSpan) style.flexBasis = `${(layout.columnSpan / 12) * 100}%`;
  if (layout.startNewRow) style.clear = "both";

  const classes: string[] = [];
  if (layout.responsive) {
    if (layout.responsive.hideOnMobile) classes.push("hidden sm:block");
    if (layout.responsive.hideOnTablet) classes.push("sm:hidden md:block");
    if (layout.responsive.hideOnDesktop) classes.push("md:hidden lg:block");
  }
  if (layout.gridClass) classes.push(layout.gridClass);

  if (classes.length) style.className = classes.join(" ");

  return style;
}

/**
 * getIntentClasses (Semantic Styling)
 *
 * Maps intent identifiers to atmospheric accents.
 */
function getIntentClasses(
  intent?: string,
  type: "input" | "button" = "input"
): string {
  if (type === "button") {
    switch (intent) {
      case "primary":
        return "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md";
      case "secondary":
        return "bg-surface text-foreground border border-border hover:bg-subtle shadow-sm";
      case "danger":
        return "bg-danger text-danger-foreground hover:bg-danger/90 shadow-md shadow-danger/10";
      case "success":
        return "bg-success text-success-foreground hover:bg-success/90 shadow-md shadow-success/10";
      case "warning":
        return "bg-warning text-warning-foreground hover:bg-warning/90 shadow-md shadow-warning/10";
      case "subtle":
        return "bg-transparent text-foreground/60 hover:text-foreground hover:bg-subtle";
      default:
        return "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md";
    }
  }

  switch (intent) {
    case "primary":
      return "text-primary border-primary group-focus-within:text-primary";
    case "secondary":
      return "text-secondary border-secondary group-focus-within:text-secondary";
    case "success":
      return "text-success border-success group-focus-within:text-success";
    case "danger":
      return "text-danger border-danger group-focus-within:text-danger";
    case "warning":
      return "text-warning border-warning group-focus-within:text-warning";
    case "info":
      return "text-blue-500 border-blue-500 group-focus-within:text-blue-500";
    default:
      return "";
  }
}

/**
 * getBorderRadiusClass
 *
 * Maps semantic radius identifiers to Tailwind rounded classes.
 */
export function getBorderRadiusClass(
  radius?: string | "none" | "small" | "medium" | "large" | "full" | "default"
): string {
  switch (radius) {
    case "none":
      return "rounded-none";
    case "small":
      return "rounded-[var(--radius-sm)]";
    case "medium":
      return "rounded-[var(--radius-md)]";
    case "large":
      return "rounded-[var(--radius-lg)]";
    case "full":
      return "rounded-[var(--radius-full)]";
    case "default":
    default:
      return "rounded-[var(--radius-md)]";
  }
}

/**
 * Build Section Classes (BEM + Tailwind)
 *
 * @deprecated Use `adapter.buildSectionStyles()` via `useStyleAdapter()` instead.
 */
export function buildSectionClasses(section: FormSection) {
  const { layout, meta } = section;

  // Base Section Container
  const isCard = layout?.type === "card";
  const isTabs = layout?.type === "tabs";

  const base = [
    "form-section z-layout-boundary transition-all duration-300", // BEM Block
    isCard ? "z-card z-card--glass !bg-surface/90" : "",
    isTabs ? "border-b border-border mb-6" : "",
    layout?.className || "",
    meta?.className || "",
  ]
    .filter(Boolean)
    .join(" ");

  // Section Header
  const header = [
    "form-section__header relative flex flex-col gap-1",
    isCard
      ? "px-8 py-6 border-b border-border bg-surface-raised rounded-t-[var(--radius-xl)]"
      : "pl-6 mb-6 border-l-4 border-primary/20",
  ]
    .filter(Boolean)
    .join(" ");

  // Section Title
  const title = `form-section__title z-heading-2 ${
    DEFAULT_FORM_THEME.components?.section?.title || ""
  }`;

  // Section Description
  const description = `form-section__description z-body !text-[var(--text-sm)] opacity-50 ${
    DEFAULT_FORM_THEME.components?.section?.description || ""
  }`;

  // Section Content
  const content = ["form-section__content", isCard ? "p-[var(--space-md)]" : ""]
    .filter(Boolean)
    .join(" ");

  return { base, header, title, description, content };
}

/**
 * Build Form Shell Classes (DCS / ECS Slot Architecture)
 * Handles root-level wrapper styling, backwards compatibility, and custom DCS slots.
 *
 * @deprecated Use `adapter.buildShellStyles()` via `useStyleAdapter()` instead.
 */
export function buildFormShellClasses(
  definition: FormDefinition,
  theme?: FormTheme,
  shellProps?: { background?: string; className?: string }
) {
  const { settings, style } = definition;
  const density = theme?.density || settings?.density || "comfortable";

  // 1. Density & Global Config Mapping
  const isPortal = settings?.layoutMode === "portal";
  const isSplit = definition.layout === "split";
  const userSlots = style?.classNames || {};
  const widthClass = getFormContainerClass(settings?.width);
  const radiusClass = getBorderRadiusClass(theme?.radius || "large");

  // 2. Compute the exact DCS slots (merging BEM + Back-Compat + User DCS constraints)
  return {
    shell: cn(
      "page-shell z-shell transition-all duration-500",
      isPortal
        ? "page-shell--portal min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-architectural-grid"
        : settings?.layoutMode === "drawer"
          ? "page-shell--drawer h-full w-full bg-surface"
          : settings?.layoutMode === "modal"
            ? "page-shell--modal h-full w-full bg-surface"
            : "page-shell--dashboard w-full h-full p-6",
      isPortal && shellProps?.background === "gradient"
        ? "bg-gradient-to-br from-surface to-background text-foreground"
        : isPortal
          ? "bg-transparent text-foreground"
          : "",
      shellProps?.className,
      userSlots.shell
    ),
    atmosphere: cn(
      "page-shell__atmosphere",
      !isPortal ? "hidden" : "",
      userSlots.atmosphere
    ),
    root: cn(
      "form-root w-full transition-all duration-700 animate-in fade-in zoom-in-95",
      `z-density-${density}`,
      `form-root--${density}`,
      !isPortal ? widthClass : "",
      isPortal
        ? cn(
            "z-card z-card--glass !bg-surface/95 relative transition-all duration-700 shadow-premium",
            radiusClass,
            isSplit
              ? "w-[840px] max-w-[95vw] flex-shrink-0 p-0 overflow-hidden"
              : "w-full p-8 lg:p-10"
          )
        : settings?.layoutMode === "drawer" || settings?.layoutMode === "modal"
          ? "p-0 border-none shadow-none" // Flatten shell when inside a container
          : "",
      style?.customClasses, // Legacy property support
      userSlots.root
    ),
    header: cn(
      "form-header",
      isPortal ? "mb-6 px-1" : "mb-4",
      userSlots.header
    ),
    title: cn(
      "form-header__title text-[var(--text-3xl)] font-black text-foreground tracking-tightest leading-none drop-shadow-sm",
      userSlots.title
    ),
    description: cn(
      "form-header__description mt-1.5 text-[var(--text-sm)] text-foreground/50 leading-relaxed font-medium",
      userSlots.description
    ),
    body: cn("form-body", userSlots.body),
    footer: cn("form-footer", userSlots.footer),
  };
}

/**
 * Build Form Action Classes (Action Bar)
 *
 * @deprecated Use `adapter.buildActionStyles()` via `useStyleAdapter()` instead.
 */
export function buildFormActionClasses(
  definition: FormDefinition,
  theme: FormTheme = DEFAULT_FORM_THEME
) {
  const isPortal = definition.settings?.layoutMode === "portal";
  const align =
    definition.settings?.width === "centered"
      ? "justify-center"
      : "justify-end";

  const base = [
    "form-actions", // BEM Block
    "flex items-center w-full",
    isPortal
      ? "mt-8 flex-col gap-4"
      : `mt-8 gap-4 pt-6 border-t border-border ${align}`,
  ]
    .filter(Boolean)
    .join(" ");

  const submitButton =
    theme.components?.actions?.submitButton ||
    (isPortal
      ? "base-btn w-full py-3.5 text-[var(--text-sm)] rounded-xl shadow-lg hover:shadow-primary/25 bg-primary text-primary-foreground transition-all duration-300"
      : "base-btn");

  const cancelButton =
    theme.components?.actions?.cancelButton ||
    (isPortal
      ? "base-btn-secondary w-full py-3.5 bg-surface text-foreground hover:bg-subtle rounded-xl border border-border transition-all duration-300"
      : "base-btn-secondary bg-surface text-foreground hover:bg-subtle");

  return { base, submitButton, cancelButton };
}

export interface HeroUIStyleResult {
  [key: string]: string;
  base: string;
  label: string;
  inputWrapper: string;
  input: string;
  clearButton: string;
  helperWrapper: string;
  description: string;
  errorMessage: string;
}

export interface DetailedStyleResult {
  classes: HeroUIStyleResult;
  metadata: {
    sources: {
      base: typeof BASE_FIELD_STYLES;
      theme: { variant: string; radius: string };
      intent: string;
      heuristic: any;
      explicit: any;
      magic: {
        autoSpacing: string;
        density: { isCompact: boolean; isSpacious: boolean };
      };
    };
  };
}

/**
 * @deprecated Use `adapter.buildFieldStyles()` via `useStyleAdapter()` instead.
 * This function is kept for backward compatibility and testing only.
 */
export function buildHeroUIClasses(
  field: FormField,
  isEditor?: boolean,
  hasError?: boolean,
  theme?: FormTheme,
  includeMetadata?: false
): HeroUIStyleResult;

export function buildHeroUIClasses(
  field: FormField,
  isEditor?: boolean,
  hasError?: boolean,
  theme?: FormTheme,
  includeMetadata?: true
): DetailedStyleResult;

export function buildHeroUIClasses(
  field: FormField,
  isEditor: boolean = false,
  hasError: boolean = false,
  theme: FormTheme = DEFAULT_FORM_THEME,
  /** If true, returns the breakdown of classes by source (Theme, Intent, Heuristic, etc.) */
  includeMetadata: boolean = false
): HeroUIStyleResult | DetailedStyleResult {
  const responsive = getResponsiveClasses(field, isEditor);

  // 0. Density Overlays
  const isCompact = theme.density === "compact";
  const isSpacious = theme.density === "spacious";

  // 1. Canonical source of truth: meta.ui.classNames
  const explicitClassNames = {
    ...(field.properties?.classNames || {}),
    ...(field.meta?.ui?.classNames || {}),
  };

  const allCustomClasses = [
    field.meta?.ui?.className,
    field.className,
    field.properties?.customClasses,
  ]
    .filter(Boolean)
    .join(" ");
  const heuristicClasses = HeuristicClassParser.parse(allCustomClasses);

  // 3. Spacing Magic (Refactored to DCS Spatial Tokens)
  // Instead of aggressive !mb-10, we now use contextual spacing that allows
  // for nested alignment.
  const autoSpacing = isCompact ? "mb-2" : isSpacious ? "mb-6" : "mb-0";

  // 4. Variant/Intent Resolution
  const variantClasses = getFieldVariantClasses(field, hasError, theme, true);
  const isButton = field.type === "button" || field.properties?.submit;
  const intentClasses = getIntentClasses(
    field.properties?.intent,
    isButton ? "button" : "input"
  );
  const radiusClasses = getBorderRadiusClass(field.properties?.borderRadius);

  // 5. Build Result
  const result = {
    base: cn(
      BASE_FIELD_STYLES.base,
      autoSpacing,
      !isEditor && responsive.visibility,
      heuristicClasses.wrapper,
      explicitClassNames.base || (explicitClassNames as any).wrapper,
      "min-w-0"
    ),
    label: cn(
      BASE_FIELD_STYLES.label,
      heuristicClasses.label,
      explicitClassNames.label
    ),
    inputWrapper: cn(
      BASE_FIELD_STYLES.inputWrapper,
      variantClasses,
      intentClasses,
      radiusClasses,
      heuristicClasses.inputWrapper,
      explicitClassNames.inputWrapper,
      isSpacious
        ? "min-h-[48px] px-4 py-2.5 gap-3.5"
        : isCompact
          ? "min-h-[32px] px-3 py-1 gap-2"
          : "min-h-[40px] px-3.5 py-2 gap-3"
    ),
    input: cn(
      BASE_FIELD_STYLES.input,
      field.type === "checkbox" || field.type === "radio"
        ? "inline-block w-auto"
        : field.type === "select"
          ? "flex w-full border-transparent bg-transparent focus:ring-0 min-h-0 py-0"
          : "block w-full border-transparent bg-transparent focus:ring-0 min-h-0 py-0 leading-normal",
      isCompact ? "text-xs" : isSpacious ? "text-base" : "text-sm",
      field.properties?.alignment,
      heuristicClasses.input,
      explicitClassNames.input
    ),
    clearButton: cn(
      BASE_FIELD_STYLES.clearButton,
      explicitClassNames.clearButton
    ),
    helperWrapper: cn(
      BASE_FIELD_STYLES.helperWrapper,
      explicitClassNames.helperWrapper
    ),
    description: cn(
      BASE_FIELD_STYLES.description,
      heuristicClasses.description,
      explicitClassNames.description
    ),
    errorMessage: cn(
      BASE_FIELD_STYLES.errorMessage,
      theme.components?.error?.base,
      explicitClassNames.errorMessage
    ),
    ...((explicitClassNames as any).tag || (explicitClassNames as any).badge
      ? {
          tag: cn(
            (explicitClassNames as any).tag,
            (explicitClassNames as any).badge
          ),
          badge: cn(
            (explicitClassNames as any).badge,
            (explicitClassNames as any).tag
          ),
        }
      : {}),
    ...((explicitClassNames as any).overflowBadge
      ? { overflowBadge: (explicitClassNames as any).overflowBadge }
      : {}),
    ...((explicitClassNames as any).selectedArea
      ? { selectedArea: (explicitClassNames as any).selectedArea }
      : {}),
    ...((explicitClassNames as any).removeButton
      ? { removeButton: (explicitClassNames as any).removeButton }
      : {}),
  };

  if (includeMetadata) {
    return {
      classes: result,
      metadata: {
        sources: {
          base: BASE_FIELD_STYLES,
          theme: { variant: variantClasses, radius: radiusClasses },
          intent: intentClasses,
          heuristic: heuristicClasses,
          explicit: explicitClassNames,
          magic: { autoSpacing, density: { isCompact, isSpacious } },
        },
      },
    };
  }

  return result;
}

/**
 * STRATEGY: Heuristic Class Parsing
 *
 * This strategy uses regex pattern matching to guess the intent of a raw Tailwind class string.
 * It is an Adapter that allows users to pass a single string (e.g., "mb-4 bg-red-500 text-white")
 * and have the engine intelligently distribute those classes to the correct sub-components (Wrapper, Input, Label).
 */
const HeuristicClassParser = {
  parse: (customClasses: string) => {
    if (!customClasses.trim()) {
      return {
        wrapper: "",
        inputWrapper: "",
        input: "",
        label: "",
        description: "",
      };
    }

    const classes = customClasses.trim().split(/\s+/);
    const result = {
      wrapper: [] as string[],
      inputWrapper: [] as string[],
      input: [] as string[],
      label: [] as string[],
      description: [] as string[],
    };

    classes.forEach((className) => {
      // 1. Layout & Positioning → Wrapper (base)
      if (
        className.match(
          /(?:^|:)(m[tlrbx]?-[0-9.]+|p[tlrbx]?-[0-9.]+|w-[0-9./]+|h-[0-9./]+|max-w-|min-w-|flex|grid|col-|row-|gap-|space-|justify-|items-|self-|absolute|relative|top-|bottom-|left-|right-|z-)/
        )
      ) {
        result.wrapper.push(className);
      }
      // 2. Label-specific typography → Label slot
      else if (
        className.match(
          /(?:^|:)(tracking-|uppercase|capitalize|lowercase|whitespace-|text-(xs|sm|base|lg|xl|2xl|3xl))/
        )
      ) {
        result.label.push(className);
      }
      // 3. Input box decoration → Input Wrapper
      else if (
        className.match(/(?:^|:)(border|shadow|bg-|rounded|ring|backdrop-blur)/)
      ) {
        result.inputWrapper.push(className);
      }
      // 4. Typography & content → Input
      else if (
        className.match(
          /(?:^|:)(text-|font-|placeholder|italic|underline|leading-)/
        )
      ) {
        result.input.push(className);
      }
      // 5. Default fallback → Input Wrapper
      else {
        result.inputWrapper.push(className);
      }
    });

    return {
      wrapper: result.wrapper.join(" "),
      inputWrapper: result.inputWrapper.join(" "),
      input: result.input.join(" "),
      label: result.label.join(" "),
      description: result.description.join(" "),
    };
  },
};

function getResponsiveClasses(field: FormField, isEditor: boolean = false) {
  const classes: string[] = [];

  // Only apply responsive hiding classes in preview/renderer, not in editor
  // Cast to any to avoid union type issues between GridLayoutConfig and FieldLayout
  const layout = field.layout as any;
  if (!isEditor && layout && layout.responsive) {
    if (layout.responsive.hideOnMobile) {
      classes.push("hidden sm:block");
    }
    if (layout.responsive.hideOnTablet) {
      classes.push("sm:hidden lg:block");
    }
    if (layout.responsive.hideOnDesktop) {
      classes.push("lg:hidden");
    }
  }

  return {
    visibility: classes.join(" "),
  };
}

export function buildFieldWrapperClasses(
  field: FormField,
  parentLayout: RuntimeLayoutConfig = { type: "grid" as const, columns: 12 }
): string {
  return getLayoutItemClasses(field, parentLayout);
}

// --- Form Configuration Constants ---

export const FORM_WIDTH_OPTIONS = [
  { value: "centered", label: "Centered (Standard)" },
  { value: "contained", label: "Contained (Boxed)" },
  { value: "full", label: "Full Width" },
] as const;

export const FORM_DENSITY_OPTIONS = [
  { value: "compact", label: "Compact" },
  { value: "comfortable", label: "Comfortable" },
  { value: "spacious", label: "Spacious" },
] as const;

export const FORM_THEME_COLORS = [
  "#3b82f6", // Blue
  "#ef4444", // Red
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#6366f1", // Indigo
  "#8b5cf6", // Violet
  "#ec4899", // Pink
  "#111827", // Gray
];

// --- Form Configuration Helpers ---

export function getFormContainerClass(
  width?: "full" | "contained" | "centered"
) {
  switch (width) {
    case "full":
      return "w-full max-w-none";
    case "contained":
      return "max-w-7xl mx-auto px-4";
    case "centered":
    default:
      return "max-w-3xl mx-auto";
  }
}

export function getFormDensityClass(
  density?: "compact" | "comfortable" | "spacious"
) {
  switch (density) {
    case "compact":
      return "space-y-[var(--space-md)] gap-x-4"; // Ensure horizontal gap even in compact
    case "spacious":
      return "space-y-[var(--space-xl)] gap-x-8";
    case "comfortable":
    default:
      return "space-y-[var(--space-lg)] gap-x-6";
  }
}
