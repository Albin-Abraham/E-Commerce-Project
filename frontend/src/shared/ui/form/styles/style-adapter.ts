/**
 * StyleAdapter — Abstract interface for form style generation.
 *
 * Implementations (TailwindAdapter, SassAdapter, CSSInJSAdapter, etc.)
 * must return the same slot shapes. The form system consumes these slot
 * maps and merges them with user-provided classNames from meta.ui.classNames.
 *
 * CSS variables (`--color-primary`, `--space-4`, `--radius-md`) work identically
 * across all adapters — the adapter only controls how layout/visual classes are
 * generated, not how tokens are resolved.
 */
import type { FormField } from "@ui/form/fields";
import type { FormTheme } from "@ui/form/styles/FormTheme";
import type { FormDefinition } from "@ui/form/types";
import type { FormSection } from "@ui/form/types/section";

// ---------------------------------------------------------------------------
// Slot result types
// ---------------------------------------------------------------------------

/** The 10 canonical field slots from FieldUI.classNames. */
export interface FieldStyleSlots {
  base: string;
  label: string;
  inputWrapper: string;
  input: string;
  clearButton: string;
  helperWrapper: string;
  description: string;
  errorMessage: string;
  /** Optional — only populated by field-type-specific adapters. */
  [key: string]: string;
}

/** Shell-level slot map returned by buildFormShellClasses. */
export interface ShellStyleSlots {
  shell: string;
  atmosphere: string;
  root: string;
  header: string;
  title: string;
  description: string;
  body: string;
  footer: string;
}

/** Section-level slot map returned by buildSectionClasses. */
export interface SectionStyleSlots {
  base: string;
  header: string;
  title: string;
  description: string;
  content: string;
}

/** Action bar slot map returned by buildFormActionClasses. */
export interface ActionStyleSlots {
  base: string;
  submitButton: string;
  cancelButton: string;
}

// ---------------------------------------------------------------------------
// Adapter interface
// ---------------------------------------------------------------------------

export interface StyleAdapter {
  /** Unique identifier for debugging and adapter selection. */
  readonly name: string;

  /**
   * Build field-level slot classes.
   *
   * @param field  The field definition (type, properties, meta.ui.classNames, etc.)
   * @param isEditor  Whether rendering inside the builder (disables responsive hiding)
   * @param hasError  Whether the field currently has a validation error
   * @param theme     Active form theme (density, radius, component overrides)
   */
  buildFieldStyles(
    field: FormField,
    isEditor?: boolean,
    hasError?: boolean,
    theme?: FormTheme
  ): FieldStyleSlots;

  /**
   * Build shell-level slot classes.
   *
   * @param definition  The full form definition (settings, layout, style)
   * @param theme       Active form theme
   * @param shellProps  Optional shell-level overrides (background, className)
   */
  buildShellStyles(
    definition: FormDefinition,
    theme?: FormTheme,
    shellProps?: { background?: string; className?: string }
  ): ShellStyleSlots;

  /**
   * Build section-level slot classes.
   *
   * @param section  The section definition (layout, meta)
   * @param theme    Active form theme (density, radius, component overrides)
   */
  buildSectionStyles(
    section: FormSection,
    theme?: FormTheme
  ): SectionStyleSlots;

  /**
   * Build action-bar slot classes.
   *
   * @param definition  The full form definition
   * @param theme       Active form theme
   */
  buildActionStyles(
    definition: FormDefinition,
    theme?: FormTheme
  ): ActionStyleSlots;
}
