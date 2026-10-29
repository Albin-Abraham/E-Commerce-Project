/**
 * TailwindAdapter — Default StyleAdapter using Tailwind CSS utilities.
 *
 * Extracts the existing form-styles.ts logic behind the StyleAdapter interface.
 * This is the zero-change migration: all existing behavior is preserved exactly.
 */
import type { FormField } from "@ui/form/fields";
import type { FormTheme } from "@ui/form/styles/FormTheme";
import type { FormDefinition } from "@ui/form/types";
import type { FormSection } from "@ui/form/types/section";
import { resolveEffectiveFieldType } from "@ui/form/utils/form-layout-utils";

import { tokens } from "@shared/theme";

import { cn } from "@libs/utils";

import type {
  ActionStyleSlots,
  FieldStyleSlots,
  SectionStyleSlots,
  ShellStyleSlots,
  StyleAdapter,
} from "./style-adapter";

const formTokens = tokens.form;

// ---------------------------------------------------------------------------
// Default theme (same as DEFAULT_FORM_THEME in FormTheme.ts / form-styles.ts)
// ---------------------------------------------------------------------------

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
      secondary: "var(--color-foreground)",
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

// ---------------------------------------------------------------------------
// Base field styles (moved from form-styles.ts)
// ---------------------------------------------------------------------------

export const BASE_FIELD_STYLES = {
  base: `form-field ${formTokens.field.shell} flex flex-col opacity-100`,
  label: `${formTokens.text.label} mb-2 transition-all group-hover:text-primary group-focus-within:text-primary`,
  inputWrapper: `${formTokens.field.surface.idle} overflow-hidden isolation-auto flex items-center transition-all duration-300`,
  input: `${formTokens.input.base} ${formTokens.text.value}`,
  description: `${formTokens.text.description} mt-2 font-medium border-l-2 border-primary/20 pl-3 opacity-60`,
  errorMessage: `${formTokens.text.error} mt-1.5 flex items-center gap-1.5`,
  helperWrapper: "mt-2",
  clearButton:
    "absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-foreground cursor-pointer transition-all hover:scale-125 z-[var(--z-overlap)]",
} as const;

// ---------------------------------------------------------------------------
// Internal helpers (moved from form-styles.ts)
// ---------------------------------------------------------------------------

type ComponentStateStyles = {
  base: string;
  hover?: string;
  focus?: string;
  error?: string;
};

function getFieldVariantClasses(
  field: FormField,
  hasError: boolean,
  theme: FormTheme,
  useFocusWithin: boolean
): string {
  const variant = (field.meta?.ui?.variant || "outlined") as keyof NonNullable<
    NonNullable<NonNullable<FormTheme["components"]>["input"]>["variants"]
  >;

  const getVariantString = (styles?: ComponentStateStyles) => {
    if (!styles) return "";
    const parts = [styles.base];
    parts.push(styles.hover || "");
    let focusClass = styles.focus || "";
    if (useFocusWithin) {
      focusClass = focusClass.replace(/focus:/g, "focus-within:");
    }
    parts.push(focusClass);
    if (hasError && styles.error) {
      let errClass = styles.error;
      if (useFocusWithin) {
        errClass = errClass.replace(/focus:/g, "focus-within:");
      }
      parts.push(errClass);
    }
    return parts.filter(Boolean).join(" ");
  };

  const componentTheme = theme.components?.input?.variants;
  if (componentTheme && componentTheme[variant]) {
    return getVariantString(componentTheme[variant]);
  }

  const defaultDetails =
    DEFAULT_FORM_THEME.components?.input?.variants?.[variant];
  return getVariantString(defaultDetails);
}

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

function getBorderRadiusClass(
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

function getResponsiveClasses(field: FormField, isEditor: boolean) {
  const classes: string[] = [];
  const layout = field.layout as any;
  if (!isEditor && layout && layout.responsive) {
    if (layout.responsive.hideOnMobile) classes.push("hidden sm:block");
    if (layout.responsive.hideOnTablet) classes.push("sm:hidden lg:block");
    if (layout.responsive.hideOnDesktop) classes.push("lg:hidden");
  }
  return { visibility: classes.join(" ") };
}

/**
 * HeuristicClassParser — regex-based distribution of raw class strings
 * to the correct field slot. This is the main blocker for SASS adapters.
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
    const result: Record<string, string[]> = {
      wrapper: [],
      inputWrapper: [],
      input: [],
      label: [],
      description: [],
    };

    classes.forEach((className) => {
      if (
        className.match(
          /(?:^|:)(m[tlrbx]?-[0-9.]+|p[tlrbx]?-[0-9.]+|w-[0-9./]+|h-[0-9./]+|max-w-|min-w-|flex|grid|col-|row-|gap-|space-|justify-|items-|self-|absolute|relative|top-|bottom-|left-|right-|z-)/
        )
      ) {
        result.wrapper.push(className);
      } else if (
        className.match(
          /(?:^|:)(tracking-|uppercase|capitalize|lowercase|whitespace-|text-(xs|sm|base|lg|xl|2xl|3xl))/
        )
      ) {
        result.label.push(className);
      } else if (
        className.match(/(?:^|:)(border|shadow|bg-|rounded|ring|backdrop-blur)/)
      ) {
        result.inputWrapper.push(className);
      } else if (
        className.match(
          /(?:^|:)(text-|font-|placeholder|italic|underline|leading-)/
        )
      ) {
        result.input.push(className);
      } else {
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

function getFormContainerClass(
  width?: "full" | "contained" | "centered"
): string {
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

// ---------------------------------------------------------------------------
// TailwindAdapter
// ---------------------------------------------------------------------------

export class TailwindAdapter implements StyleAdapter {
  readonly name = "tailwind";

  buildFieldStyles(
    field: FormField,
    isEditor: boolean = false,
    hasError: boolean = false,
    theme: FormTheme = DEFAULT_FORM_THEME
  ): FieldStyleSlots {
    const responsive = getResponsiveClasses(field, isEditor);
    const isCompact = theme.density === "compact";
    const isSpacious = theme.density === "spacious";

    // Canonical source of truth: meta.ui.classNames
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

    const autoSpacing = isCompact ? "mb-2" : isSpacious ? "mb-6" : "mb-0";
    const variantClasses = getFieldVariantClasses(field, hasError, theme, true);
    const isButton = field.type === "button" || field.properties?.submit;
    const intentClasses = getIntentClasses(
      field.properties?.intent,
      isButton ? "button" : "input"
    );
    const radiusClasses = getBorderRadiusClass(field.properties?.borderRadius);

    return {
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
        (() => {
          const effectiveType = resolveEffectiveFieldType(field);
          if (effectiveType === "checkbox" || effectiveType === "radio")
            return "inline-block w-auto";
          if (
            effectiveType === "select" ||
            effectiveType === "multiselect" ||
            effectiveType === "autocomplete"
          )
            return "flex w-full border-transparent bg-transparent focus:ring-0 min-h-0 py-0";
          return "block w-full border-transparent bg-transparent focus:ring-0 min-h-0 py-0 leading-normal";
        })(),
        field.properties?.labelPlacement === "inline-floating" &&
          "placeholder:text-transparent group-focus-within:placeholder:text-foreground/40",
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
    };
  }

  buildShellStyles(
    definition: FormDefinition,
    theme?: FormTheme,
    shellProps?: { background?: string; className?: string }
  ): ShellStyleSlots {
    const { settings, style } = definition;
    const density = theme?.density || settings?.density || "comfortable";
    const isPortal = settings?.layoutMode === "portal";
    const hasShell = !!definition.shell?.length;
    const isSplit = definition.layout === "split" || hasShell;
    const userSlots = style?.classNames || {};
    const widthClass = getFormContainerClass(settings?.width);
    const radiusClass = getBorderRadiusClass(theme?.radius || "large");

    const layoutMode = settings?.layoutMode || "dashboard";

    const SHELL_MODE_CLASSES: Record<string, string> = {
      portal:
        "page-shell--portal min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-subtle",
      drawer: "page-shell--drawer flex flex-col w-full",
      modal: "page-shell--modal h-full w-full bg-surface",
      dashboard: hasShell
        ? "page-shell--dashboard w-full h-full"
        : "page-shell--dashboard w-full h-full p-4 sm:p-6 lg:p-8",
    };

    const modeClass =
      SHELL_MODE_CLASSES[layoutMode] || SHELL_MODE_CLASSES.dashboard;

    return {
      shell: cn(
        "page-shell z-shell transition-all duration-500",
        modeClass,
        isPortal && shellProps?.background === "gradient"
          ? "bg-gradient-to-br from-surface to-subtle text-foreground"
          : isPortal
            ? "bg-transparent text-foreground"
            : "",
        shellProps?.className,
        userSlots.shell
      ),
      atmosphere: cn("page-shell__atmosphere hidden", userSlots.atmosphere),
      root: cn(
        "form-root w-full transition-all duration-700 animate-in fade-in zoom-in-95",
        `z-density-${density}`,
        `form-root--${density}`,
        !isPortal ? widthClass : "",
        hasShell
          ? "bg-transparent w-full flex justify-center"
          : isPortal
            ? cn(
                "bg-surface border border-border relative transition-all duration-700 shadow-xl",
                radiusClass,
                isSplit
                  ? "w-[840px] max-w-[95vw] flex-shrink-0 p-0 overflow-hidden"
                  : "w-full p-8 lg:p-10"
              )
            : settings?.layoutMode === "drawer" ||
                settings?.layoutMode === "modal"
              ? "p-0 border-none shadow-none bg-transparent"
              : "",
        style?.customClasses,
        userSlots.root
      ),
      header: cn(
        "form-header flex items-center",
        isPortal ? "mb-6 px-1 gap-4" : "mb-4 gap-6 py-6",
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

  buildSectionStyles(
    section: FormSection,
    theme: FormTheme = DEFAULT_FORM_THEME
  ): SectionStyleSlots {
    const { layout, meta } = section;
    const isCard = layout?.type === "card";
    const variant = (layout as any)?.variant || "default";
    const isTabs = layout?.type === "tabs";

    // Pure metadata-driven override capability
    const customSlots = (meta as any)?.ui?.classNames || {};
    const variantTheme = theme.components?.section?.variants?.[variant] || {};
    const layoutElevation = (layout as any)?.elevation || "md";
    const cardShadow =
      layoutElevation === "none"
        ? ""
        : layoutElevation === "sm"
          ? "shadow-sm"
          : layoutElevation === "lg"
            ? "shadow-2xl"
            : "shadow-md";

    const base = [
      "form-section z-layout-boundary transition-all duration-300",
      isCard && !customSlots.base && !variantTheme.base
        ? `z-card !bg-surface ${cardShadow}`
        : "",
      isTabs ? "border-b border-border mb-6" : "",
      variantTheme.base || "",
      layout?.className || "",
      meta?.className || "",
      customSlots.base || "",
    ]
      .filter(Boolean)
      .join(" ");

    const header = [
      "form-section__header relative flex flex-col gap-1",
      isCard && !customSlots.header && !variantTheme.header
        ? "px-8 py-6 border-b border-border bg-surface-raised rounded-t-[var(--radius-xl)]"
        : !isCard && !customSlots.header && !variantTheme.header
          ? "pl-6 mb-6 border-l-4 border-primary/20"
          : "",
      variantTheme.header || "",
      customSlots.header || "",
    ]
      .filter(Boolean)
      .join(" ");

    const title = [
      "form-section__title text-lg font-bold text-foreground tracking-tight",
      DEFAULT_FORM_THEME.components?.section?.title || "",
      variantTheme.title || "",
      customSlots.title || "",
    ]
      .filter(Boolean)
      .join(" ");

    const description = [
      "form-section__description text-xs text-foreground/60 leading-relaxed font-medium",
      DEFAULT_FORM_THEME.components?.section?.description || "",
      variantTheme.description || "",
      customSlots.description || "",
    ]
      .filter(Boolean)
      .join(" ");

    const content = [
      "form-section__content",
      isCard && !customSlots.content && !variantTheme.content
        ? "p-[var(--space-md)]"
        : "",
      variantTheme.content || "",
      customSlots.content || "",
    ]
      .filter(Boolean)
      .join(" ");

    return { base, header, title, description, content };
  }

  buildActionStyles(
    definition: FormDefinition,
    theme: FormTheme = DEFAULT_FORM_THEME
  ): ActionStyleSlots {
    const isPortal = definition.settings?.layoutMode === "portal";
    const align =
      definition.settings?.width === "centered"
        ? "justify-center"
        : "justify-end";

    const userSlots = definition.style?.classNames || {};
    const isCompact = theme.density === "compact";

    const base = [
      "form-actions",
      "flex items-center w-full",
      isPortal
        ? `${isCompact ? "mt-4" : "mt-8"} flex-col gap-3`
        : `${isCompact ? "mt-4 pt-4" : "mt-8 pt-6"} gap-4 border-t border-border ${align}`,
      userSlots.actionContainer,
    ]
      .filter(Boolean)
      .join(" ");

    const baseBtn =
      "inline-flex items-center justify-center font-medium transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";

    const submitButton =
      userSlots.submitButton ||
      theme.components?.actions?.submitButton ||
      (isPortal
        ? `${baseBtn} w-full py-3.5 text-sm font-bold rounded-xl shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 bg-primary text-primary-foreground transition-all duration-300 hover:scale-[1.01] active:scale-[0.99]`
        : `${baseBtn} px-8 py-3.5 text-sm font-bold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all duration-300 hover:scale-[1.01] active:scale-[0.99]`);

    const cancelButton =
      userSlots.cancelButton ||
      theme.components?.actions?.cancelButton ||
      (isPortal
        ? `${baseBtn} w-full py-3.5 bg-surface text-foreground hover:bg-subtle rounded-xl border border-border`
        : `${baseBtn} px-4 py-2.5 rounded-[var(--radius-md)] bg-surface text-foreground border border-border hover:bg-subtle shadow-sm`);

    return { base, submitButton, cancelButton };
  }
}

/** Default singleton — imported by the form system when no adapter is set. */
export const defaultTailwindAdapter = new TailwindAdapter();
