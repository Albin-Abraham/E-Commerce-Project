# Zenith Form Types & Contracts Reference

**Path:** `frontend/src/shared/ui/form/types/`

This file documents the authoring contracts, layout/shell type system, application definitions, and the re-export shim layer of the Zenith Form Architecture. `contract.ts` and `layout.ts` are original modules; the remaining shims alias `@form-core/domain/*`. Signatures are copied verbatim from the source files.

---

## 1. Form contracts

Defined in [contract.ts](../../../src/shared/ui/form/types/contract.ts). A contract is a strongly-typed authoring object that compiles (by cast) into a `FormDefinition`.

### 1.1 Shared contract primitives

#### `IconName`

```ts
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
```

Valid icon identifiers for the icon registry. The trailing `(string & {})` keeps literal autocomplete while accepting any string.

#### `BaseSlotProps`

```ts
export interface BaseSlotProps {
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
```

Universal dynamic slot properties available across all UI primitives.

#### `FieldOption`

```ts
export interface FieldOption<TValue = string> {
  value: TValue;
  label: string | TranslatedText;
  icon?: IconName;
  description?: string | TranslatedText;
  disabled?: boolean;
  meta?: Record<string, any>;
}
```

Option item for select, multiselect, radio, and autocomplete fields.

### 1.2 Primitive field contracts

Each contract discriminates on `type` plus `component`; `properties` always extends `BaseSlotProps`.

#### `TextFieldContract`

```ts
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
```

#### `SelectFieldContract`

```ts
export interface SelectFieldContract<TOption extends string = string> {
  type: "string";
  component: "select" | "autocomplete";
  defaultValue?: TOption;
  options: ReadonlyArray<FieldOption<TOption>>;
  properties?: BaseSlotProps & {
    placeholder?: string | TranslatedText;
    isClearable?: boolean;
  };
}
```

#### `MultiSelectFieldContract`

```ts
export interface MultiSelectFieldContract<TOption extends string = string> {
  type: "array";
  component: "multiselect";
  defaultValue?: ReadonlyArray<TOption>;
  options: ReadonlyArray<FieldOption<TOption>>;
  properties?: BaseSlotProps & {
    placeholder?: string | TranslatedText;
    maxSelected?: number;
    isClearable?: boolean;
  };
}
```

#### `RadioFieldContract`

```ts
export interface RadioFieldContract<TOption extends string = string> {
  type: "string";
  component: "radio";
  defaultValue?: TOption;
  options: ReadonlyArray<FieldOption<TOption>>;
  properties?: BaseSlotProps & {
    direction?: "row" | "column";
  };
}
```

#### `NumberFieldContract`

```ts
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
  };
}
```

#### `BooleanFieldContract`

```ts
export interface BooleanFieldContract {
  type: "boolean";
  component?: "checkbox" | "switch";
  defaultValue?: boolean;
  properties?: BaseSlotProps & {
    description?: string | TranslatedText;
  };
}
```

#### `DateFieldContract`

```ts
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
```

#### `FileFieldContract`

```ts
export interface FileFieldContract {
  type: "array" | "string" | "object";
  component: "file" | "image";
  defaultValue?: any;
  properties?: BaseSlotProps & {
    accept?: string;
    maxSize?: number;
    multiple?: boolean;
  };
}
```

### 1.3 Static and structural contracts

#### `StaticFieldContract`

```ts
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
```

Non-input display and action fields. `defaultValue` is `never` — these fields contribute no form data (reflected by `InferFormValues` omitting their names).

#### `StructureFieldContract`

```ts
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
```

Container fields that nest child contracts.

#### `CustomFieldContract`

```ts
export interface CustomFieldContract {
  type: string;
  component?: string;
  defaultValue?: any;
  options?: ReadonlyArray<FieldOption<any>>;
  fields?: ReadonlyArray<TypedFieldContract<any>>;
  properties?: BaseSlotProps & Record<string, any>;
  [key: string]: any;
}
```

Escape hatch for any field type not covered by the closed contract set: `type` is an open string and extra keys are allowed, so it must be the last alternative considered when narrowing.

### 1.4 Payload, field, section, and form contracts

#### `FieldDefinitionPayload`

```ts
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
```

Closed union of every field payload; a `TypedFieldContract` is this union intersected with common field metadata.

#### `TypedFieldContract`

```ts
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
```

The single field authoring shape: identity + governance metadata intersected with a payload union. `name` is the literal type key used by `InferFormValues`.

#### `FormSectionContract`

```ts
export interface FormSectionContract<TField extends TypedFieldContract<any> = TypedFieldContract<any>> {
  id: string;
  title?: string | TranslatedText;
  description?: string | TranslatedText;
  layout?: SectionLayoutConfig;
  fields: ReadonlyArray<TField>;
  subSections?: ReadonlyArray<FormSectionContract<TField>>;
  nextStep?: string | ((values: Record<string, any>) => string | null);
}
```

Section contract. `nextStep` is flow sugar for stepper forms: it overrides the default linear ordering (next section in the array) with a step id or a resolver over current values, wired into `form.flow.getNextStep`.

#### `FormDefinitionContract`

```ts
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
```

Top-level form contract. `settings`, `layout`, and `style` delegate to the `FormDefinition` shape so contracts and compiled definitions share layout/styling vocabulary.

#### `FormLayerModel`

```ts
export interface FormLayerModel<T extends Record<string, any> = Record<string, any>> {
  content: FormDefinition<T>;
  behavior?: BehaviorDefinition<T>;
  surface?: SurfaceDefinition;
  presentation?: PresentationDefinition;
}
```

Runtime layer boundary for MDAP hooks/components: `content` is the compiled definition the engine consumes; `behavior`, `surface`, and `presentation` are the effective slices projected from the authoring source.

### 1.5 Builders and inference

#### `defineFormContract`

```ts
export function defineFormContract<
  const TFields extends TypedFieldContract<any>,
  const TForm extends FormDefinitionContract<TFields>
>(contract: TForm): TForm
```

Identity builder that forces literal inference of names, types, and options through `const` type parameters. Use it so field names stay literal types for `InferFormValues`.

#### `compileContractToFormDefinition`

```ts
export function compileContractToFormDefinition<
  const TForm extends FormDefinitionContract<any>
>(contract: TForm): FormDefinition<InferFormValues<TForm>>
```

Casts a typed contract into an executable `FormDefinition` whose value type is the inferred data model. Ready for `<Form definition={...} />`.

#### `InferFormValues`

```ts
export type InferFormValues<T> = {
  [K in ExtractAllFields<T> as K extends { type: StaticFieldTypeKey } ? never : K["name"]]: ExtractFieldType<K>;
};
```

Derives the form data model from a contract: maps every field name to its value type (`number` for numeric, `boolean` for booleans, `O[]` for multiselect, `O` for select/radio, `any[]` for arrays, `Record<string, any>` for objects, `never` excluded for static field types, `string` otherwise). It relies on internal helpers `ExtractAllFields`, `ExtractFieldsFromSections`, `ExtractFieldType`, and `StaticFieldTypeKey`, which are not exported.

```ts
import { defineFormContract, compileContractToFormDefinition } from "@ui/form";
import type { InferFormValues } from "@ui/form";

const contract = defineFormContract({
  id: "employee-form",
  title: "Employee",
  fields: [{ id: "name", name: "name", type: "string" }],
});

export type EmployeeFormValues = InferFormValues<typeof contract>;
const definition = compileContractToFormDefinition(contract);
```

---

## 2. Wizard contracts

Also from [contract.ts](../../../src/shared/ui/form/types/contract.ts).

#### `WizardContractConfig`

```ts
export interface WizardContractConfig {
  enabled?: boolean;
  stepperType?: "sidebar" | "top";
  linear?: boolean;
  initialStepId?: string;
}
```

Wizard/stepper configuration mirroring `FormDefinition["settings"]["wizard"]`, declared so contracts can opt into flow mode without a raw cast. `initialStepId` overrides the default initial step (first section).

#### `withWizard`

```ts
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
```

Curried flow-authoring helper: returns a function that stamps `settings.wizard` onto a contract. Merge order is `enabled: true`, then any existing `settings.wizard`, then `config` — so an explicit `config.enabled === false` or a pre-existing wizard block wins over the defaults, and the contract itself is otherwise unchanged.

```ts
import { defineFormContract, withWizard } from "@ui/form";

const contract = withWizard({ stepperType: "top", linear: false })(
  defineFormContract({ id: "onboarding", title: "Onboarding" })
);
```

---

## 3. Layout & shell types

Defined in [layout.ts](../../../src/shared/ui/form/types/layout.ts).

### 3.1 Layout type union and base config

#### `LayoutType`

```ts
export type LayoutType =
  | "grid"
  | "flex"
  | "block"
  | "card"
  | "tabs"
  | "accordion"
  | "fieldset"
  | "group"
  | "container"
  | "section"
  | "steps";
```

Closed set of every layout kind. Adding a value requires a matching config interface, a registry renderer, and an update to the exhaustive check.

#### `BaseLayoutConfig`

```ts
export interface BaseLayoutConfig {
  type: LayoutType;
  className?: string;
  padding?: string | number;
  margin?: string | number;
  wrapOuter?: boolean;
  reviewOnly?: boolean;
}
```

Shared layout fields. `reviewOnly` marks a section as the wizard's submit landing — a review step that is never navigated to and whose fields are excluded from submit validation.

### 3.2 Concrete layout configs

#### `GridLayoutConfig`

```ts
export interface GridLayoutConfig extends BaseLayoutConfig {
  type: "grid";
  columns: number;
  gap?: number | string;
  rowGap?: number | string;
  colGap?: number | string;
  breakpoints?: {
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
}
```

#### `FlexLayoutConfig`

```ts
export interface FlexLayoutConfig extends BaseLayoutConfig {
  type: "flex";
  direction: "row" | "column" | "row-reverse" | "column-reverse";
  wrap?: "nowrap" | "wrap" | "wrap-reverse";
  justify?: "start" | "end" | "center" | "between" | "around" | "evenly";
  align?: "start" | "end" | "center" | "baseline" | "stretch";
  gap?: number | string;
}
```

#### `BlockLayoutConfig`

```ts
export interface BlockLayoutConfig extends BaseLayoutConfig {
  type: "block";
}
```

#### `TabsLayoutConfig`

```ts
export interface TabsLayoutConfig extends BaseLayoutConfig {
  type: "tabs";
  variant?: "default" | "underlined" | "pills";
  orientation?: "horizontal" | "vertical";
  defaultTab?: string | number;
}
```

#### `CardLayoutConfig`

```ts
export interface CardLayoutConfig extends BaseLayoutConfig {
  type: "card";
  variant?: "default" | "outlined" | "flat" | "glass";
  header?: boolean;
  footer?: boolean;
  elevation?: "none" | "sm" | "md" | "lg" | "xl";
  gap?: number | string;
}
```

#### `AccordionLayoutConfig`

```ts
export interface AccordionLayoutConfig extends BaseLayoutConfig {
  type: "accordion";
  defaultOpen?: boolean;
  columns?: number;
  gap?: number | string;
}
```

#### `ContainerLayoutConfig`

```ts
export interface ContainerLayoutConfig extends BaseLayoutConfig {
  type: "container";
  columns?: number;
  gap?: number | string;
}
```

#### `StepsLayoutConfig`

```ts
export interface StepsLayoutConfig extends BaseLayoutConfig {
  type: "steps";
}
```

#### `SectionLayout`

```ts
export interface SectionLayout extends BaseLayoutConfig {
  type: "section";
  columns?: number;
  gap?: number | string;
}
```

#### `GroupLayoutConfig`

```ts
export interface GroupLayoutConfig extends BaseLayoutConfig {
  type: "group";
  direction?: "row" | "col";
  gap?: number | string;
}
```

#### `FieldsetLayoutConfig`

```ts
export interface FieldsetLayoutConfig extends BaseLayoutConfig {
  type: "fieldset";
  columns?: number;
  gap?: number | string;
}
```

### 3.3 Layout config unions

#### `SectionLayoutConfig`

```ts
export type SectionLayoutConfig =
  | GridLayoutConfig
  | FlexLayoutConfig
  | BlockLayoutConfig
  | TabsLayoutConfig
  | CardLayoutConfig
  | AccordionLayoutConfig
  | ContainerLayoutConfig
  | StepsLayoutConfig
  | SectionLayout;
```

Convenience union used by entry-level form definitions and `FormSectionContract["layout"]`. It omits `group` and `fieldset`.

#### `RuntimeLayoutConfig`

```ts
export type RuntimeLayoutConfig =
  | GridLayoutConfig
  | FlexLayoutConfig
  | BlockLayoutConfig
  | CardLayoutConfig
  | TabsLayoutConfig
  | AccordionLayoutConfig
  | ContainerLayoutConfig
  | StepsLayoutConfig
  | SectionLayout
  | GroupLayoutConfig
  | FieldsetLayoutConfig;
```

Closed discriminated union over all known layout types — the type consumed at runtime. Every member must have a handler in the layout registry.

#### `assertExhaustiveLayout`

```ts
export function assertExhaustiveLayout(_: never): never {
  throw new Error(`Unhandled layout type`);
}
```

Exhaustive-check helper: place it in a `default` branch of a `switch` on `RuntimeLayoutConfig["type"]` so a newly added layout type fails compilation until handled.

```ts
import type { RuntimeLayoutConfig } from "@ui/form";
import { assertExhaustiveLayout } from "@ui/form";

function render(layout: RuntimeLayoutConfig) {
  switch (layout.type) {
    case "grid": return null;
    case "flex": return null;
    default: return assertExhaustiveLayout(layout);
  }
}
```

### 3.4 Container content types

#### `SegmentedContent`

```ts
export interface SegmentedContent {
  type: "segmented";
  options: { label: string; value: string }[];
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
}
```

Radio-semantics single-select content: one active option from a closed set, driving view state via `onChange` without polluting the form data payload.

#### `ContainerContentType`

```ts
export type ContainerContentType =
  | "image"
  | "section-ref"
  | "component"
  | "html"
  | "container"
  | "segmented";
```

Closed set of pane content kinds.

#### `ContainerContent`

```ts
export interface ContainerContent {
  type: ContainerContentType;
  fields?: FormField[];
  id?: string;
  src?: string;
  alt?: string;
  overlay?: boolean;
  sectionId?: string;
  content?: string;
  className?: string;
  component?: ComponentType<any>;
  componentProps?: Record<string, unknown>;
  options?: SegmentedContent["options"];
  value?: string;
  onChange?: (value: string) => void;
}
```

Pane payload: inline `fields` for split/hero panes, `sectionId` for `section-ref`, `component`/`componentProps` for custom React panels, and option fields for `segmented`.

#### `ContainerDefinition`

```ts
export interface ContainerDefinition {
  id: string;
  type: "split" | "card" | "hero" | "sidebar";
  config?: {
    splitRatio?: "50/50" | "40/60" | "30/70";
    orientation?: "horizontal" | "vertical";
    topContent?: ContainerContent;
    leftContent?: ContainerContent;
    rightContent?: ContainerContent;
  };
  children?: string[];
}
```

Named container instance referencing sections by id, with optional split ratio, orientation, and up to three pane contents.

#### `LayoutComponentProps`

```ts
export interface LayoutComponentProps {
  section: any;
  childrenNodes: any[];
  data?: any;
  errors?: Record<string, string>;
  setValue?: (name: string, value: any) => void;
  getComponentProps?: (fieldId: string) => any;
  renderChildren: () => React.ReactNode;
  renderNode: (node: any) => React.ReactNode;
  className?: string;
}
```

Props contract for every layout registry component: the section, its prepared child nodes, optional runtime plumbing, and the render callbacks for children.

### 3.5 Shell nodes (grid-surface-content model)

#### `ShellNode`

```ts
export type ShellNode = LayoutNode | SurfaceNode | FlowNode | ContentNode;
```

Root union driving the shell factories: a shell tree is recursively composed of these four node kinds.

#### `LayoutNode`

```ts
export interface LayoutNode {
  node: "layout";
  type: "grid" | "flex" | "stack" | "box";
  config?: {
    columns?: number;
    gap?: number | string;
    direction?: "row" | "col";
  };
  children: ShellNode[];
  className?: string;
  colSpan?: number | Record<string, number>;
}
```

Pure arrangement node — places its children on a grid, flex row, stack, or box.

#### `SurfaceNode`

```ts
export interface SurfaceNode {
  node: "surface";
  type: "card" | "dialog" | "drawer" | "overlay" | "hero";
  config?: {
    gridSpan?: number | { sm?: number; lg?: number; base: number };
    elevation?: "none" | "sm" | "md" | "lg" | "premium";
    glass?: boolean;
    position?: "right" | "left" | "bottom" | "top";
    size?: "sm" | "md" | "lg" | "full";
  };
  children: ShellNode[];
  className?: string;
  colSpan?: number | Record<string, number>;
}
```

Chrome node — wraps children in card/dialog/drawer/overlay/hero presentation with elevation, glass, position, and size options.

#### `FlowNode`

```ts
export interface FlowNode {
  node: "flow";
  type: "wizard" | "stepper" | "tabs";
  config?: {
    linear?: boolean;
    stepperPosition?: "top" | "sidebar";
    defaultTab?: string;
  };
  children: ShellNode[];
  className?: string;
  colSpan?: number | Record<string, number>;
}
```

Sequential navigation node — children become wizard/stepper steps or tabs.

#### `ContentNode`

```ts
export interface ContentNode {
  node: "content";
  type:
    | "section-ref"
    | "component"
    | "segmented"
    | "html"
    | "image"
    | "form-standard"
    | "form-steps";
  sectionId?: string;
  component?: React.ComponentType<any>;
  componentProps?: Record<string, unknown>;
  src?: string;
  alt?: string;
  overlay?: boolean;
  content?: string;
  options?: { label: string; value: string }[];
  value?: string;
  onChange?: (val: string) => void;
  className?: string;
  colSpan?: number | Record<string, number>;
}
```

Leaf node — references a section, mounts a component with props, embeds HTML/media, hosts segmented options, or places a standard/steps form region.

```ts
import type { ShellNode } from "@ui/form";

const shell: ShellNode = {
  node: "layout",
  type: "grid",
  children: [{ node: "surface", type: "card", children: [] }],
};
```

---

## 4. Application/domain definitions

Defined in [application.ts](../../../src/shared/ui/form/types/application.ts).

#### `EntityDefinition`

```ts
export interface EntityDefinition<
  TData extends Record<string, any> = Record<string, any>,
> {
  id: string;
  name: string;
  version?: string;
  content: ContentDefinition<TData>;
  behavior?: BehaviorDefinition<TData>;
  surface?: SurfaceDefinition;
  presentation?: PresentationDefinition;
  forms?: Record<string, FormDefinition<TData>>;
}
```

One entity in the authored 6-layer model: `content` is required; behavior, surface, and presentation are optional layers; `forms` holds entity-specific compiled definitions. This is the input to `compileEntityToFormDef`.

#### `ModuleDefinition`

```ts
export interface ModuleDefinition {
  id: string;
  name: string;
  description?: string;
  entities: Record<string, EntityDefinition<any>>;
  sharedValidationProfiles?: Record<string, ValidationSettings>;
  sharedPresentation?: PresentationDefinition;
}
```

Groups entities into a functional module with optional shared validation profiles and shared presentation.

#### `ApplicationDefinition`

```ts
export interface ApplicationDefinition {
  id: string;
  name: string;
  version?: string;
  organization?: string;
  modules: Record<string, ModuleDefinition>;
  globalTheme?: PresentationDefinition;
  globalDatasources?: Record<
    string,
    { url: string; method?: string; headers?: Record<string, string> }
  >;
  globalSecurity?: {
    roles?: string[];
    permissions?: Record<string, string[]>;
  };
}
```

Top-level container for multi-module applications: modules plus global theme, datasource, and security configuration.

#### `ContentDefinition`

```ts
export type { ContentDefinition } from "./content";
```

Re-exported from `application.ts` so content-layer consumers can import it alongside the application definitions without a second import.

---

## 5. Re-export shims

Most files in `types/` are thin shims aliasing `@form-core/domain/*`. They exist so `@ui/form` consumers have one import root.

| File | Re-exports | Key types |
|---|---|---|
| `types/condition.ts` | `export * from "@form-core/domain/condition"` | `ConditionExpression`, `FieldConditionExpression` |
| `types/i18n-accessibility.ts` | `export type { TranslatedText, Internationalization, Accessibility } from "@form-core/domain/i18n"` | i18n and accessibility value types |
| `types/reactive.ts` | `export * from "@form-core/domain/reactive"` | Reactive/observability domain types |
| `types/section.ts` | `export * from "@form-core/domain/section"` | Section domain types |
| `types/surface.ts` | `export * from "@form-core/domain/surface"` | `SurfaceDefinition`, `UIScreenSurface` |
| `types/behavior.ts` | `export * from "@form-core/domain/behavior"` | `BehaviorDefinition` (events, pipeline) |
| `types/presentation.ts` | `export * from "@form-core/domain/presentation"` | `PresentationDefinition` |
| `types/manifest.ts` | `export * from "@form-core/domain/manifest"` | `InstanceDefinition` and manifest types |
| `types/validation.ts` | `export * from "@form-core/domain/validation"` | `ValidationSettings`, `ValidationRule`, `AsyncValidation`, `CrossFieldValidation`, `CustomValidationTypes` |
| `types/security-performance-history.ts` | `export type { SecuritySettings, PerformanceSettings, HistorySettings } from "@form-core/domain/security-performance"` | Security/performance/history settings |
| `types/content.ts` | `export * from "@form-core/domain/content"` | `ContentDefinition` |

Note: `types/manifest.ts` is not re-exported by `types/index.ts`; import it directly when manifest types are needed.

### 5.1 What `types/index.ts` re-exports

[types/index.ts](../../../src/shared/ui/form/types/index.ts) barrel-exports `condition`, `i18n-accessibility`, `layout`, `reactive`, `section`, `security-performance-history`, `validation`, `contract`, `content`, `surface`, `behavior`, `presentation`, and `application`, plus:

```ts
export type { FormField } from "../fields";
export type {
  FormDefinition,
  FormMetadataEvents,
  NavigationGuardConfig,
  FormUIFieldConfig,
  FormUISectionConfig,
  FormUIConfig,
  RenderDefinition,
  DetailDefinition,
} from "@form-core/domain/definition";
```

`FormDefinition`, `NavigationGuardConfig`, `RenderDefinition`, `DetailDefinition`, the `FormUI*` config types, and `FormMetadataEvents` all originate from `@form-core/domain/definition` — see [04-DOMAIN_TYPES.md](04-DOMAIN_TYPES.md) for their full shapes.

### 5.2 Validation-related shared types

| Type | Source | Shape / values |
|---|---|---|
| `ValidationMode` | `@form-core/engine` (re-exported by `engine.ts`) | `"onChange" \| "onBlur" \| "onSubmit" \| "manual" \| "lazy"` — engine option controlling when validation fires (`useForm({ validationMode })`) |
| `ValidationSettings` | shim `types/validation.ts` | `{ rules?, async?, crossField?, groups?, validateOn?, debounceMs?, disableDeferredValidation?, dependsOn? }` |
| `ValidationRule` | shim `types/validation.ts` | Rule union (`required`, `min`, `pattern`, `email`, `custom`, ...) with `value?`, `fn?`, `message?`, `severity?`, `when?` |
| `AsyncValidation` | shim `types/validation.ts` | URL-backed async rule (`url`, `method`, `payloadFields`, `retryCount`, ...) |
| `CrossFieldValidation` | shim `types/validation.ts` | `{ fields, validator, message, severity? }` |
| `DetailedError` | `@form-core/domain/state` (via `@form-core/int-types`) | `{ code, message, fieldId, details? }` — pointer to [04-DOMAIN_TYPES.md](04-DOMAIN_TYPES.md) |

```ts
import type { ValidationSettings } from "@ui/form";
import type { InferFormValues } from "@ui/form";

const validation: ValidationSettings = { validateOn: ["blur", "submit"] };
```

---

**See also:**

- [01-ENGINE.md](01-ENGINE.md)
- [04-DOMAIN_TYPES.md](04-DOMAIN_TYPES.md)
- [05-ADAPTERS_UTILS.md](05-ADAPTERS_UTILS.md)
- [08-FIELD_CATALOG.md](08-FIELD_CATALOG.md)
- [09-PROVIDERS.md](09-PROVIDERS.md)
- [10-SHARED_UTILS.md](10-SHARED_UTILS.md)
