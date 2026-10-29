# Zenith Form Domain Types Reference

The domain layer under `src/core/form-core/domain/` defines every entity,
contract, and pure helper shared by the Zenith Form Architecture. All files are
framework-agnostic — no React, DOM, or HTTP imports — so engine modules,
adapters, and UI components agree on a single vocabulary.

Source links resolve from `frontend/docs/form/reference/`.

---

## 1. Field model (field.ts)

### 1.1 `src/core/form-core/domain/field.ts`

The hub of the domain model (840 lines): field type unions, the capability
matrix, the static `FIELD_REGISTRY`, option/remote/repeater configuration, UI
and layout metadata, and the canonical `FormField` entity plus its raw
(schema-authoring) variants.

Source: [field.ts](../../../src/core/form-core/domain/field.ts)

#### Type unions

| Exported type | Definition |
|---|---|
| `InputFieldType` | Union of value-bearing types: `"string"`, `"number"`, `"boolean"`, `"array"`, `"object"`, `"text"`, `"textarea"`, `"email"`, `"password"`, `"phone"`, `"url"`, `"date"`, `"datetime"`, `"time"`, `"checkbox"`, `"radio"`, `"select"`, `"multiselect"`, `"switch"`, `"autocomplete"`, `"file"`, `"signature"`, `"rating"`, `"range"`, `"rich-text"`, `"formatted-number"`, `"search_input"`, `"table_filter"`, `"code"`. |
| `StaticFieldType` | Display-only types: `"header"`, `"paragraph"`, `"image"`, `"divider"`, `"divider-label"`, `"spacer"`, `"button"`. |
| `StructureFieldType` | Layout/container types: `"container"`, `"card"`, `"section"`, `"repeater"`, `"progress-line"`, `"progress-circle"`, `"social"`, `"tab"`, `"slot"`, `"accordion"`, `"fieldset"`, `"group"`. |
| `CustomFieldTypes` | Empty interface; consumers augment it via declaration merging to add branded custom types. |
| `FieldType` | `InputFieldType \| StaticFieldType \| StructureFieldType \| keyof CustomFieldTypes \| (string & {})` — open union that keeps IDE autocompletion for built-ins. |
| `StringPath<T>` | Alias of `FieldPath<T>` from [paths.ts](#61-paths) for backward compatibility. |
| `FieldCategory` | `"input" \| "static" \| "structure"`. |
| `SyncMode` | `"keystroke" \| "blur" \| "manual"`. |
| `RowPathFormat` | `{ template: string; identityField?: string }` — token template (`[idx]`, `[id]`) for custom repeater data paths. |
| `SpacingScale` | `"none" \| "xs" \| "sm" \| "md" \| "lg" \| "xl" \| "2xl" \| "auto"`. |

#### `FIELD_CONSTANTS`

```ts
export const FIELD_CONSTANTS = {
  CATEGORIES: {
    INPUT: "input" as FieldCategory,
    STATIC: "static" as FieldCategory,
    STRUCTURE: "structure" as FieldCategory,
  },
} as const;
```

#### `FieldCapabilities`

```ts
export interface FieldCapabilities {
  hasValue: boolean; // allocate V1 (Values)
  hasValidity: boolean; // allocate V2 (Validity)
  hasVisibility: boolean; // allocate V3 (Visibility)
  hasView: boolean; // allocate V4 (View State)
  hasVitality: boolean; // allocate V5 (Vitality/Touched/Dirty)
  derivesValidityFromChildren?: boolean; // Signal for ErrorManager rollup
}
```

Each boolean gates allocation of the corresponding slice in the 5V state
matrix during normalization.

#### `FieldRegistryItem`

```ts
export interface FieldRegistryItem {
  type: FieldType;
  category: string;
  label: string;
  description?: string;
  icon?: string;
  capabilities: FieldCapabilities;
  resolveProps?: (
    resolved: any,
    state: any,
    context: any
  ) => Record<string, any>;
  handleChange?: (rawValue: any, context: any) => any;
  validate?: (value: any, context: any) => any | Promise<any>;
}
```

#### `FIELD_REGISTRY`

```ts
export const FIELD_REGISTRY: Record<FieldType, FieldRegistryItem>
```

Static lookup of every built-in type to its `{ type, category, label,
capabilities }`. Capability presets used inside the map: `CAPS.INPUT` (all
five slices), `CAPS.STATIC` and `CAPS.STRUCTURE` (visibility + view only), and
`CAPS.COLLECTOR` (value, validity, visibility, view plus
`derivesValidityFromChildren: true` — used by `repeater`, `fieldset`, and
`group`). The `repeater` entry is registered under category `"structure"` with
COLLECTOR capabilities.

#### Option and remote configuration

| Exported type | Description |
|---|---|
| `FieldOption` | `{ label: string \| TranslatedText; value: any; disabled?: boolean; description?: string \| TranslatedText; icon?: string; meta?: any }`. |
| `DynamicOptionSource` | Legacy dynamic options config: `url`, `method?`, `payloadFields?`, `dataPath?`, `labelPath?`, `valuePath?`, `mapping?`, `dependsOn?`, `debounceMs?`, `cacheTTL?`, `minChars?`, `headers?`. |
| `RemoteOptions` | Canonical remote select config: `{ url: string; method?: "GET" \| "POST"; params?: Record<string, string>; headers?: Record<string, string>; watch?: string[]; debounceMs?: number; mapping?: { valuePath?; labelPath?; descriptionPath?; iconPath?; groupBy? } }`. Consumed by `RemoteOptionsManager`. |
| `RepeaterConfig` | `{ rowStateStrategy?: "index" \| "identity"; rowIdentityField?: string; rowPathFormat?: RowPathFormat }`. Note the type union is `"index" \| "identity"` while `RepeaterRowFactory` treats `undefined` and `"identity"` as the identity strategy. |
| `FieldOptions` | `{ options?: FieldOption[]; dynamicOptions?: DynamicOptionSource }`. |
| `FormRow` | `{ id: string; fields: FormField[] }`. |

#### `FieldEvents<T>`

```ts
export interface FieldEvents<T> {
  onInit?: (field: FormField<T>, formData: any) => void;
  onChange?: (field: FormField<T>, value: T, formData: any) => void | T;
  beforeChange?: (
    field: FormField<T>,
    value: T,
    formData: any
  ) => boolean | void;
  afterChange?: (field: FormField<T>, value: T, formData: any) => void;
  onBlur?: (field: FormField<T>, value: T, formData: any) => void;
  onFocus?: (field: FormField<T>, value: T, formData: any) => void;
  onValidate?: (
    field: FormField<T>,
    value: T,
    formData: any
  ) => boolean | string;
}
```

`beforeChange` may veto a change by returning `false`; `onChange` / `onValidate`
may transform a value or return a custom message.

#### `FieldUI`

```ts
export interface FieldUI {
  icon?: string;
  cardElevation?: "none" | "sm" | "md" | "lg";
  rightIcon?: string | any;
  endIcon?: string | any;
  className?: string;
  startContent?: any;
  endContent?: any;
  leftContent?: any;
  rightContent?: any;
  motion?: boolean | { enabled?: boolean };
  variant?:
    | "outlined"
    | "filled"
    | "underlined"
    | "h1"
    | "h2"
    | "h3"
    | "h4"
    | "h5"
    | "h6";
  color?: "primary" | "secondary" | "success" | "danger" | "warning" | "info";
  placeholder?: string | TranslatedText;
  helpText?: string | TranslatedText;
  classNames?: {
    base?: string;
    label?: string;
    inputWrapper?: string;
    innerWrapper?: string;
    mainWrapper?: string;
    input?: string;
    clearButton?: string;
    helperWrapper?: string;
    description?: string;
    errorMessage?: string;
  };
  labelAction?: { label: string; href: string };
  inlineEditable?: boolean;
  listAction?: {
    label: string;
    onClick: () => void;
    position?: "top" | "bottom";
    className?: string;
  };
  component?: string | any;
}
```

#### `FieldMeta<T>`

```ts
export interface FieldMeta<T = any> {
  events?: FieldEvents<T>;
  options?: FieldOptions;
  performance?: PerformanceSettings;
  accessibility?: Accessibility;
  security?: SecuritySettings;
  history?: HistorySettings;
  computed?: ComputedField;
  reactiveValue?: ReactiveValue<T>;
  conditions?: FieldConditionExpression;
  i18n?: Internationalization;
  ui?: FieldUI;
  aliases?: string[];
}
```

#### Layout and styling

| Exported type | Description |
|---|---|
| `FieldLayout` | Grid placement: `gridClass?`, `fullWidth?`, `columnSpan?`, `span?`/`width?` (`"full" \| "half" \| "third" \| "quarter"`), `rowSpan?`, `rowStart?`, `colStart?`, `startNewRow?`, `responsive?: { hideOnMobile?; hideOnTablet?; hideOnDesktop? }`. |
| `ModifierProps` | Tailwind-style spacing modifiers: `m/mt/mb/ml/mr/mx/my` and `p/pt/pb/pl/pr/px/py`, each typed `SpacingScale`. |
| `FieldProperties` | Component-level styling bag: `typography?`, `labelPlacement?`, `borderRadius?`, `width?`, `startNewRow?`, `alignment?`, `customClasses?`, `placeholder?`, `intent?`, `classNames?`, `modifiers?: ModifierProps`, `backgroundColor?`, `border?`, `elevation?`, `footer?`, `footerContent?`, `options?`, `tooltip?`, `slotPlacement?`, `tooltipPlacement?`, plus a `[key: string]: any` index signature. |

#### `FormField`

```ts
export interface FormField<
  TValue = unknown,
  TType extends FieldType = FieldType,
  TFormData = Record<string, unknown>,
> {
  id: string;
  key?: string;
  name?: TType extends InputFieldType
    ? AutocompletePath<TFormData>
    : string;
  type: TType;
  label: string | TranslatedText;
  description?: string | TranslatedText;
  aliases?: string[];
  component?: any;
  className?: string;
  custom?: unknown;
  placeholder?: string | TranslatedText;
  initialValue?: TValue;
  value?: TValue;
  syncMode?: SyncMode;
  visibilityBehavior?: "purge" | "preserve" | "suspend";
  onChange?: (
    value: TValue,
    field: FormField<TValue, TType, TFormData>,
    formData: TFormData
  ) => void | TValue;
  onSelectChange?: (
    value: TValue,
    field: FormField<TValue, TType, TFormData>,
    formData: TFormData
  ) => void | TValue;
  componentProps?: Record<string, unknown>;
  validation?: ValidationSettings;
  meta?: FieldMeta<TValue>;
  conditions?: FieldConditionExpression;
  required?:
    | boolean
    | ReactiveValue<boolean>
    | ((values: any, context: any) => boolean);
  visible?:
    | boolean
    | ReactiveValue<boolean>
    | ((values: any, context: any) => boolean);
  enabled?:
    | boolean
    | ReactiveValue<boolean>
    | ((values: any, context: any) => boolean);
  computed?: ComputedField;
  autoComplete?: string;
  tags?: string[];
  customData?: Record<string, any>;
  settings?: {
    density?: "compact" | "comfortable" | "spacious";
  };
  nextField?:
    | string
    | ((
        formData: TFormData,
        field: FormField<TValue, TType, TFormData>
      ) => string | null);
  fields?: FormField<any, any, TFormData>[];
  repeaterConfig?: RepeaterConfig;
  options?: FieldOption[];
  remoteOptions?: RemoteOptions;
  creatable?: boolean;
  clearable?: boolean;
  properties?: FieldProperties;
  layout?: FieldLayout | any;
  columnSpan?: number;
  headless?: boolean;
  isExpandedComposite?: boolean;
  ephemeral?: boolean;
}
```

Key behaviors: `required` / `visible` / `enabled` each accept a boolean, a
`ReactiveValue` expression, or a predicate function; `visibilityBehavior`
selects what happens when a field hides (`"purge"` nulls the value,
`"suspend"` retains errors, `"preserve"` keeps state); `fields` nests children
for groups and repeaters (children of a repeater are treated as templates).

#### `RawFormField` and `RawFormSection`

```ts
export interface RawFormField<
  TValue = any,
  TType extends FieldType = FieldType,
  TFormData = Record<string, any>,
> extends Omit<FormField<TValue, TType, TFormData>, "id" | "fields"> {
  key?: string;
  component?: any;
  placeholder?: string | TranslatedText;
  id?: TType extends InputFieldType
    ? StringPath<TFormData> | (string & {})
    : string;
  fields?: RawFormField<any, any, TFormData>[];
  ephemeral?: boolean;
}

export interface RawFormSection<TFormData = Record<string, any>> {
  id?: string;
  key?: string;
  title?: string | TranslatedText;
  description?: string;
  layout?: any;
  fields?: RawFormField<any, any, TFormData>[];
  subSections?: RawFormSection<TFormData>[];
  nextStep?: string | ((values: any) => string | null);
  properties?: Record<string, any>;
  meta?: Record<string, any>;
  visible?: boolean | ReactiveValue<boolean>;
  enabled?: boolean | ReactiveValue<boolean>;
}
```

Raw variants are the schema-authoring shapes: `id` is optional (normalization
assigns one) and `fields` recurse as raw fields.

#### Functions

```ts
export function getFieldCategory(type: FieldType): FieldCategory
```

Returns `FIELD_REGISTRY[type]?.category`, falling back to `"input"` for
unknown types.

```ts
export function getFieldDefinition(type: FieldType): FieldRegistryItem
```

Returns the registry entry or a minimal `{ type, category: "input", label: type }` fallback.

```ts
export function isNativeDelegationSupported(type: FieldType): boolean
```

True for `input`-category types except the custom headless set
(`select`, `multiselect`, `autocomplete`, `rich-text`, `signature`, `rating`),
which require composed components rather than native input delegation.

```ts
export function extractNativeDOMValue(target: any): any
```

Reads a value from a DOM event target: `checked` for checkbox/radio,
`valueAsNumber` (falling back to `value`) for number/range, `files` for file
inputs, and `.value` otherwise; returns `target?.value` for non-`HTMLInputElement`
targets.

---

## 2. Form definition (definition.ts)

### 2.1 `src/core/form-core/domain/definition.ts`

The top-level schema contract (`FormDefinition`) plus the MetaConfig pillars,
navigation guard, UI override config, and the lighter `RenderDefinition` /
`DetailDefinition` shapes used by non-form surfaces.

Source: [definition.ts](../../../src/core/form-core/domain/definition.ts)

#### `FormMetadataEvents<TFormData>`

```ts
export type FormMetadataEvents<
  TFormData extends Record<string, any> = Record<string, any>,
> = {
  onInit?: (formData: TFormData) => void;
  onChange?: (
    formData: TFormData,
    changedField?: FormField<any, any, TFormData>
  ) => any;
  onSelectChange?: (
    formData: TFormData,
    changedField?: FormField<any, any, TFormData>
  ) => any;
  beforeSubmit?: (formData: TFormData) => boolean | void;
  onSubmit?: (formData: TFormData) => Promise<void> | void;
  afterSubmit?: (formData: TFormData) => void;
  onError?: (error: Error, formData: TFormData) => void;
};
```

#### `NavigationGuardConfig`

```ts
export interface NavigationGuardConfig {
  enabled?: boolean;
  domainName?: string | TranslatedText;
  title?: string | TranslatedText;
  message?: string | TranslatedText;
  confirmLabel?: string | TranslatedText;
  confirm?: string | TranslatedText;
  cancelLabel?: string | TranslatedText;
  cancel?: string | TranslatedText;
  toastTitle?: string | TranslatedText;
  toastDescription?: string | TranslatedText;
  params?: Record<string, string | number>;
}
```

Labels and copy for the unsaved-changes navigation guard; enabled through
`settings.navigationGuard`.

#### `FormDefinition<TFormData>`

```ts
export interface FormDefinition<
  TFormData extends Record<string, any> = Record<string, any>,
> {
  id: string;
  version?: string;
  schemaVersion?: number;

  content?: ContentDefinition<TFormData>;
  surface?: SurfaceDefinition;
  behavior?: BehaviorDefinition<TFormData>;
  governance?: GovernanceDefinition;
  presentation?: PresentationDefinition;

  title: string | TranslatedText;
  description?: string | TranslatedText;
  sections?: RawFormSection<TFormData>[];
  fields?: RawFormField<any, any, TFormData>[];
  submitLabel?: string | TranslatedText;
  cancelLabel?: string | TranslatedText;

  layout?:
    | "vertical"
    | "split"
    | "grid"
    | "custom"
    | { type: string; config?: any };
  containers?: any[];
  shell?: any[];

  settings?: {
    width?: "full" | "contained" | "centered";
    density?: "compact" | "comfortable" | "spacious";
    maxHeight?: string;
    stickyHeader?: boolean;
    stickyFooter?: boolean;
    hideHeader?: boolean;
    hideFooter?: boolean;
    showValidationOnTouch?: boolean;
    layoutMode?: any;
    mode?: "edit" | "view";
    navigationGuard?: boolean | NavigationGuardConfig;
    wizard?: {
      enabled: boolean;
      stepperType?: "sidebar" | "top";
      linear?: boolean;
    };
    [key: string]: any;
  };

  pipeline?: {
    nextStep?: (
      formData: TFormData,
      currentSection: FormSection
    ) => string | null;
    middleware?: ((formData: TFormData) => void | Promise<void>)[];
  };

  events?: {
    onInit?: (formData: TFormData) => void;
    onChange?: (
      formData: TFormData,
      changedField?: FormField<any, any, TFormData>
    ) => void;
    onSelectChange?: (
      formData: TFormData,
      changedField: FormField<any, any, TFormData>
    ) => any;
    beforeSubmit?: (formData: TFormData) => boolean | void;
    onSubmit?: (formData: TFormData) => Promise<void> | void;
    afterSubmit?: (formData: TFormData) => void;
    onError?: (error: Error, formData: TFormData) => void;
  };
  metadata?: {
    locale?: string;
    events?: FormMetadataEvents<TFormData>;
    [key: string]: any;
  };

  customData?: Record<string, any>;

  style?: {
    primaryColor?: string;
    backgroundColor?: string;
    borderRadius?: string;
    fontFamily?: string;
    customClasses?: string;
    classNames?: {
      shell?: string;
      atmosphere?: string;
      root?: string;
      header?: string;
      title?: string;
      description?: string;
      body?: string;
      footer?: string;
      actionContainer?: string;
      submitButton?: string;
      cancelButton?: string;
      [key: string]: string | undefined;
    };
    [key: string]: any;
  };

  injections?: {
    validations?: Partial<
      Record<
        StringPath<TFormData> | (string & {}),
        ValidationSettings
      >
    >;
    ui?: Partial<
      Record<
        StringPath<TFormData> | (string & {}),
        Partial<FormField<any, any, TFormData>>
      >
    >;
    conditions?: Partial<
      Record<
        StringPath<TFormData> | (string & {}),
        FieldConditionExpression
      >
    >;
    layout?: Partial<Record<string, any>>;
    behavior?: Partial<Record<string, any>>;
    theme?: Partial<Record<string, any>>;
    print?: Partial<Record<string, any>>;
  };

  validation?: ValidationSettings;
  performance?: PerformanceSettings;
  security?: SecuritySettings;
  history?: HistorySettings;
}
```

Section keys: `sections` (raw hierarchical sections), `fields` (root-level
orphan fields), `containers` / `shell` (layout-driven field sources), and the
five MetaConfig pillars `content`, `surface`, `behavior`, `governance`,
`presentation`. `injections` is merged into fields during normalization by
`normalizeFormDefinition`.

#### `FormUIFieldConfig` / `FormUISectionConfig` / `FormUIConfig`

```ts
export interface FormUIFieldConfig {
  layout?: any;
  properties?: any;
  meta?: any;
  fields?: Record<string, FormUIFieldConfig>;
  gridColumn?: string | number;
  [key: string]: any;
}

export interface FormUISectionConfig {
  layout?: any;
  meta?: any;
  fields?: Record<string, FormUIFieldConfig>;
  [key: string]: any;
}

export interface FormUIConfig {
  fields?: Record<string, FormUIFieldConfig>;
  sections?: Record<string, FormUISectionConfig>;
  fieldConfig?: Record<string, FormUIFieldConfig>;
  settings?: FormDefinition["settings"];
  style?: FormDefinition["style"];
  layout?: any;
  containers?: any[];
  shell?: any[];
}
```

External UI-override document keyed by field/section ID; consumed when
stitching UI injections onto a form definition.

#### `RenderDefinition<TFormData>`

```ts
export interface RenderDefinition<
  TFormData extends Record<string, any> = Record<string, any>,
> {
  sections: RawFormSection<TFormData>[];
  layout?: string | { type: string; config?: any };
  settings?: {
    density?: "compact" | "comfortable" | "spacious";
  };
  style?: any;
}
```

#### `DetailDefinition<TData>`

```ts
export interface DetailDefinition<
  TData extends Record<string, any> = Record<string, any>,
> {
  id?: string;
  title?: string | TranslatedText;
  subtitle?: string | TranslatedText;
  badgeIcon?: string;
  sections?: RawFormSection<TData>[];
  fields?: RawFormField<any, any, TData>[];
  layout?: string | { type: string; config?: any };
  slots?: {
    header?: boolean | string;
    media?: boolean | string;
    actions?: boolean | string;
    footer?: boolean | string;
    [slotName: string]: boolean | string | undefined;
  };
  settings?: {
    density?: "compact" | "comfortable" | "spacious";
    layoutStyle?: "cards" | "key-value" | "flat";
  };
  style?: any;
}
```

Read-only detail view definition, including named slots and layout style.

---

## 3. State & events (state.ts)

### 3.1 `src/core/form-core/domain/state.ts`

Canonical contracts for the 5V form state, validation results, submission
payloads, and the form event envelope.

Source: [state.ts](../../../src/core/form-core/domain/state.ts)

#### `DetailedError`

The error shape written into `ValidityState` by `ErrorManager`:

```ts
export interface DetailedError {
  /** Machine-readable error code (e.g. "required", "email", "minLength"). */
  code: string;
  /** Human-readable error message shown in the UI. */
  message: string;
  /** The ID of the field this error belongs to. */
  fieldId: string;
  /** Optional extra context (e.g., `{ min: 3 }` for a minLength error). */
  details?: unknown;
}
```

| Field | Type | Description |
|---|---|---|
| `code` | `string` | Machine-readable discriminator such as `"required"`, `"email"`, `"minLength"`, or `"custom"`. |
| `message` | `string` | Human-readable message rendered by field components. |
| `fieldId` | `string` | ID of the field the error belongs to. |
| `details` | `unknown` (optional) | Arbitrary context payload, e.g. `{ min: 3 }` for a minLength failure. |

#### The five V-slices

| Exported type | Definition |
|---|---|
| `ValuesState<T>` | `type ValuesState<T = Record<string, unknown>> = T` — V1, raw data keyed by field name/path. |
| `ValidityState` | `interface ValidityState { [fieldId: string]: { valid: boolean; errors?: DetailedError[]; warning?: string; pending?: boolean } }` — V2. `pending` is true while an async validator runs; `warning` is non-blocking. |
| `VisibilityState` | `interface VisibilityState { [fieldId: string]: boolean }` — V3, true = rendered. |
| `ViewState` | `interface ViewState { [fieldId: string]: { label?; description?; placeholder?; disabled?; readOnly?; style?; className?; isLoading?; options?: ReadonlyArray<{ label: string; value: unknown }>; componentProps? } }` — V4 dynamic display properties. |
| `VitalityState` | `interface VitalityState { [fieldId: string]: { touched: boolean; dirty: boolean; focused: boolean; version: number; initialValue?: unknown; pinned?: boolean } }` — V5 interaction lifecycle. `pinned` keeps the slice alive across virtualized unmounts. |

#### `FormState<T>`

```ts
export interface FormState<T = Record<string, unknown>> {
  values: ValuesState<T>;
  validity: ValidityState;
  visibility: VisibilityState;
  view: ViewState;
  vitality: VitalityState;
  isSubmitting?: boolean;
  isValid?: boolean;
  isDirty?: boolean;
  activeStep?: string;
}
```

Public-facing 5V contract (the engine's internal `InternalFormState` extends
this shape in [int-types](../../../src/core/form-core/int-types.ts)).

#### `ValidationResult`

```ts
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, DetailedError[]>;
  flatErrors: DetailedError[];
}
```

#### `SubmissionPayload<T>`

```ts
export interface SubmissionPayload<T = Record<string, any>> {
  values: T;
  definitionId: string;
  timestamp: number;
}
```

#### `FormEventType` and `FormEvent<T>`

```ts
export type FormEventType =
  | "value:change"
  | "vitality:change"
  | "visibility:change"
  | "validation:start"
  | "validation:complete"
  | "step:change"
  | "form:submit"
  | "form:reset";

export interface FormEvent<T = any> {
  type: FormEventType;
  fieldId?: string;
  payload?: T;
  timestamp: number;
}
```

---

## 4. Validation types

### 4.1 `src/core/form-core/domain/validation.ts`

Rule and settings contracts consumed by validation adapters. Rule execution
itself lives in the adapter layer; this file only describes shapes.

Source: [validation.ts](../../../src/core/form-core/domain/validation.ts)

#### `CustomValidationTypes`

```ts
export interface CustomValidationTypes {}
```

Empty extension point; consumers augment via declaration merging and the new
keys become valid `ValidationRule.type` values.

#### `ValidationRule`

```ts
export interface ValidationRule {
  type:
    | "required"
    | "min"
    | "max"
    | "minLength"
    | "maxLength"
    | "pattern"
    | "email"
    | "url"
    | "phone"
    | "date"
    | "time"
    | "creditCard"
    | "uuid"
    | "fileSize"
    | "fileType"
    | "alphanumeric"
    | "digitsOnly"
    | "alphaOnly"
    | "ip"
    | "postalCode"
    | "matches"
    | "match"
    | "custom"
    | keyof CustomValidationTypes;
  /** Value associated with the rule, e.g., min, maxLength */
  value?: any;
  /** Custom validation function */
  fn?: (value: any, form: Record<string, any>) => boolean | string;
  /** Message to show when validation fails */
  message?: string;
  /** Severity level */
  severity?: "error" | "warning" | "info";
  /** Optional condition to apply this validation */
  when?: ConditionExpression;
}
```

Built-in rule kinds declared by the `type` union:

| Rule kind | Purpose |
|---|---|
| `required` | Value must be present. |
| `min` / `max` | Numeric bounds (via `value`). |
| `minLength` / `maxLength` | String/array length bounds. |
| `pattern` | Arbitrary regex match. |
| `email` / `url` / `phone` | Format checks. |
| `date` / `time` | Temporal format checks. |
| `creditCard` / `uuid` / `ip` / `postalCode` | Specialized format checks. |
| `fileSize` / `fileType` | File constraints. |
| `alphanumeric` / `digitsOnly` / `alphaOnly` | Character-set restrictions. |
| `matches` / `match` | Equality against another field (the target field is read from `rule.field` or a string `rule.value`; cross-field dependencies are extracted during normalization). |
| `custom` | User-supplied `fn`. |
| `keyof CustomValidationTypes` | Declaration-merged extension kinds. |

`when?: ConditionExpression` gates the rule on other fields; `severity`
distinguishes blocking errors from warnings and info.

#### `AsyncValidation`

```ts
export interface AsyncValidation {
  url: string;
  method?: "GET" | "POST" | "PUT" | "DELETE";
  payloadFields?: string[];
  responsePath?: string;
  validationExpr?: string;
  message?: string;
  retryCount?: number;
  timeoutMs?: number;
  cacheTTL?: number;
  headers?: Record<string, string>;
}
```

Server-backed validation: field values named in `payloadFields` are sent to
`url`, the response is unwrapped at `responsePath`, and `validationExpr`
decides pass/fail. `FormValidator` honors `timeoutMs` (defaulting to 5000 ms).

#### `CrossFieldValidation`

```ts
export interface CrossFieldValidation {
  fields: string[];
  validator: (values: Record<string, any>) => boolean | string;
  message: string;
  severity?: "error" | "warning";
}
```

#### `ValidationSettings`

```ts
export interface ValidationSettings {
  rules?: ValidationRule[];
  async?: AsyncValidation;
  crossField?: CrossFieldValidation[];
  groups?: {
    name: string;
    fields: string[];
    validateTogether?: boolean;
    triggerOn?: ("change" | "blur" | "submit")[];
  }[];
  validateOn?: ("change" | "blur" | "submit")[];
  debounceMs?: number;
  disableDeferredValidation?: boolean;
  /** Explicit source fields whose changes trigger re-validation of this field. */
  dependsOn?: string[];
}
```

`disableDeferredValidation` opts a field into pre-write screening via
`FormValidator.screenCandidate`; `dependsOn` seeds validation edges in the
dependency graph.

---

## 5. Conditions

### 5.1 `src/core/form-core/domain/condition.ts`

Rule/group contracts for conditional behavior. Two layers exist: the full
expression (including `validate`) used by `ValidationRule.when`, and a narrowed
field/section expression without `validate`.

Source: [condition.ts](../../../src/core/form-core/domain/condition.ts)

#### `ConditionOperator`

```ts
export type ConditionOperator =
  | "equals" | "eq"
  | "notEquals" | "ne"
  | "in" | "notIn"
  | "contains"
  | "greaterThan" | "lessThan"
  | "greaterThanOrEqual" | "lessThanOrEqual"
  | "startsWith" | "endsWith"
  | "regex"
  | "empty" | "notEmpty"
  | "between" | "notBetween";
```

#### `ConditionRule`

```ts
export interface ConditionRule {
  /**
   * The **name** (dot-notation path) of the field to read from form values.
   * This MUST match the field's `name` property, NOT its `id`.
   */
  field: string;
  /** Operator for comparison */
  operator: ConditionOperator;
  /** Value(s) to compare with */
  value?: string | number | boolean | Array<string | number>;
}
```

#### `ConditionAction`, `ConditionGroup`, `ConditionExpression`

```ts
export type ConditionAction =
  | "show" | "hide" | "enable" | "disable" | "setValue" | "validate";

export interface ConditionGroup {
  /** Action to apply when rules match */
  action: ConditionAction;
  /** Logical operator for combining rules in the group (default AND) */
  logic?: "AND" | "OR";
  /** Rules in this group */
  rules: ConditionRule[];
}

export interface ConditionExpression {
  /** Logical operator between groups (default AND) */
  logic?: "AND" | "OR";
  /** Groups of rules */
  groups: ConditionGroup[];
}
```

#### `FieldConditionAction`, `FieldConditionGroup`, `FieldConditionExpression`

```ts
export type FieldConditionAction =
  | "show" | "hide" | "enable" | "disable" | "setValue";

export interface FieldConditionGroup extends Omit<ConditionGroup, "action"> {
  action: FieldConditionAction;
  /** For `action: "setValue"` — the target **field name** (dot-notation) to set. */
  targetField?: string;
  /** The value to assign when the rules match */
  targetValue?: any;
}

export interface FieldConditionExpression {
  /** Logical operator between groups (default AND) */
  logic?: "AND" | "OR";
  groups: FieldConditionGroup[];
}
```

The narrowed set excludes `validate` (use `ValidationRule.when` for
conditional validation) and adds `targetField` / `targetValue` for `setValue`
effects applied by `FormVisibility.applySetValueEffects`.

---

## 6. Typed paths

### 6.1 `src/core/form-core/domain/paths.ts`

Compile-time dot-path generation and value extraction for nested form models,
with a recursion depth cap of 3 to protect `tsc` performance.

Source: [paths.ts](../../../src/core/form-core/domain/paths.ts)

#### `FieldPath<T, Depth>`

```ts
export type FieldPath<T, Depth extends number = 3> = [Depth] extends [never]
  ? never
  : T extends Primitive
  ? never
  : T extends readonly (infer Element)[]
  ? `${number}` | (Element extends Primitive ? never : Element extends object ? `${number}.${FieldPath<Element, Prev[Depth]>}` : never)
  : T extends object
  ? {
      [K in keyof T & string]:
        | K
        | (T[K] extends Primitive
            ? never
            : T[K] extends readonly (infer Element)[]
            ? `${K}.${number}` | (Element extends Primitive ? never : Element extends object ? `${K}.${number}.${FieldPath<Element, Prev[Depth]>}` : never)
            : T[K] extends object
            ? `${K}.${FieldPath<T[K], Prev[Depth]>}`
            : never);
    }[keyof T & string]
  : never;
```

Recursively generates dot-delimited path strings for nested objects, records,
and array indices (e.g. `"address.city"`, `"tags.0"`). `Primitive` (string,
number, boolean, bigint, symbol, undefined, null, Function, Date, RegExp) is
never recursed into.

#### `AutocompletePath<T>`

```ts
export type AutocompletePath<T> = [FieldPath<T>] extends [never]
  ? string
  : FieldPath<T> | (string & {});
```

Known schema paths plus a dynamic string fallback; the `(string & {})` idiom
prevents TypeScript from collapsing the union to `string`.

#### `PathValue<T, P>`

```ts
export type PathValue<T, P extends string> = P extends `${infer Key}.${infer Rest}`
  ? Key extends `${infer ArrayKey}[${number}]`
    ? ArrayKey extends keyof T
      ? T[ArrayKey] extends readonly (infer Item)[]
        ? PathValue<Item, Rest>
        : never
      : never
    : Key extends keyof T
    ? PathValue<T[Key], Rest>
    : Key extends `${number}`
    ? T extends readonly (infer Item)[]
      ? PathValue<Item, Rest>
      : never
    : unknown
  : P extends `${infer ArrayKey}[${number}]`
  ? ArrayKey extends keyof T
    ? T[ArrayKey] extends readonly (infer Item)[]
      ? Item
      : never
    : never
  : P extends keyof T
  ? T[P]
  : P extends `${number}`
  ? T extends readonly (infer Item)[]
    ? Item
    : never
  : unknown;
```

Extracts the value type at a dot path, handling both `key.subkey` and
`key.0` / `key[0]` array notations; resolves to `unknown` for unrecognized
paths.

---

## 7. Formatters

### 7.1 `src/core/form-core/domain/formatters.ts`

Deterministic, dependency-free display formatters used by detail views and
field components. All return `"-"` for null/undefined/empty-string input.

Source: [formatters.ts](../../../src/core/form-core/domain/formatters.ts)

```ts
export function formatCurrencyValue(
  value: unknown,
  currency: string = "USD",
  locale: string = "en-US"
): string
```

Formats via `Intl.NumberFormat` with `style: "currency"`; falls back to
`"${currency} ${num.toFixed(2)}"` for invalid currency codes and returns the
raw string for non-numeric input.

```ts
export function formatDateValue(
  value: unknown,
  format: string = "date",
  locale: string = "en-US"
): string
```

Accepts `Date`, timestamp, or ISO string; `"datetime"`/`"timestamp"` use
`toLocaleString`, `"time"` uses `toLocaleTimeString`, otherwise
`toLocaleDateString`.

```ts
export function formatNumberValue(
  value: unknown,
  options?: Intl.NumberFormatOptions,
  locale: string = "en-US"
): string
```

Localized number formatting with optional `Intl.NumberFormatOptions`.

```ts
export function formatBooleanValue(
  value: unknown,
  labels?: { trueLabel?: string; falseLabel?: string }
): { isTrue: boolean; label: string }
```

Treats `true`, `"true"`, `1`, `"1"`, and `"yes"` as true; labels default to
`"Yes"` / `"No"`.

```ts
export function resolveOptionLabel(
  value: unknown,
  options?: ReadonlyArray<{ value: unknown; label: string | any }>
): string | undefined
```

Finds the option whose `value` string-matches the input and returns its label;
localized label objects resolve `en` then `default`; returns `undefined` when
no option matches.

---

## 8. Reactive & dependencies

### 8.1 `src/core/form-core/domain/reactive.ts`

Expression contracts evaluated by `ReactiveEngine`.

Source: [reactive.ts](../../../src/core/form-core/domain/reactive.ts)

```ts
export interface ReactiveValue<_T = any> {
  expression: string;
  dependsOn: string[];
  debounceMs?: number;
  returnType?: "string" | "number" | "boolean" | "array" | "object";
}

export interface ComputedField {
  formula: string;
  dependsOn: string[];
  debounceMs?: number;
  returnType?: "string" | "number" | "boolean" | "array" | "object";
  validateOnCompute?: boolean;
}
```

`expression` / `formula` use `{{fieldPath}}` tokens; `dependsOn` seeds the
categorized dependency graph; `validateOnCompute` requests validation after a
computed value changes.

### 8.2 `src/core/form-core/domain/dependency-graph.ts`

Domain entity and algorithms for the reactive dependency DAG, categorized into
visibility, computed, validation, and remote-options edges. Constructed once in
O(N) during normalization; queried in O(1) per mutation for targeted O(D)
updates.

Source: [dependency-graph.ts](../../../src/core/form-core/domain/dependency-graph.ts)

#### `FieldDependencyNode`

```ts
export interface FieldDependencyNode {
  /** Field IDs whose visibility/enabled conditions depend on this field. */
  visibility: Set<string>;
  /** Field IDs whose computed values depend on this field. */
  computed: Set<string>;
  /** Field IDs whose validation rules depend on this field. */
  validation: Set<string>;
  /** Field IDs whose dynamic options must reload when this field changes. */
  remoteOptions: Set<string>;
}
```

#### `FieldDependencyGraph`

```ts
export type FieldDependencyGraph = Record<string, FieldDependencyNode>;
```

Indexed by source field name or ID.

#### Functions

```ts
export function createEmptyDependencyNode(): FieldDependencyNode
```

Allocates a node with four empty Sets.

```ts
export function mergeDependencyNodes(
  a?: FieldDependencyNode,
  b?: FieldDependencyNode
): FieldDependencyNode
```

Unions both nodes' Sets into a fresh node; missing arguments are treated as empty.

```ts
export function detectDependencyCycles(
  graph: FieldDependencyGraph,
  categories: Array<keyof FieldDependencyNode> = ["computed", "visibility"]
): string[] | null
```

DFS cycle detection over a consolidated adjacency map for the selected
categories; returns the cycle path (e.g. `["a", "b", "a"]`) or `null` when
acyclic. `normalizeFormDefinition` calls this at the end of normalization.

---

## 9. Sections & structure

### 9.1 `src/core/form-core/domain/section.ts`

Normalized section entity and its layout/step configuration.

Source: [section.ts](../../../src/core/form-core/domain/section.ts)

#### `SectionLayoutConfig`

```ts
export interface SectionLayoutConfig {
  type?: "vertical" | "grid" | "horizontal" | "tabs" | "wizard" | "accordion" | string;
  columns?: number;
  gap?: string | number;
  [key: string]: any;
}
```

#### `StepConfig`

```ts
export interface StepConfig {
  id: string;
  title: string | TranslatedText;
  description?: string | TranslatedText;
  icon?: string;
  isOptional?: boolean;
  canSkip?: boolean;
}
```

Wizard step metadata consumed by `FlowProxy` and stepper UIs.

#### `FormSection`

```ts
export interface FormSection {
  id: string;
  key?: string;
  title: string | TranslatedText;
  description?: string;
  layout?: SectionLayoutConfig;
  fields: FormField[];
  subSections?: FormSection[];
  nextStep?: string | ((values: any) => string | null);
  properties?: {
    labelPlacement?: "top" | "side" | "hidden";
    [key: string]: any;
  };
  meta?: {
    conditions?: FieldConditionExpression;
    className?: string;
    ui?: {
      className?: string;
      classNames?: Record<string, string>;
      [key: string]: any;
    };
    performance?: PerformanceSettings;
    accessibility?: Accessibility;
  };
  visible?: boolean | ReactiveValue<boolean>;
  enabled?: boolean | ReactiveValue<boolean>;
}
```

`meta.conditions` and `visible` drive section-level visibility in
`FormVisibility.evaluateVisibility` (a hidden section force-hides all of its
`fieldIds`). The flat runtime counterpart is `SectionEntity` in
[int-types](../../../src/core/form-core/int-types.ts), which replaces `fields`
/ `subSections` with `fieldIds` / `subSectionIds`.

---

## 10. MetaConfig domains (content / surface / behavior / presentation / governance / i18n / security-performance)

### 10.1 `src/core/form-core/domain/content.ts`

Source: [content.ts](../../../src/core/form-core/domain/content.ts)

| Exported type | Description |
|---|---|
| `ContentFieldDefinition` | `{ id: string; name: string; type: string; label: string \| TranslatedText; description?; required?; defaultValue?; validation?: ValidationSettings; condition?: FieldConditionExpression; metadata?: Record<string, any> }`. |
| `ContentSectionDefinition<TData>` | `{ id: string; title: string \| TranslatedText; description?; fields: (ContentFieldDefinition \| RawFormField<any, any, TData>)[]; condition?: FieldConditionExpression }`. |
| `ContentDefinition<TFormData>` | Entity-oriented content pillar: `{ id: string; entityName?; title; description?; sections?; fields?; validation?; conditions?: Record<string, FieldConditionExpression>; defaultValues?: Partial<TFormData>; customData? }`. |

### 10.2 `src/core/form-core/domain/surface.ts`

Source: [surface.ts](../../../src/core/form-core/domain/surface.ts)

Discriminated union on `target`:

| Exported type | Description |
|---|---|
| `UIScreenSurface` | `target: "screen"` with `density`, `width`, `maxHeight`, sticky header/footer, `shell`, `containers`, and `wizard` config. |
| `PrintSurface` | `target: "print"` with `paper` (A4/A3/Letter/Legal), `orientation`, `margins`, `header`, `footer`, `repeatHeaders`, `pageBreaks`, `hideFields`. |
| `PDFSurface` | `target: "pdf"` with `watermark`, `footerTemplate`, `headerTemplate`, `signatureBlocks`. |
| `MobileSurface` | `target: "mobile"` with `bottomSheet`, `swipeToDismiss`, `nativeInputs`, `compactCards`. |
| `SurfaceDefinition` | `UIScreenSurface \| PrintSurface \| PDFSurface \| MobileSurface`. |

### 10.3 `src/core/form-core/domain/behavior.ts`

Source: [behavior.ts](../../../src/core/form-core/domain/behavior.ts)

| Exported type | Description |
|---|---|
| `WorkflowState` | `{ id: string; label: string; editableFields?; readOnlyFields?; hiddenFields?; allowedTransitions? }`. |
| `WorkflowDefinition` | `{ initialState: string; states: Record<string, WorkflowState>; transitions?: Record<string, { from: string; to: string; requiredRole?: string }> }`. |
| `DeclarativeRule` | `{ id: string; condition: string; action: "require" \| "hide" \| "show" \| "disable" \| "setValue" \| "notify"; targetField: string; value?: any; priority?: number }`. |
| `BehaviorDefinition<TFormData>` | `{ workflow?; rules?; pipeline?: { nextStep?; preValidation?: (formData) => Promise<boolean> \| boolean; postSubmit?: (response, formData) => void } }`. |

### 10.4 `src/core/form-core/domain/presentation.ts`

Source: [presentation.ts](../../../src/core/form-core/domain/presentation.ts)

`PresentationDefinition` — `{ theme?: "light" \| "dark" \| "system" \| string; tokens?: { primaryColor?; backgroundColor?; borderRadius?; fontFamily?; densitySpacing? }; style?: { primaryColor?; backgroundColor?; borderRadius?; fontFamily?; customClasses?; classNames?: { shell?; atmosphere?; root?; header?; title?; description?; body?; footer?; actionContainer?; submitButton?; cancelButton?; [key: string]: string | undefined } }; animations?: { transitionDuration?; enterAnimation? } }`.

### 10.5 `src/core/form-core/domain/governance.ts`

Source: [governance.ts](../../../src/core/form-core/domain/governance.ts)

| Exported type | Description |
|---|---|
| `FieldAccessLevel` | `"editable" \| "readOnly" \| "hidden" \| "masked"`. |
| `FieldAccessRule` | `{ fieldId: string; roles?: string[]; access: FieldAccessLevel; condition?: string }`. |
| `RolePermissions` | `{ roles: string[]; defaultAccess?: FieldAccessLevel; rules?: FieldAccessRule[] }`. |
| `AuditConfig` | `{ trackChanges: boolean; requireReasonOnEdit?: boolean; excludeFields?: string[]; metadata?: Record<string, unknown> }`. |
| `ConcurrencyConfig` | `{ mode: "optimistic" \| "pessimistic" \| "lastWriteWins"; versionField?: string; onConflict?: "reject" \| "diff" \| "overwrite" }` — pairs with `StateManager.initConcurrency` / `reportConflict`. |
| `ComplianceConfig` | `{ maskPII?: boolean; maskedFields?: string[]; dataRetentionDays?: number; gdprSubjectField?: string }`. |
| `GovernanceDefinition` | Aggregate: `{ permissions?: RolePermissions; audit?: AuditConfig; concurrency?: ConcurrencyConfig; compliance?: ComplianceConfig; schemaVersion?: number }`. |

### 10.6 `src/core/form-core/domain/i18n.ts`

Source: [i18n.ts](../../../src/core/form-core/domain/i18n.ts)

```ts
export interface TranslatedText {
  en?: string;
  [locale: string]: string | undefined;
}

export interface Internationalization {
  label?: TranslatedText;
  description?: TranslatedText;
  placeholder?: TranslatedText;
  tooltip?: TranslatedText;
  helpText?: TranslatedText;
  errorMessages?: Record<string, TranslatedText>;
}

export interface Accessibility {
  ariaLabel?: string | TranslatedText;
  ariaDescribedBy?: string;
  ariaLabelledBy?: string;
  role?: string;
  tabIndex?: number;
  keyboardShortcuts?: string[];
}
```

### 10.7 `src/core/form-core/domain/security-performance.ts`

Source: [security-performance.ts](../../../src/core/form-core/domain/security-performance.ts)

```ts
export interface SecuritySettings {
  sanitizeHtml?: boolean;
  allowedTags?: string[];
  allowedAttributes?: Record<string, string[]>;
  scriptDisabled?: boolean;
  sandboxExpressions?: boolean;
  maxExpressionLength?: number;
}

export interface PerformanceSettings {
  lazyLoad?: boolean;
  virtualScroll?: boolean;
  chunkSize?: number;
  deferRendering?: boolean;
  throttleMs?: number;
  cacheResults?: boolean;
}

export interface HistorySettings {
  maxSteps?: number;
  trackChanges?: boolean;
  includeValues?: boolean;
  persistHistory?: boolean;
}
```

`SecuritySettings.sandboxExpressions` and `maxExpressionLength` constrain
`ReactiveEngine` evaluation; `HistorySettings` configures the snapshot policy
complementary to `FormHistory` options.

---

## 11. Field adapters & manifest

### 11.1 `src/core/form-core/domain/field-adapter-registry.ts`

Typed registry for custom field adapters (strategy pattern), allowing
domain-level parse/serialize/format/validate for new field types without
modifying the engine.

Source: [field-adapter-registry.ts](../../../src/core/form-core/domain/field-adapter-registry.ts)

#### `FieldAdapter<TValue>`

```ts
export interface FieldAdapter<TValue = unknown> {
  /** Unique field type key (e.g. 'color-palette', 'currency-range', 'signature') */
  readonly type: string;

  /** Coerces external/UI input (e.g. raw text, event) into internal model value */
  parse?(input: unknown): TValue;

  /** Serializes the internal model value for API payloads or persistent storage */
  serialize?(value: TValue): unknown;

  /** Formats the internal model value for human-readable display */
  format?(value: TValue): string;

  /** Custom domain validation rule for this field type */
  validate?(
    value: TValue,
    context?: Record<string, unknown>
  ): boolean | string | Promise<boolean | string>;
}
```

#### `FieldAdapterRegistry`

```ts
export class FieldAdapterRegistry
```

| Signature | Description |
|---|---|
| `public static getInstance(): FieldAdapterRegistry` | Lazy singleton accessor. |
| `public register<T = unknown>(adapter: FieldAdapter<T>): void` | Stores the adapter keyed by `adapter.type`. |
| `public get<T = unknown>(type: string): FieldAdapter<T> \| undefined` | Retrieves an adapter. |
| `public has(type: string): boolean` | Membership check. |
| `public parse(type: string, input: unknown): unknown` | Delegates to the adapter's `parse`, or returns `input` unchanged. |
| `public serialize(type: string, value: unknown): unknown` | Delegates to `serialize`, or returns `value`. |
| `public format(type: string, value: unknown): string` | Delegates to `format`, or returns `String(value ?? "")`. |
| `public clear(): void` | Removes all adapters (test isolation). |

#### `fieldAdapterRegistry` and `registerFieldAdapter`

```ts
export const fieldAdapterRegistry = FieldAdapterRegistry.getInstance();

export function registerFieldAdapter<T = unknown>(adapter: FieldAdapter<T>): void
```

Global singleton and convenience registration helper. `FieldResolver.getFieldType`
consults this registry when a field type is absent from `fieldTypeRegistry`.

### 11.2 `src/core/form-core/domain/field-adapter.ts`

Source: [field-adapter.ts](../../../src/core/form-core/domain/field-adapter.ts)

```ts
export function synthesizeFormField(
  props: Record<string, any>,
  existingField?: Partial<FormField>
): FormField
```

Canonically builds a full `FormField` from direct JSX props (used by
`withFieldShell` and `<Field />`). When `existingField` is provided, only the
overriding props (`type`, `component`, `label`, `placeholder`, `required`,
`disabled`, `options`) are merged over it; otherwise a standalone field is
synthesized with `id`/`name` falling back to each other (final fallback
`"unnamed"` / `"field-standalone"`) and `type` defaulting to `"text"`.

### 11.3 `src/core/form-core/domain/manifest.ts`

Registry-entry contracts for field type manifests and instance option
configuration.

Source: [manifest.ts](../../../src/core/form-core/domain/manifest.ts)

#### `ManifestFieldCategory` and `FieldRouting`

```ts
export type ManifestFieldCategory =
  | "input"
  | "static"
  | "container"
  | "composite";

export type FieldRouting = "leaf" | "container" | "repeater" | "slot";
```

#### `FieldManifest`

```ts
export interface FieldManifest {
  type: string;
  aliases?: string[];
  _isAlias?: boolean;
  category: ManifestFieldCategory;
  routing: FieldRouting;
  capabilities: FieldCapabilities;
  label: string;
  description?: string;
  icon?: any;
  component?: any;
  loader?: () => Promise<{ default: any }>;
  wrapper?: {
    enabled: boolean;
    showLabel?: boolean;
    wrapOuter?: boolean;
  };
  layout?: {
    acceptsChildren: boolean;
    childLayoutMode?: string;
    defaultColumns?: number;
  };
  overridable?: boolean;
}
```

`routing` tells the render pipeline how to place the node (leaf value field,
child-accepting container, repeater template, or injection slot); `loader`
supports lazy component imports.

#### `LayoutRendererManifest`

```ts
export interface LayoutRendererManifest {
  type: string;
  category: ManifestFieldCategory;
  acceptsChildren: boolean;
  childLayout?: string;
  component?: any;
  label?: string;
}
```

#### `InstanceDefinition`

```ts
export interface InstanceDefinition {
  options?: {
    source: "static" | "remote" | "computed";
    items?: Array<{ label: string; value: any; disabled?: boolean }>;
    remote?: {
      url: string;
      method?: "GET" | "POST";
      params?: Record<string, string>;
      headers?: Record<string, string>;
      watch?: string[];
      mapping?: { valuePath: string; labelPath: string; groupBy?: string };
    };
    search?: { mode: "client" | "server"; minChars?: number; debounceMs?: number };
  };
  selection?: {
    mode: "single" | "multiple" | "tags";
    clearable?: boolean;
    creatable?: boolean;
    maxItems?: number;
  };
  valueMapper?: {
    match?: (a: any, b: any) => boolean;
    toModel?: (display: any) => any;
    toDisplay?: (modelValue: any) => any;
  };
}
```

Per-instance configuration for select-like fields: option sourcing (static
items, remote fetch, or computed), search behavior, selection semantics, and
display/model value mapping.

---

## 12. Barrel

### 12.1 `src/core/form-core/domain/index.ts`

Source: [index.ts](../../../src/core/form-core/domain/index.ts)

Re-exports every domain module via `export *` in this order: `condition`,
`i18n`, `reactive`, `security-performance`, `validation`, `field`, `section`,
`content`, `surface`, `behavior`, `presentation`, `manifest`, `definition`,
`state`, `formatters`, `field-adapter`, `field-adapter-registry`,
`governance`, `paths`, `dependency-graph`.

Canonical alias:

```ts
export type { FormField as FieldDefinition } from "./field";
```

`FieldDefinition` is the legacy public name for the `FormField` entity.

---

**See also:**

- [01-ENGINE.md](01-ENGINE.md) — how `FormCore` consumes these contracts
- [02-REGISTRIES.md](02-REGISTRIES.md) — runtime registries keyed by the manifest types
- [03-MODULES.md](03-MODULES.md) — engine modules that read and write these types
- [05-ADAPTERS_UTILS.md](05-ADAPTERS_UTILS.md) — adapters translating domain types to UI props
- [08-FIELD_CATALOG.md](08-FIELD_CATALOG.md) — built-in field types and their manifests
- [11-TYPES_CONTRACTS.md](11-TYPES_CONTRACTS.md) — internal engine types (`NormalizedForm`, `InternalFormState`, `RenderNode`)
