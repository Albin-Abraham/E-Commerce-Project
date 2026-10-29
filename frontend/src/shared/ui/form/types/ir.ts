/**
 * Canonical Form Intermediate Representation (IR)
 *
 * This is the single source of truth for compiled forms.
 * Both EntityDefinition and Contract API compilers target this IR.
 * The IR is validated, normalized, and ready for FormCore consumption.
 */

import type { ValidationSettings } from "./validation";
import type { FieldConditionExpression } from "./condition";
import type { TranslatedText } from "./i18n-accessibility";
import type { LayoutMode } from "../context/LayoutContext";

/**
 * IR Field - Fully normalized field with all computed properties resolved
 */
export interface IRField<TFormData = Record<string, any>> {
  // Identity (required, guaranteed unique)
  id: string;
  name: string;
  key: string;

  // Type system (discriminated)
  type: string;
  component: string;
  category: "input" | "static" | "structure";

  // Display
  label: TranslatedText;
  description?: TranslatedText;
  placeholder?: TranslatedText;
  helpText?: TranslatedText;

  // Validation (normalized to ValidationSettings)
  validation: ValidationSettings;
  required: boolean;

  // Visibility & Enabled (normalized to expressions)
  visible: IRVisibilityCondition;
  enabled: IRVisibilityCondition;
  conditions?: FieldConditionExpression;

  // Layout (normalized to canonical 12-column grid)
  layout: IRFieldLayout;

  // Options (for select/radio/multiselect - always resolved)
  options: ReadonlyArray<IRFieldOption>;

  // Remote options (normalized)
  remoteOptions: IRRemoteOptions | null;

  // Properties (component-specific, validated)
  properties: IRFieldProperties;

  // Meta (serializable only)
  meta: IRFieldMeta;

  // Nested fields (for containers/structure)
  fields: ReadonlyArray<IRField<TFormData>>;

  // Repeater config
  repeaterConfig: IRRepeaterConfig | null;

  // Behavioral flags
  headless: boolean;
  ephemeral: boolean;
  syncMode: "keystroke" | "blur" | "manual";
  visibilityBehavior: "purge" | "preserve" | "suspend";

  // Computed field config
  computed: IRComputedConfig | null;
}

/**
 * IR Field Option - Fully normalized
 */
export interface IRFieldOption<TValue = string> {
  value: TValue;
  label: TranslatedText;
  description?: TranslatedText;
  icon?: string;
  disabled: boolean;
  meta: Record<string, any>;
}

/**
 * IR Remote Options - Normalized remote config
 */
export interface IRRemoteOptions {
  url: string;
  method: "GET" | "POST";
  params: Record<string, string>;
  headers: Record<string, string>;
  watch: ReadonlyArray<string>;
  debounceMs: number;
  mapping: {
    valuePath: string;
    labelPath: string;
    descriptionPath?: string;
    iconPath?: string;
    groupBy?: string;
  };
  cache: boolean;
  cacheTTL: number;
}

/**
 * IR Field Layout - Canonical 12-column grid
 */
export interface IRFieldLayout {
  columnSpan: number;        // 1-12
  rowSpan: number;           // >=1
  startNewRow: boolean;
  responsive: {
    hideOnMobile: boolean;
    hideOnTablet: boolean;
    hideOnDesktop: boolean;
  };
}

/**
 * IR Visibility Condition - Normalized to expression string
 */
export type IRVisibilityCondition =
  | true                              // Always visible/enabled
  | false                             // Never visible/enabled
  | string;                           // Expression: "field.name === 'value'"

/**
 * IR Field Properties - Validated component props
 */
export interface IRFieldProperties {
  // Common
  placeholder?: TranslatedText;
  intent?: "primary" | "secondary" | "danger" | "warning" | "success" | "subtle";
  icon?: string;
  prefix?: string;
  suffix?: string;
  tooltip?: TranslatedText;
  tooltipPlacement?: "top" | "bottom" | "left" | "right";
  reserveErrorSpace: boolean;
  autoFocus: boolean;

  // Input-specific (validated by component)
  maxLength?: number;
  minLength?: number;
  rows?: number;
  mask?: string;
  min?: number;
  max?: number;
  step?: number;
  format?: string;
  accept?: string;
  multiple?: boolean;
  maxSize?: number;
  maxSelected?: number;
  isClearable?: boolean;
  direction?: "row" | "column";

  // Structural
  variant?: string;
  size?: string;
  elevation?: "none" | "sm" | "md" | "lg";
  padding?: string;
  border?: string;
  background?: string;
  borderRadius?: string;
  shadow?: string;

  // Slot configuration
  slotTemplate?: string;
  displayConfig?: IRDisplayConfig;

  // Allow extension
  [key: string]: any;
}

/**
 * IR Display Config - Semantic display for rich options
 */
export interface IRDisplayConfig {
  titleKey: string;
  subtitleKey?: string;
  avatarKey?: string;
  statusKey?: string;
}

/**
 * IR Field Meta - Serializable metadata only
 */
export interface IRFieldMeta {
  ui: {
    displayConfig?: IRDisplayConfig;
    icon?: string;
    slotTemplate?: string;
    [key: string]: any;
  };
  accessibility?: Record<string, any>;
  [key: string]: any;
}

/**
 * IR Repeater Config
 */
export interface IRRepeaterConfig {
  rowStateStrategy: "index" | "identity";
  rowIdentityField?: string;
  rowPathFormat: {
    template: string;
    identityField?: string;
  };
  minItems: number;
  maxItems: number;
  addButtonLabel: TranslatedText;
}

/**
 * IR Computed Config
 */
export interface IRComputedConfig {
  expression: string;
  dependsOn: ReadonlyArray<string>;
}

/**
 * IR Section - Fully normalized
 */
export interface IRSection<TFormData = Record<string, any>> {
  id: string;
  title?: TranslatedText;
  description?: TranslatedText;
  layout: IRSectionLayout;
  fields: ReadonlyArray<IRField<TFormData>>;
  subSections: ReadonlyArray<IRSection<TFormData>>;
  nextStep: IRNextStepConfig;
  visible: IRVisibilityCondition;
}

/**
 * IR Section Layout
 */
export interface IRSectionLayout {
  type: "grid" | "flex" | "block" | "card" | "accordion" | "tabs" | "fieldset" | "container" | "group";
  columns: number;
  gap: string;           // Canonical gap token: "none" | "xs" | "sm" | "md" | "lg" | "xl" | "xxl"
  rowGap?: string;
  colGap?: string;
  direction?: "row" | "column" | "row-reverse" | "column-reverse";
  wrap?: boolean;
}

/**
 * IR Next Step Config (for wizard)
 */
export type IRNextStepConfig =
  | null
  | string
  | { resolver: string };  // Expression: "(values) => values.hasCompany ? 'company' : 'preferences'"

/**
 * IR Form Settings
 */
export interface IRFormSettings {
  density: "compact" | "comfortable" | "spacious";
  width: "full" | "contained" | "max-w-2xl";
  layoutMode: LayoutMode;
  stickyHeader: boolean;
  stickyFooter: boolean;
  maxHeight: string | null;
  hideHeader: boolean;
  hideFooter: boolean;
  showValidationOnTouch: boolean;
  validationMode: "onChange" | "onBlur" | "onSubmit" | "manual" | "lazy";
  validationDebounceMs: number;
  wizard: IRWizardConfig;
}

/**
 * IR Wizard Config
 */
export interface IRWizardConfig {
  enabled: boolean;
  stepperType: "sidebar" | "top";
  linear: boolean;
  initialStepId: string;
}

/**
 * IR Form Style (DCS)
 */
export interface IRFormStyle {
  primaryColor: string;
  backgroundColor: string;
  borderRadius: string;
  fontFamily: string;
  customClasses: string;
  classNames: {
    shell: string;
    atmosphere: string;
    root: string;
    header: string;
    title: string;
    description: string;
    body: string;
    footer: string;
    actionContainer: string;
    submitButton: string;
    cancelButton: string;
  };
}

/**
 * IR Form Events
 */
export interface IRFormEvents<TFormData = Record<string, any>> {
  onInit?: (data: TFormData) => void;
  onChange?: (data: TFormData, changedField?: IRField<TFormData>) => void;
  onSelectChange?: (data: TFormData, changedField?: IRField<TFormData>) => void;
  beforeSubmit?: (data: TFormData) => boolean | void;
  onSubmit?: (data: TFormData) => Promise<void> | void;
  afterSubmit?: (data: TFormData) => void;
  onError?: (error: Error, data: TFormData) => void;
}

/**
 * IR Behavior - Normalized middleware and pipeline
 */
export interface IRBehavior<TFormData = Record<string, any>> {
  pipeline: {
    middleware: ReadonlyArray<IRMiddleware>;
  };
  events: IRFormEvents<TFormData>;
}

/**
 * IR Middleware - Serializable middleware reference
 */
export interface IRMiddleware {
  id: string;
  type: "builtin" | "custom";
  // For builtin: reference to registered middleware
  // For custom: expression or function reference
  handler: string;
  config?: Record<string, any>;
}

/**
 * Canonical Form IR - The complete validated intermediate representation
 */
export interface CanonicalFormIR<TFormData = Record<string, any>> {
  // Identity
  id: string;
  version: string;
  title: TranslatedText;
  description?: TranslatedText;
  submitLabel: TranslatedText;
  cancelLabel: TranslatedText;

  // Layers (fully resolved)
  content: {
    sections: ReadonlyArray<IRSection<TFormData>>;
    fields: ReadonlyArray<IRField<TFormData>>;  // Root-level fields
  };
  behavior: IRBehavior<TFormData>;
  settings: IRFormSettings;
  style: IRFormStyle;

  // Metadata
  metadata: Record<string, any>;
  locale: string;

  // Injections (resolved)
  injections: {
    validations: Record<string, ValidationSettings>;
    ui: Record<string, Partial<IRField<TFormData>>>;
    conditions: Record<string, FieldConditionExpression>;
    layout: Record<string, any>;
    behavior: Record<string, any>;
    theme: Record<string, any>;
    print: Record<string, any>;
  };

  // Advanced
  performance: IRPerformanceSettings;
  security: IRSecuritySettings;
  history: IRHistorySettings;
}

/**
 * IR Performance Settings
 */
export interface IRPerformanceSettings {
  enableBatching: boolean;
  maxReRenderDepth: number;
  subscriptionGranularity: "field" | "section" | "form";
}

/**
 * IR Security Settings
 */
export interface IRSecuritySettings {
  sanitizeOutput: boolean;
  allowedExpressionFunctions: ReadonlyArray<string>;
  maxExpressionDepth: number;
  requireActionRegistration: boolean;
  tenantIsolation: boolean;
}

/**
 * IR History Settings
 */
export interface IRHistorySettings {
  enabled: boolean;
  maxSnapshots: number;
  ignoreFields: ReadonlyArray<string>;
}

/**
 * IR Validation Result
 */
export interface IRValidationResult {
  valid: boolean;
  errors: IRValidationError[];
  warnings: IRValidationWarning[];
}

export interface IRValidationError {
  code: string;
  message: string;
  path: string;           // JSON path in IR (e.g., "content.sections[0].fields[2].validation")
  severity: "error" | "warning";
}

export interface IRValidationWarning {
  code: string;
  message: string;
  path: string;
}

/**
 * Compilation Result
 */
export interface CompilationResult<TFormData = Record<string, any>> {
  ir: CanonicalFormIR<TFormData>;
  validation: IRValidationResult;
  sourceMap?: SourceMapEntry[];
}

export interface SourceMapEntry {
  irPath: string;           // Path in IR
  sourcePath: string;       // Path in source (EntityDefinition/Contract)
  sourceType: "entity" | "contract";
}

/**
 * Type guards
 */
export function isIRInputField(field: IRField): field is IRField & { category: "input" } {
  return field.category === "input";
}

export function isIRStructureField(field: IRField): field is IRField & { category: "structure" } {
  return field.category === "structure";
}

export function isIRStaticField(field: IRField): field is IRField & { category: "static" } {
  return field.category === "static";
}

/**
 * IR Version - for migration tracking
 */
export const IR_VERSION = "1.0.0";

export interface IRVersionInfo {
  version: string;
  compiledAt: string;
  compiler: "entity" | "contract";
  sourceHash: string;
}