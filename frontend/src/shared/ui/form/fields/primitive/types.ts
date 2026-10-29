import type { ReactNode } from "react";

import type { FormField } from "@ui/form/fields";
import type { TranslatedText } from "@ui/form/types/i18n-accessibility";
import type { FieldLayout } from "@ui/form/utils/form-layout-utils";

/**
 * Detailed error object for validation failures.
 */
export interface DetailedFieldError {
  code: string;
  message: string;
  fieldId: string;
  details?: unknown;
}

// ── Segregated Interfaces (SOLID / Interface Segregation Principle) ──────────

/**
 * Core Headless Control Atom Contract.
 * Pure native input attributes and event handlers without external layout or shell baggage.
 */
export interface ControlAtomProps<V = unknown> {
  id?: string;
  name?: string;
  value?: V | null | undefined;
  defaultValue?: V;
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  autoFocus?: boolean;
  tabIndex?: number;
  placeholder?: string;
  onChange?: (val: V) => void;
  onBlur?: (e?: React.FocusEvent<any>) => void;
  onFocus?: (e?: React.FocusEvent<any>) => void;
  onKeyDown?: (e?: React.KeyboardEvent<any>) => void;
}

/**
 * WAI-ARIA 1.2+ Accessibility Contract for Form Controls.
 */
export interface FieldA11yProps {
  role?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
  "aria-required"?: boolean;
  "aria-errormessage"?: string;
  "aria-keyshortcuts"?: string;
  "aria-checked"?: boolean | "mixed";
  "aria-busy"?: boolean;
}

/**
 * Visual Skin & Presentation Props.
 */
export interface FieldPresentationProps {
  density?: "compact" | "comfortable" | "spacious";
  className?: string;
  styles?: Record<string, string | undefined>;
}

/**
 * Canonical Base Props for all Form UI Primitives.
 * Unifies the Form Definition Trinity (`name`, `type`, `component`) with idiomatic flat React props.
 */
export interface BaseFieldProps<V = unknown>
  extends ControlAtomProps<V>,
    FieldA11yProps,
    FieldPresentationProps {
  // ── 1. The Canonical Form Definition Trinity ───────────────────────
  /** Form state data binding key & submission payload key (e.g. "email", "address.city") */
  name?: string;

  /** Semantic data type (e.g. "text", "number", "select", "boolean", "date", "file") */
  type?: string;

  /** Presentation component mapping key or React component override */
  component?: string | React.ComponentType<any>;

  // ── 2. Identification & Accessibility ─────────────────────────────
  /** Unique DOM identifier (defaults to name) */
  id?: string;

  /** Human-readable field label or translated text */
  label?: string | TranslatedText;

  /** Input placeholder hint text */
  placeholder?: string | TranslatedText;

  /** Helper or description text displayed beneath the field */
  description?: string | TranslatedText;
  helperText?: string | TranslatedText;

  // ── 3. State & Change Handling ─────────────────────────────────────
  /** Controlled value */
  value?: V | null | undefined;

  /** Uncontrolled default initial value */
  defaultValue?: V;

  /** Value change callback */
  onChange?: (val: V) => void;

  /** Focus & blur lifecycle callbacks */
  onBlur?: (e?: React.FocusEvent<any>) => void;
  onFocus?: (e?: React.FocusEvent<any>) => void;

  // ── 4. Constraints & Feedback ─────────────────────────────────────
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  error?: string | boolean;
  errorMessage?: string;
  errors?: ReadonlyArray<DetailedFieldError>;

  // ── 5. Zenith Visual Surface & Slots ──────────────────────────────
  startContent?: ReactNode;
  endContent?: ReactNode;
  leftContent?: ReactNode;
  rightContent?: ReactNode;
  prefix?: ReactNode;
  suffix?: ReactNode;
  density?: "compact" | "comfortable" | "spacious";
  className?: string;
  styles?: Record<string, string | undefined>;

  // ── 6. Advanced Engine Synchronization & Slots ────────────────────
  showPassword?: boolean;
  syncMode?: "keystroke" | "blur" | "manual";
  onClear?: () => void;
  isInvalid?: boolean;
  isEmpty?: boolean;
  version?: number;
  conflict?: { serverValue: any; clientValue: any; fieldId: string } | null;
  onSearch?: (query: string) => void;
  isLoading?: boolean;
  componentProps?: Record<string, unknown>;

  // ── 7. Full Backward Compatibility with FormField & Layout ─────────
  field?: Partial<FormField>;
  layout?: Partial<FieldLayout>;
  [key: string]: unknown;
}

/**
 * Backward-compatible alias for existing codebase usages.
 */
export type AtomicFieldProps<V = unknown> = BaseFieldProps<V>;
