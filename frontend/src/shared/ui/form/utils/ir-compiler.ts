/**
 * IR Compiler
 *
 * Single compilation pipeline for both EntityDefinition and Contract API.
 * Produces validated CanonicalFormIR from either authoring format.
 */

import type {
  CanonicalFormIR,
  IRField,
  IRSection,
  IRFieldOption,
  IRFieldLayout,
  IRSectionLayout,
  IRFormSettings,
  IRFormStyle,
  IRBehavior,
  IRMiddleware,
  IRRemoteOptions,
  IRFieldProperties,
  IRFieldMeta,
  IRRepeaterConfig,
  IRComputedConfig,
  IRVisibilityCondition,
  CompilationResult,
  SourceMapEntry,
  IRFormEvents,
  IRNextStepConfig,
} from "../types/ir";
import type { EntityDefinition } from "../types/application";
import type { FormDefinitionContract } from "../types/contract";
import type { FormDefinition } from "../types";
import type { RawFormField, RawFormSection } from "../fields";
import { fuseSchema } from "./schema-fusion";
import { validateIR } from "./ir-validator";

/**
 * Main compilation entry point - compiles any authoring format to IR
 */
export function compileToIR<T extends Record<string, any> = Record<string, any>>(
  source: EntityDefinition<T> | FormDefinitionContract<any>,
  options: {
    formId: string;
    submitLabel: string;
    sourceType: "entity" | "contract";
  }
): CompilationResult<T> {
  const { formId, submitLabel, sourceType } = options;

  // Step 1: Convert to unified FormDefinition (legacy pipeline)
  let formDef: FormDefinition<T>;
  const sourceMap: SourceMapEntry[] = [];

  if (sourceType === "entity") {
    formDef = compileEntityFromEntityDef(source as EntityDefinition<T>, formId, submitLabel, sourceMap);
  } else {
    formDef = compileEntityFromContract(source as FormDefinitionContract<any>, formId, submitLabel, sourceMap);
  }

  // Step 2: Normalize to CanonicalFormIR
  const ir = normalizeToIR(formDef, formId, submitLabel, sourceType, sourceMap);

  // Step 3: Validate IR
  const validation = validateIR(ir);

  return { ir, validation, sourceMap };
}

/**
 * Compile EntityDefinition to FormDefinition (legacy path preserved for compat)
 */
function compileEntityFromEntityDef<T extends Record<string, any>>(
  entity: EntityDefinition<T>,
  formId: string,
  submitLabel: string,
  sourceMap: SourceMapEntry[]
): FormDefinition<T> {
  const content = entity.content || {};
  const behavior = entity.behavior;
  const surface = entity.surface?.ui as any;
  const presentation = entity.presentation;

  // 1. Apply Behavior Pipeline Middleware & Events
  const fieldsWithBehavior = (content.sections || []).map((section) => ({
    ...section,
    fields: (section.fields || []).map((field: any) => ({
      ...field,
      meta: {
        ...field.meta,
        events: {
          ...(field.meta?.events || {}),
        },
      },
    })),
  }));

  const flatContent = { ...content, sections: fieldsWithBehavior };

  // 2. Map MDAP Surface & Presentation to the Fusion Engine
  const uiConfig = {
    shell: surface?.shell,
    settings: {
      density: surface?.density,
      maxHeight: surface?.maxHeight,
      wizard: surface?.wizard,
    },
    style: presentation?.style,
  };

  // 3. Compile everything down to a standard FormDefinition
  const compiled = fuseSchema(flatContent as any, uiConfig);
  compiled.id = formId;
  compiled.submitLabel = submitLabel;

  if (behavior?.pipeline?.middleware) {
    compiled.events = {
      ...compiled.events,
      onSubmit: async (data: any) => {
        for (const mw of behavior.pipeline!.middleware!) {
          await mw(data);
        }
      },
    };
  }

  // Add source map entries
  if (entity.content?.sections) {
    entity.content.sections.forEach((section, si) => {
      sourceMap.push({
        irPath: `content.sections[${si}]`,
        sourcePath: `content.sections[${si}]`,
        sourceType: "entity",
      });
      section.fields?.forEach((field, fi) => {
        sourceMap.push({
          irPath: `content.sections[${si}].fields[${fi}]`,
          sourcePath: `content.sections[${si}].fields[${fi}]`,
          sourceType: "entity",
        });
      });
    });
  }

  return compiled as FormDefinition<T>;
}

/**
 * Compile Contract API to FormDefinition
 */
function compileEntityFromContract<T extends Record<string, any>>(
  contract: FormDefinitionContract<any>,
  formId: string,
  submitLabel: string,
  sourceMap: SourceMapEntry[]
): FormDefinition<T> {
  // The contract IS a FormDefinition at runtime (via cast)
  // But we need to normalize it through fuseSchema for consistency
  const formDef = contract as unknown as FormDefinition<T>;
  formDef.id = formId;
  formDef.submitLabel = submitLabel;

  // Track source mappings
  if (contract.sections) {
    contract.sections.forEach((section, si) => {
      sourceMap.push({
        irPath: `content.sections[${si}]`,
        sourcePath: `sections[${si}]`,
        sourceType: "contract",
      });
      section.fields?.forEach((field, fi) => {
        sourceMap.push({
          irPath: `content.sections[${si}].fields[${fi}]`,
          sourcePath: `sections[${si}].fields[${fi}]`,
          sourceType: "contract",
        });
      });
    });
  }

  return formDef;
}

/**
 * Normalize FormDefinition to CanonicalFormIR
 */
function normalizeToIR<T extends Record<string, any>>(
  formDef: FormDefinition<T>,
  formId: string,
  submitLabel: string,
  sourceType: "entity" | "contract",
  sourceMap: SourceMapEntry[]
): CanonicalFormIR<T> {
  const now = new Date().toISOString();
  const sourceHash = generateSourceHash(formDef);

  // Normalize sections
  const sections: IRSection<T>[] = (formDef.sections || []).map((section, si) =>
    normalizeSection(section, si, sourceMap)
  );

  // Normalize root fields
  const rootFields: IRField<any, T>[] = (formDef.fields || []).map((field, fi) =>
    normalizeField(field, fi, null, sourceMap)
  );

  // Normalize settings
  const settings = normalizeSettings(formDef.settings);

  // Normalize style
  const style = normalizeStyle(formDef.style);

  // Normalize behavior
  const behavior = normalizeBehavior(formDef, sourceMap);

  // Normalize events
  const events = normalizeEvents(formDef.events);

  // Build IR
  const ir: CanonicalFormIR<T> = {
    id: formDef.id || formId,
    version: formDef.version || "1.0.0",
    title: formDef.title || formId || "Form",
    description: formDef.description,
    submitLabel,
    cancelLabel: formDef.cancelLabel || "Cancel",

    content: {
      sections,
      fields: rootFields,
    },
    behavior,
    settings,
    style,

    metadata: formDef.metadata || {},
    locale: formDef.metadata?.locale || "en",

    injections: normalizeInjections(formDef.injections),

    performance: {
      enableBatching: true,
      maxReRenderDepth: 10,
      subscriptionGranularity: "field",
    },
    security: {
      sanitizeOutput: true,
      allowedExpressionFunctions: ["today", "sum", "uppercase", "lowercase", "currency", "hasrole"],
      maxExpressionDepth: 10,
      requireActionRegistration: true,
      tenantIsolation: false,
    },
    history: {
      enabled: false,
      maxSnapshots: 50,
      ignoreFields: ["password", "token", "secret"],
    },
  };

  return ir;
}

/**
 * Normalize a section to IR
 */
function normalizeSection<T>(
  section: RawFormSection<T>,
  index: number,
  sourceMap: SourceMapEntry[]
): IRSection<T> {
  const sectionId = section.id || `section_${index}`;

  const fields: IRField<any, T>[] = (section.fields || []).map((field, fi) =>
    normalizeField(field, fi, sectionId, sourceMap)
  );

  const subSections: IRSection<T>[] = (section.subSections || []).map((sub, si) =>
    normalizeSection(sub, si, sourceMap)
  );

  return {
    id: sectionId,
    title: section.title,
    description: section.description,
    layout: normalizeSectionLayout(section.layout),
    fields,
    subSections,
    nextStep: normalizeNextStep(section.nextStep),
    visible: normalizeVisibilityCondition(section.visible),
  };
}

/**
 * Normalize a field to IR
 */
function normalizeField<TFormData>(
  field: RawFormField<any, any, TFormData>,
  index: number,
  parentSectionId: string | null,
  sourceMap: SourceMapEntry[]
): IRField<any, TFormData> {
  const fieldId = field.id || field.key || field.name || `field_${index}`;
  const fieldName = field.name || field.key || fieldId;
  const fieldKey = field.key || fieldName;

  // Determine category and component
  const { category, component } = resolveFieldCategoryAndComponent(field);

  // Normalize options
  const options = normalizeOptions(field.options, field.remoteOptions);

  // Normalize remote options
  const remoteOptions = normalizeRemoteOptions(field.remoteOptions);

  // Normalize layout
  const layout = normalizeFieldLayout(field.layout, field.columnSpan);

  // Normalize properties
  const properties = normalizeProperties(field.properties, field.componentProps);

  // Normalize meta
  const meta = normalizeMeta(field.meta);

  // Normalize validation
  const validation = normalizeValidation(field.validation);

  // Normalize visibility/enabled conditions
  const visible = normalizeVisibilityCondition(field.visible);
  const enabled = normalizeVisibilityCondition(field.enabled);

  // Normalize nested fields
  const nestedFields: IRField<any, TFormData>[] = (field.fields || []).map((child, ci) =>
    normalizeField(child, ci, fieldId, sourceMap)
  );

  // Normalize repeater config
  const repeaterConfig = normalizeRepeaterConfig(field.repeaterConfig);

  // Normalize computed
  const computed = normalizeComputed(field.computed);

  return {
    id: fieldId,
    name: fieldName,
    key: fieldKey,
    type: field.type || "string",
    component,
    category,
    label: field.label || fieldName,
    description: field.description,
    placeholder: field.placeholder,
    helpText: (field.meta?.ui as any)?.helpText,
    validation,
    required: !!field.required,
    visible,
    enabled,
    conditions: field.conditions,
    layout,
    options,
    remoteOptions,
    properties,
    meta,
    fields: nestedFields,
    repeaterConfig,
    headless: !!field.headless,
    ephemeral: !!field.ephemeral,
    syncMode: field.syncMode || "keystroke",
    visibilityBehavior: field.visibilityBehavior || "purge",
    computed,
    customData: (field as any).customData,
    initialValue: (field as any).initialValue,
  };
}

/**
 * Resolve field category and component from type/component
 */
function resolveFieldCategoryAndComponent(field: RawFormField): { category: "input" | "static" | "structure"; component: string } {
  const type = field.type;
  const component = field.component;

  // Structure types
  const structureTypes = ["container", "card", "section", "repeater", "accordion", "tabs", "fieldset", "group", "slot", "divider-label"];
  if (structureTypes.includes(type) || structureTypes.includes(component as string)) {
    return { category: "structure", component: component || type };
  }

  // Static types
  const staticTypes = ["header", "paragraph", "divider", "divider-label", "spacer", "button", "image", "message", "html", "qr-code", "tooltip", "progress-line", "progress-circle", "social"];
  if (staticTypes.includes(type) || staticTypes.includes(component as string)) {
    return { category: "static", component: component || type };
  }

  // Input types - map to component
  const componentMap: Record<string, string> = {
    text: "text",
    textarea: "textarea",
    email: "email",
    password: "password",
    phone: "phone",
    url: "url",
    date: "date",
    datetime: "datetime",
    time: "time",
    checkbox: "checkbox",
    radio: "radio",
    select: "select",
    multiselect: "multiselect",
    switch: "switch",
    autocomplete: "autocomplete",
    file: "file",
    image: "image",
    signature: "signature",
    rating: "rating",
    range: "range",
    "rich-text": "rich-text",
    "formatted-number": "formatted-number",
    search_input: "search_input",
    table_filter: "table_filter",
    code: "code",
    number: "number",
    string: "text",
    boolean: "checkbox",
    array: "multiselect",
    object: "container",
  };

  const resolvedComponent = component || componentMap[type] || "text";
  return { category: "input", component: resolvedComponent };
}

/**
 * Normalize field options
 */
function normalizeOptions(
  options?: RawFormField["options"],
  remoteOptions?: RawFormField["remoteOptions"]
): ReadonlyArray<IRFieldOption> {
  if (remoteOptions) {
    // Remote options - return empty, will be fetched at runtime
    return [];
  }
  if (!options) return [];

  return options.map((opt) => ({
    value: opt.value,
    label: opt.label,
    description: opt.description,
    icon: opt.icon,
    disabled: !!opt.disabled,
    meta: opt.meta || {},
  }));
}

/**
 * Normalize remote options
 */
function normalizeRemoteOptions(remoteOptions?: RawFormField["remoteOptions"]): IRRemoteOptions | null {
  if (!remoteOptions) return null;

  return {
    url: remoteOptions.url,
    method: remoteOptions.method || "GET",
    params: remoteOptions.params || {},
    headers: remoteOptions.headers || {},
    watch: remoteOptions.watch || [],
    debounceMs: remoteOptions.debounceMs || 300,
    mapping: {
      valuePath: remoteOptions.mapping?.valuePath || "id",
      labelPath: remoteOptions.mapping?.labelPath || "name",
      descriptionPath: remoteOptions.mapping?.descriptionPath,
      iconPath: remoteOptions.mapping?.iconPath,
      groupBy: remoteOptions.mapping?.groupBy,
    },
    cache: remoteOptions.cache !== false,
    cacheTTL: 300000, // 5 min default
  };
}

/**
 * Normalize field layout to canonical 12-column
 */
function normalizeFieldLayout(
  layout?: RawFormField["layout"],
  columnSpan?: number
): IRFieldLayout {
  return {
    columnSpan: columnSpan || (layout as any)?.columnSpan || 12,
    rowSpan: (layout as any)?.rowSpan || 1,
    startNewRow: !!(layout as any)?.startNewRow,
    responsive: {
      hideOnMobile: (layout as any)?.responsive?.hideOnMobile || false,
      hideOnTablet: (layout as any)?.responsive?.hideOnTablet || false,
      hideOnDesktop: (layout as any)?.responsive?.hideOnDesktop || false,
    },
  };
}

/**
 * Normalize section layout
 */
function normalizeSectionLayout(layout?: RawFormSection["layout"]): IRSectionLayout {
  if (!layout) {
    return { type: "grid", columns: 12, gap: "md" };
  }

  if (typeof layout === "string") {
    return { type: layout as any, columns: 12, gap: "md" };
  }

  const type = (layout as any)?.type || "grid";
  const columns = (layout as any)?.columns || 12;
  const gap = (layout as any)?.gap || "md";

  return {
    type,
    columns,
    gap,
    rowGap: (layout as any)?.rowGap,
    colGap: (layout as any)?.colGap,
    direction: (layout as any)?.direction,
    wrap: (layout as any)?.wrap,
  };
}

/**
 * Normalize nextStep config
 */
function normalizeNextStep(nextStep?: RawFormSection["nextStep"]): IRNextStepConfig {
  if (!nextStep) return null;
  if (typeof nextStep === "string") return nextStep;
  if (typeof nextStep === "function") return { resolver: nextStep.toString() };
  return null;
}

/**
 * Normalize visibility condition to IRVisibilityCondition
 */
function normalizeVisibilityCondition(visible?: RawFormField["visible"]): IRVisibilityCondition {
  if (visible === undefined) return true;
  if (typeof visible === "boolean") return visible;
  if (typeof visible === "function") return visible.toString();
  // ReactiveValue or expression - convert to string
  return String(visible);
}

/**
 * Normalize properties
 */
function normalizeProperties(
  properties?: RawFormField["properties"],
  componentProps?: RawFormField["componentProps"]
): IRFieldProperties {
  const merged = { ...properties, ...componentProps };

  return {
    placeholder: merged?.placeholder,
    intent: merged?.intent,
    icon: merged?.icon,
    prefix: merged?.prefix,
    suffix: merged?.suffix,
    tooltip: merged?.tooltip,
    tooltipPlacement: merged?.tooltipPlacement,
    reserveErrorSpace: merged?.reserveErrorSpace || false,
    autoFocus: merged?.autoFocus || false,
    maxLength: merged?.maxLength,
    minLength: merged?.minLength,
    rows: merged?.rows,
    mask: merged?.mask,
    min: merged?.min,
    max: merged?.max,
    step: merged?.step,
    format: merged?.format,
    accept: merged?.accept,
    multiple: merged?.multiple,
    maxSize: merged?.maxSize,
    maxSelected: merged?.maxSelected,
    isClearable: merged?.isClearable,
    direction: merged?.direction,
    variant: merged?.variant,
    size: merged?.size,
    elevation: merged?.elevation,
    padding: merged?.padding,
    border: merged?.border,
    background: merged?.background,
    borderRadius: merged?.borderRadius,
    shadow: merged?.shadow,
    slotTemplate: merged?.slotTemplate,
    displayConfig: merged?.displayConfig,
    ...merged,
  };
}

/**
 * Normalize meta
 */
function normalizeMeta(meta?: RawFormField["meta"]): IRFieldMeta {
  return {
    ui: meta?.ui || {},
    accessibility: meta?.accessibility || {},
    ...meta,
  };
}

/**
 * Normalize validation settings
 */
function normalizeValidation(validation?: ValidationSettings): ValidationSettings {
  return {
    required: validation?.required || false,
    minLength: validation?.minLength,
    maxLength: validation?.maxLength,
    pattern: validation?.pattern,
    min: validation?.min,
    max: validation?.max,
    email: validation?.email || false,
    url: validation?.url || false,
    custom: validation?.custom,
    validateOn: validation?.validateOn || ["blur"],
    disableDeferredValidation: validation?.disableDeferredValidation || false,
  };
}

/**
 * Normalize repeater config
 */
function normalizeRepeaterConfig(config?: RawFormField["repeaterConfig"]): IRRepeaterConfig | null {
  if (!config) return null;
  return {
    rowStateStrategy: config.rowStateStrategy || "index",
    rowIdentityField: config.rowIdentityField,
    rowPathFormat: {
      template: config.rowPathFormat?.template || "[idx].",
      identityField: config.rowPathFormat?.identityField,
    },
    minItems: 0,
    maxItems: 100,
    addButtonLabel: "Add Item",
  };
}

/**
 * Normalize computed field config
 */
function normalizeComputed(computed?: RawFormField["computed"]): IRComputedConfig | null {
  if (!computed) return null;
  return {
    expression: computed.expression,
    dependsOn: computed.dependsOn || [],
  };
}

/**
 * Normalize form settings
 */
function normalizeSettings(settings?: FormDefinition["settings"]): IRFormSettings {
  return {
    density: settings?.density || "comfortable",
    width: settings?.width || "contained",
    layoutMode: settings?.layoutMode || "portal",
    stickyHeader: settings?.stickyHeader || false,
    stickyFooter: settings?.stickyFooter || false,
    maxHeight: settings?.maxHeight || null,
    hideHeader: settings?.hideHeader || false,
    hideFooter: settings?.hideFooter || false,
    showValidationOnTouch: settings?.showValidationOnTouch || false,
    validationMode: settings?.validationMode || "onBlur",
    validationDebounceMs: 300,
    wizard: {
      enabled: settings?.wizard?.enabled || false,
      stepperType: settings?.wizard?.stepperType || "sidebar",
      linear: settings?.wizard?.linear ?? true,
      initialStepId: settings?.wizard?.initialStepId || "",
    },
  };
}

/**
 * Normalize style
 */
function normalizeStyle(style?: FormDefinition["style"]): IRFormStyle {
  return {
    primaryColor: style?.primaryColor || "#3b82f6",
    backgroundColor: style?.backgroundColor || "transparent",
    borderRadius: style?.borderRadius || "0.5rem",
    fontFamily: style?.fontFamily || "inherit",
    customClasses: style?.customClasses || "",
    classNames: {
      shell: style?.classNames?.shell || "",
      atmosphere: style?.classNames?.atmosphere || "",
      root: style?.classNames?.root || "",
      header: style?.classNames?.header || "",
      title: style?.classNames?.title || "",
      description: style?.classNames?.description || "",
      body: style?.classNames?.body || "",
      footer: style?.classNames?.footer || "",
      actionContainer: style?.classNames?.actionContainer || "",
      submitButton: style?.classNames?.submitButton || "",
      cancelButton: style?.classNames?.cancelButton || "",
    },
  };
}

/**
 * Normalize behavior (middleware + events)
 */
function normalizeBehavior<T>(
  formDef: FormDefinition<T>,
  sourceMap: SourceMapEntry[]
): IRBehavior<T> {
  const middleware: IRMiddleware<T>[] = [];

  // From pipeline.middleware
  if (formDef.pipeline?.middleware) {
    formDef.pipeline.middleware.forEach((mw, i) => {
      middleware.push({
        id: `pipeline_${i}`,
        type: "builtin",
        handler: mw.toString(),
      });
    });
  }

  // From events.onSubmit
  if (formDef.events?.onSubmit) {
    middleware.push({
      id: "onSubmit",
      type: "builtin",
      handler: formDef.events.onSubmit.toString(),
    });
  }

  return {
    pipeline: { middleware },
    events: normalizeEvents(formDef.events),
  };
}

/**
 * Normalize events
 */
function normalizeEvents<T>(events?: FormDefinition["events"]): IRFormEvents<T> {
  return {
    onInit: events?.onInit,
    onChange: events?.onChange,
    onSelectChange: events?.onSelectChange,
    beforeSubmit: events?.beforeSubmit,
    onSubmit: events?.onSubmit,
    afterSubmit: events?.afterSubmit,
    onError: events?.onError,
  };
}

/**
 * Normalize injections
 */
function normalizeInjections(injections?: FormDefinition["injections"]): CanonicalFormIR["injections"] {
  return {
    validations: injections?.validations || {},
    ui: injections?.ui || {},
    conditions: injections?.conditions || {},
    layout: injections?.layout || {},
    behavior: injections?.behavior || {},
    theme: injections?.theme || {},
    print: injections?.print || {},
  };
}

/**
 * Generate source hash for versioning
 */
function generateSourceHash(formDef: FormDefinition): string {
  const str = JSON.stringify({
    id: formDef.id,
    sections: formDef.sections?.map(s => ({ id: s.id, fields: s.fields?.map(f => f.id) })),
    fields: formDef.fields?.map(f => f.id),
    version: formDef.version,
  });
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return hash.toString(36);
}

/**
 * Compile IR back to FormDefinition for FormCore consumption
 */
export function IRToFormDefinition<T extends Record<string, any>>(
  ir: CanonicalFormIR<T>
): FormDefinition<T> {
  // Convert IR sections back to FormDefinition format
  const sections = ir.content.sections.map(sectionToFormDef);
  const fields = ir.content.fields.map(fieldToFormDef);

  return {
    id: ir.id,
    version: ir.version,
    title: ir.title,
    description: ir.description,
    submitLabel: ir.submitLabel,
    cancelLabel: ir.cancelLabel,
    sections,
    fields,
    settings: {
      density: ir.settings.density,
      width: ir.settings.width,
      layoutMode: ir.settings.layoutMode,
      stickyHeader: ir.settings.stickyHeader,
      stickyFooter: ir.settings.stickyFooter,
      maxHeight: ir.settings.maxHeight,
      hideHeader: ir.settings.hideHeader,
      hideFooter: ir.settings.hideFooter,
      showValidationOnTouch: ir.settings.showValidationOnTouch,
      validationMode: ir.settings.validationMode,
      wizard: {
        enabled: ir.settings.wizard.enabled,
        stepperType: ir.settings.wizard.stepperType,
        linear: ir.settings.wizard.linear,
        initialStepId: ir.settings.wizard.initialStepId,
      },
    },
    style: {
      primaryColor: ir.style.primaryColor,
      backgroundColor: ir.style.backgroundColor,
      borderRadius: ir.style.borderRadius,
      fontFamily: ir.style.fontFamily,
      customClasses: ir.style.customClasses,
      classNames: ir.style.classNames,
    },
    metadata: ir.metadata,
    events: {
      onInit: ir.behavior.events.onInit,
      onChange: ir.behavior.events.onChange,
      onSelectChange: ir.behavior.events.onSelectChange,
      beforeSubmit: ir.behavior.events.beforeSubmit,
      onSubmit: ir.behavior.events.onSubmit,
      afterSubmit: ir.behavior.events.afterSubmit,
      onError: ir.behavior.events.onError,
    },
    injections: {
      validations: ir.injections.validations,
      ui: ir.injections.ui,
      conditions: ir.injections.conditions,
      layout: ir.injections.layout,
      behavior: ir.injections.behavior,
      theme: ir.injections.theme,
      print: ir.injections.print,
    },
    validation: undefined,
    performance: ir.performance as any,
    security: ir.security as any,
    history: ir.history as any,
  };
}

function sectionToFormDef<T>(section: IRSection<T>): RawFormSection<T> {
  return {
    id: section.id,
    title: section.title,
    description: section.description,
    layout: {
      type: section.layout.type,
      columns: section.layout.columns,
      gap: section.layout.gap,
      rowGap: section.layout.rowGap,
      colGap: section.layout.colGap,
      direction: section.layout.direction,
      wrap: section.layout.wrap,
    },
    fields: section.fields.map(fieldToFormDef),
    subSections: section.subSections.map(sectionToFormDef),
    nextStep: section.nextStep ? (typeof section.nextStep === "string" ? section.nextStep : null) : null,
    visible: section.visible,
  };
}

function fieldToFormDef<T>(field: IRField<any, T>): RawFormField<any, any, T> {
  return {
    id: field.id,
    key: field.key,
    name: field.name,
    type: field.type as any,
    component: field.component,
    label: field.label,
    description: field.description,
    placeholder: field.placeholder,
    required: field.required,
    validation: field.validation,
    visible: field.visible,
    enabled: field.enabled,
    conditions: field.conditions,
    layout: {
      columnSpan: field.layout.columnSpan,
      rowSpan: field.layout.rowSpan,
      startNewRow: field.layout.startNewRow,
      responsive: field.layout.responsive,
    },
    properties: field.properties,
    componentProps: field.properties,
    meta: field.meta,
    fields: field.fields.map(fieldToFormDef),
    repeaterConfig: field.repeaterConfig ? {
      rowStateStrategy: field.repeaterConfig.rowStateStrategy,
      rowIdentityField: field.repeaterConfig.rowIdentityField,
      rowPathFormat: field.repeaterConfig.rowPathFormat,
    } : undefined,
    computed: field.computed ? {
      expression: field.computed.expression,
      dependsOn: field.computed.dependsOn,
    } : undefined,
    headless: field.headless,
    ephemeral: field.ephemeral,
    syncMode: field.syncMode,
    visibilityBehavior: field.visibilityBehavior,
    options: field.options.map(o => ({ label: o.label, value: o.value, disabled: o.disabled, icon: o.icon, description: o.description, meta: o.meta })),
    customData: (field as any).customData,
    initialValue: (field as any).initialValue,
    remoteOptions: field.remoteOptions ? {
      url: field.remoteOptions.url,
      method: field.remoteOptions.method,
      params: field.remoteOptions.params,
      headers: field.remoteOptions.headers,
      watch: field.remoteOptions.watch,
      debounceMs: field.remoteOptions.debounceMs,
      mapping: field.remoteOptions.mapping,
    } : undefined,
  };
}