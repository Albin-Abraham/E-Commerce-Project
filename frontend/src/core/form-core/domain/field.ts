/* ============================================================================
 *  FORM FIELD DOMAIN ENTITIES & CONTRACTS
 * ============================================================================*/
import type { FieldConditionExpression } from "./condition";
import type {
  Accessibility,
  Internationalization,
  TranslatedText,
} from "./i18n";
import type { AutocompletePath, FieldPath } from "./paths";
import type { ComputedField, ReactiveValue } from "./reactive";
import type {
  HistorySettings,
  PerformanceSettings,
  SecuritySettings,
} from "./security-performance";
import type { ValidationSettings } from "./validation";

export type InputFieldType =
  | "string"
  | "number"
  | "boolean"
  | "array"
  | "object"
  | "text"
  | "textarea"
  | "email"
  | "password"
  | "phone"
  | "url"
  | "date"
  | "datetime"
  | "time"
  | "checkbox"
  | "radio"
  | "select"
  | "multiselect"
  | "switch"
  | "autocomplete"
  | "file"
  | "signature"
  | "rating"
  | "range"
  | "rich-text"
  | "formatted-number"
  | "search_input"
  | "table_filter"
  | "code";

export type StaticFieldType =
  | "header"
  | "paragraph"
  | "image"
  | "divider"
  | "divider-label"
  | "spacer"
  | "button";

export type StructureFieldType =
  | "container"
  | "card"
  | "section"
  | "repeater"
  | "progress-line"
  | "progress-circle"
  | "social"
  | "tab"
  | "slot"
  | "accordion"
  | "fieldset"
  | "group";

// Extension point: consumers augment this via declaration merging.
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface CustomFieldTypes {}

export type FieldType =
  | InputFieldType
  | StaticFieldType
  | StructureFieldType
  | keyof CustomFieldTypes
  | (string & {});

/**
 * Dot-notation path generator for nested schemas.
 * Re-exported from {@link FieldPath} for backward compatibility.
 */
export type StringPath<T> = FieldPath<T>;

export type FieldCategory = "input" | "static" | "structure";

export const FIELD_CONSTANTS = {
  CATEGORIES: {
    INPUT: "input" as FieldCategory,
    STATIC: "static" as FieldCategory,
    STRUCTURE: "structure" as FieldCategory,
  },
} as const;

export interface FieldCapabilities {
  hasValue: boolean; // allocate V1 (Values)
  hasValidity: boolean; // allocate V2 (Validity)
  hasVisibility: boolean; // allocate V3 (Visibility)
  hasView: boolean; // allocate V4 (View State)
  hasVitality: boolean; // allocate V5 (Vitality/Touched/Dirty)
  derivesValidityFromChildren?: boolean; // Signal for ErrorManager rollup
}

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

const CAPS: Record<string, FieldCapabilities> = {
  INPUT: {
    hasValue: true,
    hasValidity: true,
    hasVisibility: true,
    hasView: true,
    hasVitality: true,
  },
  STATIC: {
    hasValue: false,
    hasValidity: false,
    hasVisibility: true,
    hasView: true,
    hasVitality: false,
  },
  STRUCTURE: {
    hasValue: false,
    hasValidity: false,
    hasVisibility: true,
    hasView: true,
    hasVitality: false,
  },
  COLLECTOR: {
    hasValue: false,
    hasValidity: true,
    hasVisibility: true,
    hasView: true,
    hasVitality: false,
    derivesValidityFromChildren: true,
  },
};

export const FIELD_REGISTRY: Record<FieldType, FieldRegistryItem> = {
  string: {
    type: "string",
    category: "input",
    label: "String Data",
    capabilities: CAPS.INPUT,
  },
  number: {
    type: "number",
    category: "input",
    label: "Number Data",
    capabilities: CAPS.INPUT,
  },
  boolean: {
    type: "boolean",
    category: "input",
    label: "Boolean Data",
    capabilities: CAPS.INPUT,
  },
  array: {
    type: "array",
    category: "input",
    label: "Array Data",
    capabilities: CAPS.INPUT,
  },
  object: {
    type: "object",
    category: "input",
    label: "Object Data",
    capabilities: CAPS.INPUT,
  },
  text: {
    type: "text",
    category: "input",
    label: "Text Field",
    capabilities: CAPS.INPUT,
  },
  textarea: {
    type: "textarea",
    category: "input",
    label: "Text Area",
    capabilities: CAPS.INPUT,
  },
  email: {
    type: "email",
    category: "input",
    label: "Email",
    capabilities: CAPS.INPUT,
  },
  password: {
    type: "password",
    category: "input",
    label: "Password",
    capabilities: CAPS.INPUT,
  },
  phone: {
    type: "phone",
    category: "input",
    label: "Phone",
    capabilities: CAPS.INPUT,
  },
  url: {
    type: "url",
    category: "input",
    label: "URL",
    capabilities: CAPS.INPUT,
  },
  date: {
    type: "date",
    category: "input",
    label: "Date",
    capabilities: CAPS.INPUT,
  },
  datetime: {
    type: "datetime",
    category: "input",
    label: "Date & Time",
    capabilities: CAPS.INPUT,
  },
  time: {
    type: "time",
    category: "input",
    label: "Time",
    capabilities: CAPS.INPUT,
  },
  checkbox: {
    type: "checkbox",
    category: "input",
    label: "Checkbox",
    capabilities: CAPS.INPUT,
  },
  radio: {
    type: "radio",
    category: "input",
    label: "Radio Group",
    capabilities: CAPS.INPUT,
  },
  select: {
    type: "select",
    category: "input",
    label: "Select",
    capabilities: CAPS.INPUT,
  },
  multiselect: {
    type: "multiselect",
    category: "input",
    label: "Multi Select",
    capabilities: CAPS.INPUT,
  },
  switch: {
    type: "switch",
    category: "input",
    label: "Switch",
    capabilities: CAPS.INPUT,
  },
  autocomplete: {
    type: "autocomplete",
    category: "input",
    label: "Autocomplete",
    capabilities: CAPS.INPUT,
  },
  file: {
    type: "file",
    category: "input",
    label: "File Upload",
    capabilities: CAPS.INPUT,
  },
  signature: {
    type: "signature",
    category: "input",
    label: "Signature",
    capabilities: CAPS.INPUT,
  },
  rating: {
    type: "rating",
    category: "input",
    label: "Rating",
    capabilities: CAPS.INPUT,
  },
  range: {
    type: "range",
    category: "input",
    label: "Range Slider",
    capabilities: CAPS.INPUT,
  },
  "rich-text": {
    type: "rich-text",
    category: "input",
    label: "Rich Text",
    capabilities: CAPS.INPUT,
  },
  "formatted-number": {
    type: "formatted-number",
    category: "input",
    label: "Formatted Number",
    capabilities: CAPS.INPUT,
  },
  search_input: {
    type: "search_input",
    category: "input",
    label: "Search Input",
    capabilities: CAPS.INPUT,
  },
  table_filter: {
    type: "table_filter",
    category: "input",
    label: "Table Filter",
    capabilities: CAPS.INPUT,
  },
  code: {
    type: "code",
    category: "input",
    label: "Code",
    capabilities: CAPS.INPUT,
  },
  header: {
    type: "header",
    category: "static",
    label: "Header",
    capabilities: CAPS.STATIC,
  },
  paragraph: {
    type: "paragraph",
    category: "static",
    label: "Paragraph",
    capabilities: CAPS.STATIC,
  },
  image: {
    type: "image",
    category: "static",
    label: "Image",
    capabilities: CAPS.STATIC,
  },
  divider: {
    type: "divider",
    category: "static",
    label: "Divider",
    capabilities: CAPS.STATIC,
  },
  button: {
    type: "button",
    category: "static",
    label: "Button",
    capabilities: CAPS.STATIC,
  },
  container: {
    type: "container",
    category: "structure",
    label: "Container",
    capabilities: CAPS.STRUCTURE,
  },
  card: {
    type: "card",
    category: "structure",
    label: "Card",
    capabilities: CAPS.STRUCTURE,
  },
  section: {
    type: "section",
    category: "structure",
    label: "Section",
    capabilities: CAPS.STRUCTURE,
  },
  "progress-line": {
    type: "progress-line",
    category: "structure",
    label: "Progress Line",
    capabilities: CAPS.STRUCTURE,
  },
  "progress-circle": {
    type: "progress-circle",
    category: "structure",
    label: "Progress Circle",
    capabilities: CAPS.STRUCTURE,
  },
  repeater: {
    type: "repeater",
    category: "structure",
    label: "Repeater",
    capabilities: CAPS.COLLECTOR,
  },
  spacer: {
    type: "spacer",
    category: "structure",
    label: "Spacer",
    capabilities: CAPS.STRUCTURE,
  },
  tab: {
    type: "tab",
    category: "structure",
    label: "Tabs",
    capabilities: CAPS.STRUCTURE,
  },
  slot: {
    type: "slot",
    category: "structure",
    label: "Slot",
    capabilities: CAPS.STRUCTURE,
  },
  social: {
    type: "social",
    category: "structure",
    label: "Social Buttons",
    capabilities: CAPS.STRUCTURE,
  },
  accordion: {
    type: "accordion",
    category: "structure",
    label: "Accordion",
    capabilities: CAPS.STRUCTURE,
  },
  fieldset: {
    type: "fieldset",
    category: "structure",
    label: "Fieldset",
    capabilities: CAPS.COLLECTOR,
  },
  group: {
    type: "group",
    category: "structure",
    label: "Field Group",
    capabilities: CAPS.COLLECTOR,
  },
  "divider-label": {
    type: "divider-label",
    category: "static",
    label: "Labeled Divider",
    capabilities: CAPS.STATIC,
  },
};

export function getFieldCategory(type: FieldType): FieldCategory {
  return (
    (FIELD_REGISTRY[type]?.category as FieldCategory) ||
    (FIELD_CONSTANTS.CATEGORIES.INPUT as FieldCategory)
  );
}

export function getFieldDefinition(type: FieldType): FieldRegistryItem {
  return FIELD_REGISTRY[type] || { type, category: "input", label: type };
}

export function isNativeDelegationSupported(type: FieldType): boolean {
  const category = getFieldCategory(type);
  if (category !== "input") return false;

  const customHeadlessTypes: FieldType[] = [
    "select",
    "multiselect",
    "autocomplete",
    "rich-text",
    "signature",
    "rating",
  ];

  return !customHeadlessTypes.includes(type);
}

export function extractNativeDOMValue(
  target: any
): any {
  if (typeof HTMLInputElement !== "undefined" && target instanceof HTMLInputElement) {
    switch (target.type) {
      case "checkbox":
        return target.checked;
      case "radio":
        return target.checked ? target.value : undefined;
      case "number":
      case "range":
        return Number.isNaN(target.valueAsNumber)
          ? target.value
          : target.valueAsNumber;
      case "file":
        return target.files;
      default:
        return target.value;
    }
  }
  return target?.value;
}

export interface FieldOption {
  label: string | TranslatedText;
  value: any;
  disabled?: boolean;
  description?: string | TranslatedText;
  icon?: string;
  meta?: any;
}

export interface DynamicOptionSource {
  url: string;
  method?: "GET" | "POST";
  payloadFields?: string[];
  dataPath?: string;
  labelPath?: string;
  valuePath?: string;
  mapping?: {
    labelPath?: string;
    valuePath?: string;
    descriptionPath?: string;
    iconPath?: string;
  };
  dependsOn?: string[];
  debounceMs?: number;
  cacheTTL?: number;
  minChars?: number;
  headers?: Record<string, string>;
}

export type SyncMode = "keystroke" | "blur" | "manual";

export interface RemoteOptions {
  url: string;
  method?: "GET" | "POST";
  params?: Record<string, string>;
  headers?: Record<string, string>;
  watch?: string[];
  debounceMs?: number;
  mapping?: {
    valuePath?: string;
    labelPath?: string;
    descriptionPath?: string;
    iconPath?: string;
    groupBy?: string;
  };
}

export interface RepeaterConfig {
  rowStateStrategy?: "index" | "identity";
  rowIdentityField?: string;
  rowPathFormat?: RowPathFormat;
}

export interface RowPathFormat {
  template: string;
  identityField?: string;
}

export interface FormRow {
  id: string;
  fields: FormField[];
}

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

export interface FieldOptions {
  options?: FieldOption[];
  dynamicOptions?: DynamicOptionSource;
}

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

export interface FieldLayout {
  gridClass?: string;
  fullWidth?: boolean;
  columnSpan?: number;
  span?: "full" | "half" | "third" | "quarter";
  width?: "full" | "half" | "third" | "quarter";
  rowSpan?: number;
  rowStart?: number;
  colStart?: number;
  startNewRow?: boolean;
  responsive?: {
    hideOnMobile?: boolean;
    hideOnTablet?: boolean;
    hideOnDesktop?: boolean;
  };
}

export type SpacingScale =
  | "none"
  | "xs"
  | "sm"
  | "md"
  | "lg"
  | "xl"
  | "2xl"
  | "auto";

export interface ModifierProps {
  m?: SpacingScale;
  mt?: SpacingScale;
  mb?: SpacingScale;
  ml?: SpacingScale;
  mr?: SpacingScale;
  mx?: SpacingScale;
  my?: SpacingScale;
  p?: SpacingScale;
  pt?: SpacingScale;
  pb?: SpacingScale;
  pl?: SpacingScale;
  pr?: SpacingScale;
  px?: SpacingScale;
  py?: SpacingScale;
}

export interface FieldProperties {
  typography?: {
    variant?: "h1" | "h2" | "body" | "small" | "caption";
    alignment?: "left" | "center" | "right";
    weight?: "normal" | "medium" | "semibold" | "bold";
    color?: string;
  };
  labelPlacement?: "top" | "side" | "hidden" | "inline";
  borderRadius?: "none" | "small" | "default" | "large" | "full";
  width?: "quarter" | "third" | "half" | "full";
  startNewRow?: boolean;
  alignment?: "left" | "center" | "right";
  customClasses?: string | string[];
  placeholder?: string;
  intent?:
    | "primary"
    | "secondary"
    | "success"
    | "danger"
    | "warning"
    | "info"
    | "subtle";
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
  modifiers?: ModifierProps;
  backgroundColor?: string;
  border?: string;
  elevation?: "sm" | "md" | "lg" | "none";
  footer?: string;
  footerContent?: any;
  options?: FieldOption[];
  tooltip?: string | readonly string[];
  slotPlacement?: "inner" | "outer";
  tooltipPlacement?: "label" | "inner";
  [key: string]: any;
}

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
