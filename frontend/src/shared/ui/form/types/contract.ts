import type { FieldBadgeConfig } from "../fields";
import type { ReactNode } from "react";
import type { FormDefinition } from "./index";
import type { TranslatedText } from "./i18n-accessibility";
import type { SectionLayoutConfig } from "./layout";
import type { ValidationSettings } from "./validation";
import type { FieldConditionExpression } from "./condition";
import type { BehaviorDefinition } from "./behavior";
import type { SurfaceDefinition } from "./surface";
import type { PresentationDefinition } from "./presentation";
import { compileToIR, IRToFormDefinition } from "../utils/ir-compiler";
import { resolveTranslation } from "../utils/i18n.utils";

/**
 * Valid Icon identifiers supported by the Zenith Icon / Lucide registry.
 */
export type IconName =
  | "search"
  | "check"
  | "user"
  | "shield"
  | "settings"
  | "calendar"
  | "mail"
  | "lock"
  | "eye"
  | "eye-off"
  | "chevron-down"
  | "chevron-up"
  | "help-circle"
  | "alert-circle"
  | "info"
  | "x"
  | "plus"
  | "trash"
  | "edit"
  | "arrow-right"
  | "arrow-left"
  | (string & {});

/**
 * Label placement modes supported across the Form Engine.
 */
export type LabelPlacement = "top" | "side" | "hidden" | "inline" | "inline-floating";

/**
 * Spatial slot injection targets available on all Form Fields.
 */
export type SlotPlacement =
  | "beforeField"
  | "startContent"
  | "endContent"
  | "afterField"
  | "actionSlot"
  | "feedbackSlot";

/**
 * Declarative serializable slot descriptor for JSON/API-driven forms.
 */
export interface SlotDescriptor {
  /** Registered slot component ID in SlotRegistry (e.g. 'user-avatar-slot', 'copy-clipboard') */
  slotId: string;
  /** Declarative props passed to the resolved slot component */
  props?: Record<string, any>;
}

/**
 * Configuration for windowed virtual scrolling in options-based controls.
 */
export interface VirtualizationConfig {
  /** Explicitly toggle virtualization */
  enabled?: boolean;
  /** Fixed item height in pixels (default: 36) */
  itemHeight?: number;
  /** Maximum viewport height in pixels (default: 260) */
  maxHeight?: number;
  /** Overscan buffer items rendered above/below the viewport (default: 4) */
  overscan?: number;
  /** Threshold item count before auto-enabling virtualization (default: 100) */
  threshold?: number;
}

/**
 * Dropzone configuration for elevated FileField upload surfaces.
 */
export interface FileDropzoneConfig {
  /** Dropzone visual mode */
  variant?: "dropzone" | "compact" | "button";
  /** File preview layout */
  previewMode?: "chips" | "list" | "grid";
  /** Maximum allowable files */
  maxFiles?: number;
  /** Max size in bytes per file */
  maxSizeBytes?: number;
  /** Accepted file extensions or MIME types */
  accept?: string | string[];
  /** Badge tokens for file chip previews */
  badge?: FieldBadgeConfig;
  /** Active drag-over ring/surface intent */
  dragActiveVariant?: "primary" | "accent" | "success";
}

/**
 * Mark/tick configuration for Slider controls.
 */
export interface SliderTickMark {
  value: number;
  label?: string | TranslatedText;
}

/**
 * Configuration for elevated RangeField sliders.
 */
export interface SliderConfig {
  /** Value tooltip display strategy */
  showTooltip?: "always" | "hover" | "focus" | "never";
  /** Value tooltip placement */
  tooltipPlacement?: "top" | "bottom";
  /** Discrete tick marks */
  marks?: boolean | SliderTickMark[];
  /** Whether track fill gradient reflects current value */
  fillTrack?: boolean;
  /** Badge tokens for value bubble */
  badge?: FieldBadgeConfig;
}

/**
 * Universal Dynamic Slot Properties available across all UI primitives.
 */
export interface BaseSlotProps {
  labelPlacement?: LabelPlacement;
  slots?: Partial<Record<SlotPlacement, string | SlotDescriptor | ReactNode>>;
  startContent?: ReactNode;
  endContent?: ReactNode;
  leftContent?: ReactNode;
  rightContent?: ReactNode;
  prefix?: ReactNode;
  suffix?: ReactNode;
  icon?: IconName;
  leftIcon?: IconName;
  rightIcon?: IconName;
  ariaKeyShortcuts?: string;
  tooltip?: string | TranslatedText;
  tooltipPlacement?: "top" | "bottom" | "left" | "right";
  reserveErrorSpace?: boolean;
  autoFocus?: boolean;
  intent?: "primary" | "secondary" | "danger" | "warning" | "success" | "subtle";
  className?: string;
  customClasses?: string;
}

/**
 * Option item for Select, MultiSelect, Radio, and Autocomplete fields.
 */
export interface FieldOption<TValue = string> {
  value: TValue;
  label: string | TranslatedText;
  icon?: IconName;
  description?: string | TranslatedText;
  disabled?: boolean;
  meta?: Record<string, any>;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Primitive Field Contracts (Discriminated by type + component)
// ─────────────────────────────────────────────────────────────────────────────

export interface TextFieldContract {
  type: "string";
  component?: "text" | "password" | "email" | "url" | "textarea" | "search_input" | "code" | "phone";
  defaultValue?: string;
  properties?: BaseSlotProps & {
    placeholder?: string | TranslatedText;
    maxLength?: number;
    minLength?: number;
    rows?: number;
    mask?: string;
  };
}

export interface SelectFieldContract<TOption extends string = string> {
  type: "string";
  component: "select" | "autocomplete";
  defaultValue?: TOption;
  options: ReadonlyArray<FieldOption<TOption>>;
  properties?: BaseSlotProps & {
    placeholder?: string | TranslatedText;
    isClearable?: boolean;
    virtualization?: VirtualizationConfig;
  };
}

export interface MultiSelectFieldContract<TOption extends string = string> {
  type: "array";
  component: "multiselect";
  defaultValue?: ReadonlyArray<TOption>;
  options: ReadonlyArray<FieldOption<TOption>>;
  properties?: BaseSlotProps & {
    placeholder?: string | TranslatedText;
    maxSelected?: number;
    isClearable?: boolean;
    virtualization?: VirtualizationConfig;
    badge?: FieldBadgeConfig;
  };
}

export interface RadioFieldContract<TOption extends string = string> {
  type: "string";
  component: "radio";
  defaultValue?: TOption;
  options: ReadonlyArray<FieldOption<TOption>>;
  properties?: BaseSlotProps & {
    direction?: "row" | "column";
  };
}

export interface NumberFieldContract {
  type: "number";
  component?: "number" | "slider" | "range" | "rating" | "formatted-number";
  defaultValue?: number;
  properties?: BaseSlotProps & {
    min?: number;
    max?: number;
    step?: number;
    placeholder?: string | TranslatedText;
    prefix?: ReactNode;
    suffix?: ReactNode;
    slider?: SliderConfig;
  };
}

export interface BooleanFieldContract {
  type: "boolean";
  component?: "checkbox" | "switch";
  defaultValue?: boolean;
  properties?: BaseSlotProps & {
    description?: string | TranslatedText;
  };
}

export interface DateFieldContract {
  type: "string";
  component: "date" | "datetime" | "time";
  defaultValue?: string;
  properties?: BaseSlotProps & {
    minDate?: string;
    maxDate?: string;
    format?: string;
  };
}

export interface FileFieldContract {
  type: "array" | "string" | "object";
  component: "file" | "image";
  defaultValue?: any;
  properties?: BaseSlotProps & {
    accept?: string;
    maxSize?: number;
    multiple?: boolean;
    dropzone?: FileDropzoneConfig;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Static & Structural Contracts
// ─────────────────────────────────────────────────────────────────────────────

export interface StaticFieldContract {
  type:
    | "header"
    | "paragraph"
    | "divider"
    | "divider-label"
    | "spacer"
    | "button"
    | "image"
    | "message"
    | "html"
    | "qr-code"
    | "tooltip";
  component?: string;
  defaultValue?: never;
  properties?: BaseSlotProps & {
    content?: string | TranslatedText;
    variant?: string;
    size?: string;
    onClick?: () => void;
    [key: string]: any;
  };
}

export interface StructureFieldContract {
  type:
    | "card"
    | "accordion"
    | "container"
    | "tabs"
    | "fieldset"
    | "group"
    | "repeater"
    | "slot";
  component?: string;
  defaultValue?: any;
  fields?: ReadonlyArray<TypedFieldContract<any>>;
  properties?: BaseSlotProps & {
    columns?: number;
    gap?: number | string;
    defaultOpen?: boolean;
    [key: string]: any;
  };
}

export interface CustomFieldContract {
  type: string;
  component?: string;
  defaultValue?: any;
  options?: ReadonlyArray<FieldOption<any>>;
  fields?: ReadonlyArray<TypedFieldContract<any>>;
  properties?: BaseSlotProps & Record<string, any>;
  [key: string]: any;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Unified Discriminated Union Contract
// ─────────────────────────────────────────────────────────────────────────────

export type FieldDefinitionPayload =
  | TextFieldContract
  | SelectFieldContract<any>
  | MultiSelectFieldContract<any>
  | RadioFieldContract<any>
  | NumberFieldContract
  | BooleanFieldContract
  | DateFieldContract
  | FileFieldContract
  | StaticFieldContract
  | StructureFieldContract
  | CustomFieldContract;

export type TypedFieldContract<TName extends string = string> = {
  id: string;
  name: TName;
  label?: string | TranslatedText;
  description?: string | TranslatedText;
  helpText?: string | TranslatedText;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  hidden?: boolean;
  validation?: ValidationSettings;
  conditions?: FieldConditionExpression;
  meta?: {
    ui?: Record<string, any>;
    accessibility?: Record<string, any>;
    [key: string]: any;
  };
  layout?: {
    columnSpan?: number;
    rowSpan?: number;
    startNewRow?: boolean;
    [key: string]: any;
  };
} & FieldDefinitionPayload;

// ─────────────────────────────────────────────────────────────────────────────
// 4. Section & Form Contracts
// ─────────────────────────────────────────────────────────────────────────────

export interface FormSectionContract<TField extends TypedFieldContract<any> = TypedFieldContract<any>> {
  id: string;
  title?: string | TranslatedText;
  description?: string | TranslatedText;
  layout?: SectionLayoutConfig;
  fields: ReadonlyArray<TField>;
  subSections?: ReadonlyArray<FormSectionContract<TField>>;
  /**
   * Flow sugar for stepper ("wizard") forms.
   *
   * Sections are consumed as wizard steps. `nextStep` overrides the default
   * linear ordering (next section in the array) with either a step id or a
   * resolver receiving the current form values.
   *
   * Wired into the engine pipeline (`form.flow.getNextStep`), which
   * `FormFlow`/`FormFooter` use to advance between steps.
   */
  nextStep?: string | ((values: Record<string, any>) => string | null);
}

export interface FormDefinitionContract<
  TField extends TypedFieldContract<any> = TypedFieldContract<any>
> {
  id: string;
  title: string | TranslatedText;
  description?: string | TranslatedText;
  submitLabel?: string | TranslatedText;
  cancelLabel?: string | TranslatedText;
  sections?: ReadonlyArray<FormSectionContract<TField>>;
  fields?: ReadonlyArray<TField>;
  settings?: FormDefinition["settings"];
  layout?: FormDefinition["layout"];
  style?: FormDefinition["style"];
  validation?: ValidationSettings;
  events?: {
    onSubmit?: (data: any) => Promise<void> | void;
    onInit?: (data: any) => void;
    onChange?: (data: any, changedField?: any) => void;
  };
  metadata?: Record<string, any>;
}

// ─────────────────────────────────────────────────────────────────────────────
// 4b. Wizard (Stepper) Flow Authoring Sugar
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Wizard/stepper configuration. Mirrors `FormDefinition["settings"]["wizard"]`,
 * declared here so contracts can opt into flow mode without a raw cast.
 */
export interface WizardContractConfig {
  enabled?: boolean;
  stepperType?: "sidebar" | "top";
  linear?: boolean;
  /** Overrides the default initial step (first section). */
  initialStepId?: string;
}

/**
 * Flow authoring helper. Stamps `settings.wizard` onto a contract and returns
 * it unchanged otherwise — the contract stays the single source of truth.
 *
 * @example
 * ```ts
 * const wizardContract = withWizard({ stepperType: "top", linear: false })(
 *   contract
 * );
 * ```
 */
export function withWizard<
  const TForm extends FormDefinitionContract<any>
>(config?: WizardContractConfig) {
  return (contract: TForm): TForm => ({
    ...contract,
    settings: {
      ...((contract.settings as Record<string, any>) || {}),
      wizard: {
        enabled: true,
        ...(((contract.settings as any)?.wizard as Record<string, any>) || {}),
        ...config,
      },
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 4c. Runtime Layer Model
// ─────────────────────────────────────────────────────────────────────────────
//
// The layered runtime boundary for MDAP hooks/components. In Phase A
// (`useFormFacade`/`useFormFlow`), `content` carries the compiled definition
// the engine already consumes; `behavior`/`surface`/`presentation` are the
// effective slices projected from the authoring source. In Phase B the engine
// will consume these layers directly — flattening stops being a public contract.

export interface FormLayerModel<T extends Record<string, any> = Record<string, any>> {
  /** Content layer — compiled sections/fields/settings consumed by the engine. */
  content: FormDefinition<T>;
  /** Behavior layer — events, pipeline, form-level validation. */
  behavior?: BehaviorDefinition<T>;
  /** Surface layer — UI/print/pdf/mobile/api screen targets. */
  surface?: SurfaceDefinition;
  /** Presentation layer — style/theming tokens. */
  presentation?: PresentationDefinition;
}
// ─────────────────────────────────────────────────────────────────────────────

type StaticFieldTypeKey =
  | "header"
  | "paragraph"
  | "divider"
  | "divider-label"
  | "spacer"
  | "button"
  | "image"
  | "message"
  | "html"
  | "qr-code"
  | "tooltip";

type ExtractFieldType<T> = T extends { type: "number" }
  ? number
  : T extends { type: "boolean" }
  ? boolean
  : T extends MultiSelectFieldContract<infer O>
  ? O[]
  : T extends SelectFieldContract<infer O>
  ? O
  : T extends RadioFieldContract<infer O>
  ? O
  : T extends { type: "array" }
  ? any[]
  : T extends { type: "object" }
  ? Record<string, any>
  : T extends { type: StaticFieldTypeKey }
  ? never
  : string;

type ExtractFieldsFromSections<TSections> = TSections extends ReadonlyArray<
  FormSectionContract<infer F>
>
  ? F
  : never;

type ExtractAllFields<T> = T extends FormDefinitionContract<infer DirectFields>
  ? DirectFields | (T["sections"] extends ReadonlyArray<any> ? ExtractFieldsFromSections<T["sections"]> : never)
  : never;

/**
 * Automatically infers the strongly-typed TypeScript form data model from a Form Contract!
 *
 * @example
 * ```typescript
 * const myContract = defineFormContract({ ... });
 * export type MyFormData = InferFormValues<typeof myContract>;
 * ```
 */
export type InferFormValues<T> = {
  [K in ExtractAllFields<T> as K extends { type: StaticFieldTypeKey } ? never : K["name"]]: ExtractFieldType<K>;
};

// ─────────────────────────────────────────────────────────────────────────────
// 6. Schema Builder & Compiler Factory
// ─────────────────────────────────────────────────────────────────────────────

/**
 * defineFormContract
 *
 * Strongly-typed builder for MPDA Form Contracts with zero type annotations.
 * Uses TypeScript const type parameters for literal inference of names, types, and options.
 */
export function defineFormContract<
  const TFields extends TypedFieldContract<any>,
  const TForm extends FormDefinitionContract<TFields>
>(contract: TForm): TForm {
  return contract;
}

/**
 * compileContractToFormDefinition
 *
 * Compiles a typed Form Contract into an executable Zenith FormDefinition
 * ready for consumption by `<Form definition={...} />`.
 *
 * Now uses the unified CanonicalFormIR pipeline for consistency with MDAP Entity.
 */
export function compileContractToFormDefinition<
  const TForm extends FormDefinitionContract<any>
>(contract: TForm): FormDefinition<InferFormValues<TForm>> {
  // Compile through the unified IR pipeline
  const result = compileToIR(contract, {
    formId: contract.id,
    submitLabel: resolveTranslation(contract.submitLabel || "Submit"),
    sourceType: "contract",
  });

  // Validate IR
  if (!result.validation.valid) {
    const errorMessages = result.validation.errors.map(e => `${e.path}: ${e.message}`).join("; ");
    console.error("[Contract Compiler] IR validation failed:", errorMessages);
    throw new Error(`Contract compilation failed: ${errorMessages}`);
  }

  // Log warnings
  if (result.validation.warnings.length > 0) {
    result.validation.warnings.forEach(w => {
      console.warn(`[Contract Compiler] ${w.path}: ${w.message}`);
    });
  }

  // Convert IR to runtime FormDefinition
  return IRToFormDefinition(result.ir) as FormDefinition<InferFormValues<TForm>>;
}

/**
 * Compile Contract to CanonicalFormIR (for advanced use cases)
 */
export function compileContractToIR<
  const TForm extends FormDefinitionContract<any>
>(contract: TForm) {
  return compileToIR(contract, {
    formId: contract.id,
    submitLabel: resolveTranslation(contract.submitLabel || "Submit"),
    sourceType: "contract",
  });
}

/**
 * Validate Contract without compiling
 */
export function validateContract<
  const TForm extends FormDefinitionContract<any>
>(contract: TForm) {
  const result = compileToIR(contract, {
    formId: contract.id,
    submitLabel: resolveTranslation(contract.submitLabel || "Submit"),
    sourceType: "contract",
  });
  return result.validation;
}
