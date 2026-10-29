/**
 * SassAdapter — StyleAdapter using semantic SASS class names.
 *
 * Returns semantic class names (`z-field`, `z-field--outlined`, etc.)
 * instead of raw Tailwind utilities. The SCSS files in `./scss/` define
 * the actual styles using CSS variables from the token system.
 *
 * CSS variables (`--color-primary`, `--space-4`, `--radius-md`) work
 * identically across Tailwind and SASS — the adapter only controls how
 * layout/visual classes are generated, not how tokens are resolved.
 */
import type { FormField } from "@ui/form/fields";
import type { FormTheme } from "@ui/form/styles/FormTheme";
import type { FormDefinition } from "@ui/form/types";
import type { FormSection } from "@ui/form/types/section";

import { cn } from "@libs/utils";

import type {
  ActionStyleSlots,
  FieldStyleSlots,
  SectionStyleSlots,
  ShellStyleSlots,
  StyleAdapter,
} from "./style-adapter";

// ---------------------------------------------------------------------------
// Semantic class name helpers
// ---------------------------------------------------------------------------

function getVariantClass(variant: string, hasError: boolean): string {
  const base = `z-input-wrapper z-input-wrapper--${variant}`;
  return hasError ? `${base} z-input-wrapper--error` : base;
}

function getIntentClass(intent?: string): string {
  if (!intent) return "";
  return `z-input-wrapper z-input-wrapper--${intent}`;
}

function getRadiusClass(radius?: string): string {
  if (!radius || radius === "default") return "";
  if (radius === "none") return "z-input-wrapper--radius-none";
  return `z-input-wrapper--radius-${radius}`;
}

function getDensityFieldClass(density?: string): string {
  if (density === "compact") return "z-field--compact";
  if (density === "spacious") return "z-field--spacious";
  return "";
}

function getDensityInputClass(density?: string): string {
  if (density === "compact") return "z-input--compact";
  if (density === "spacious") return "z-input--spacious";
  return "";
}

function getResponsiveClass(field: FormField, isEditor: boolean): string {
  if (isEditor) return "";
  const layout = field.layout as any;
  if (!layout?.responsive) return "";

  const classes: string[] = [];
  if (layout.responsive.hideOnMobile) classes.push("z-field--hidden-mobile");
  if (layout.responsive.hideOnTablet) classes.push("z-field--hidden-tablet");
  if (layout.responsive.hideOnDesktop) classes.push("z-field--hidden-desktop");
  return classes.join(" ");
}

function getInputTypeClass(field: FormField): string {
  if (field.type === "checkbox" || field.type === "radio") {
    return `z-input z-input--${field.type}`;
  }
  if (field.type === "select") {
    return "z-input z-input--select";
  }
  return "z-input";
}

// ---------------------------------------------------------------------------
// HeuristicClassParser — semantic version
//
// Unlike the Tailwind version which distributes raw utilities by regex,
// the SASS adapter treats all custom classes as wrapper-level overrides.
// This is simpler and avoids the misrouting problem.
// ---------------------------------------------------------------------------
function parseCustomClasses(customClasses: string): {
  wrapper: string;
  inputWrapper: string;
  input: string;
  label: string;
  description: string;
} {
  if (!customClasses.trim()) {
    return {
      wrapper: "",
      inputWrapper: "",
      input: "",
      label: "",
      description: "",
    };
  }

  // For SASS adapter, custom classes go to wrapper (no heuristic distribution)
  return {
    wrapper: customClasses.trim(),
    inputWrapper: "",
    input: "",
    label: "",
    description: "",
  };
}

// ---------------------------------------------------------------------------
// SassAdapter
// ---------------------------------------------------------------------------

export class SassAdapter implements StyleAdapter {
  readonly name = "sass";

  buildFieldStyles(
    field: FormField,
    isEditor: boolean = false,
    hasError: boolean = false,
    theme: FormTheme = {
      density: "comfortable",
      radius: "large",
      motion: true,
    } as FormTheme
  ): FieldStyleSlots {
    const variant = (field.meta?.ui?.variant || "outlined") as string;
    const isButton = field.type === "button" || field.properties?.submit;
    const intent = field.properties?.intent;

    // Canonical source of truth: meta.ui.classNames
    const canonicalClassNames = field.meta?.ui?.classNames || {};

    // DEPRECATED FALLBACK
    const legacyPropClassNames = field.properties?.classNames || {};
    const allCustomClasses = [
      field.properties?.customClasses || "",
      field.custom?.cssClasses?.join(" ") || "",
    ]
      .filter(Boolean)
      .join(" ");
    const heuristicClasses = parseCustomClasses(allCustomClasses);

    const explicitClassNames = {
      ...legacyPropClassNames,
      ...canonicalClassNames,
    };

    return {
      base: cn(
        "z-field",
        getDensityFieldClass(theme.density),
        getResponsiveClass(field, isEditor),
        heuristicClasses.wrapper,
        explicitClassNames.base || (explicitClassNames as any).wrapper
      ),
      label: cn("z-label", heuristicClasses.label, explicitClassNames.label),
      inputWrapper: cn(
        getVariantClass(variant, hasError),
        !isButton && intent ? getIntentClass(intent) : "",
        getRadiusClass(field.properties?.borderRadius),
        heuristicClasses.inputWrapper,
        explicitClassNames.inputWrapper
      ),
      input: cn(
        getInputTypeClass(field),
        getDensityInputClass(theme.density),
        field.properties?.alignment,
        heuristicClasses.input,
        explicitClassNames.input
      ),
      clearButton: cn("z-clear-button", explicitClassNames.clearButton),
      helperWrapper: cn("z-helper-wrapper", explicitClassNames.helperWrapper),
      description: cn(
        "z-description",
        heuristicClasses.description,
        explicitClassNames.description
      ),
      errorMessage: cn("z-error-message", explicitClassNames.errorMessage),
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
    const isSplit = definition.layout === "split";
    const userSlots = style?.classNames || {};

    // Width class
    let widthClass = "";
    if (!isPortal) {
      if (settings?.width === "full") widthClass = "z-shell__root--full";
      else if (settings?.width === "contained")
        widthClass = "z-shell__root--contained";
      else widthClass = "z-shell__root--centered";
    }

    // Mode class
    let modeClass = "z-shell--dashboard";
    if (isPortal) modeClass = "z-shell--portal";
    else if (settings?.layoutMode === "drawer") modeClass = "z-shell--drawer";
    else if (settings?.layoutMode === "modal") modeClass = "z-shell--modal";

    // Gradient class for portal
    const gradientClass =
      isPortal && shellProps?.background === "gradient"
        ? "z-shell--gradient"
        : "";

    return {
      shell: cn(
        "z-shell",
        modeClass,
        gradientClass,
        shellProps?.className,
        userSlots.shell
      ),
      atmosphere: cn("z-shell__atmosphere", userSlots.atmosphere),
      root: cn(
        "z-shell__root",
        `z-shell__root--${density}`,
        widthClass,
        isPortal
          ? cn(isSplit ? "z-shell__root--split" : "", style?.customClasses)
          : "",
        userSlots.root
      ),
      header: cn("z-shell__header", userSlots.header),
      title: cn("z-shell__title", userSlots.title),
      description: cn("z-shell__description", userSlots.description),
      body: cn("z-shell__body", userSlots.body),
      footer: cn("z-shell__footer", userSlots.footer),
    };
  }

  buildSectionStyles(section: FormSection): SectionStyleSlots {
    const { layout, meta } = section;
    const isCard = layout?.type === "card";
    const isTabs = layout?.type === "tabs";

    return {
      base: cn(
        "z-section",
        isCard ? "z-section--card" : "",
        isTabs ? "z-section--tabs" : "",
        layout?.className || "",
        meta?.className || ""
      ),
      header: cn("z-section__header", isCard ? "" : ""),
      title: "z-section__title",
      description: "z-section__description",
      content: "z-section__content",
    };
  }

  buildActionStyles(
    definition: FormDefinition,
    _theme?: FormTheme
  ): ActionStyleSlots {
    const isPortal = definition.settings?.layoutMode === "portal";
    const isCentered = definition.settings?.width === "centered";

    return {
      base: cn(
        "z-actions",
        isPortal ? "z-actions--portal" : "",
        !isPortal && isCentered ? "z-actions--centered" : ""
      ),
      submitButton: "z-actions__submit",
      cancelButton: "z-actions__cancel",
    };
  }
}

/** Default singleton for SASS adapter. */
export const defaultSassAdapter = new SassAdapter();
