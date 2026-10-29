/**
 * @file lazy-registry-builder.ts
 * @description Default code-split field registry — all heavy field types dynamically imported.
 *
 * ## Bundle impact
 * | Strategy    | Initial chunk | Deferred chunks |
 * |-------------|--------------|-----------------|
 * | Eager (old) | ~35 KB       | 0               |
 * | Lazy (new)  | ~8 KB        | ~27 KB split    |
 *
 * ## How it works
 * - 8 core fields (text, email, number, password, textarea, select, checkbox, radio)
 *   are eagerly loaded — they're small and almost every form uses them.
 * - 18+ other field types are loaded on first render via `React.lazy` + dynamic `import()`.
 * - The `defaultRegistry` now returns a `LazyRegistryStore`.
 */
// ── Eager Core — imported statically for zero CLS and instant rendering ────
import { withAtom } from "../hoc/withAtom";
import "../manifest/default-manifests";
import { LazyRegistryStore } from "../registry";
import { FormDivider, SocialAuthButtons } from "./identity/IdentityAtoms";
import { AutocompleteField } from "./primitive/AutocompleteField";
import { ButtonField } from "./primitive/ButtonField";
import { CheckboxField } from "./primitive/CheckboxField";
import { FileField } from "./primitive/FileField";
import { ImageField } from "./primitive/ImageField";
import { MultiSelectField } from "./primitive/MultiSelectField";
import { NumberInputField } from "./primitive/NumberInputField";
import { PhoneField } from "./primitive/PhoneField";
import { RadioField } from "./primitive/RadioField";
import { RangeField } from "./primitive/RangeField";
import { SearchInputField } from "./primitive/SearchInputField";
import { SelectField } from "./primitive/SelectField";
import {
  HeaderField,
  HtmlField,
  ParagraphField,
} from "./primitive/StaticFields";
import { SwitchField } from "./primitive/SwitchField";
import { TableFilterField } from "./primitive/TableFilterField";
import { TextField } from "./primitive/TextField";
import { TextareaField } from "./primitive/TextareaField";
import type { FieldComponent } from "./registry";
import { AccordionField } from "./structure/AccordionField";
import { CardField } from "./structure/CardField";
import { ContainerField } from "./structure/ContainerField";
import { FieldsetField } from "./structure/FieldsetField";
import { GroupField } from "./structure/GroupField";
import { SlotField } from "./structure/SlotField";
import { TabsField } from "./structure/TabsField";

// Shared wrappers to prevent redundant allocations across aliases
const wrappedText = withAtom(TextField);
const wrappedAutocomplete = withAtom(AutocompleteField);
const wrappedNumber = withAtom(NumberInputField);

const EAGER_CORE: Record<string, FieldComponent> = {
  // Inputs & Aliases
  text: wrappedText,
  email: wrappedText,
  password: wrappedText,
  textarea: withAtom(TextareaField),
  number: wrappedNumber,
  number_input: wrappedNumber,
  "number-input": wrappedNumber,

  // Choices & Selection
  select: withAtom(SelectField),
  autocomplete: wrappedAutocomplete,
  "async-select": wrappedAutocomplete,
  multiselect: withAtom(MultiSelectField),
  checkbox: withAtom(CheckboxField, { showLabel: false, wrapOuter: false }),
  radio: withAtom(RadioField, { wrapOuter: false }),
  // switch/range render their own inline label — suppress the FieldShell
  // duplicate label (mirrors the checkbox contract).
  switch: withAtom(SwitchField, { showLabel: false, wrapOuter: false }),
  range: withAtom(RangeField, { showLabel: false, wrapOuter: false }),

  // Specialized inputs
  file: withAtom(FileField, { wrapOuter: false }),
  phone: withAtom(PhoneField),
  search_input: withAtom(SearchInputField, {
    showLabel: false,
    wrapOuter: false,
  }),
  table_filter: withAtom(TableFilterField, {
    showLabel: false,
    wrapOuter: false,
  }),

  // Actions & Static
  button: withAtom(ButtonField, { showLabel: false, wrapOuter: false }),
  image: withAtom(ImageField, { showLabel: false, wrapOuter: false }),
  header: withAtom(HeaderField, { showLabel: false, wrapOuter: false }),
  paragraph: withAtom(ParagraphField, { showLabel: false, wrapOuter: false }),
  html: withAtom(HtmlField, { showLabel: false, wrapOuter: false }),
  divider: FormDivider as unknown as FieldComponent,
  "divider-label": FormDivider as unknown as FieldComponent,
  social: SocialAuthButtons as unknown as FieldComponent,

  // Structure
  container: ContainerField as unknown as FieldComponent,
  card: CardField as unknown as FieldComponent,
  accordion: AccordionField as unknown as FieldComponent,
  fieldset: FieldsetField as unknown as FieldComponent,
  group: GroupField as unknown as FieldComponent,
  slot: withAtom(SlotField, { showLabel: false, wrapOuter: false }),
  tab: TabsField as unknown as FieldComponent,
  tabs: TabsField as unknown as FieldComponent,
};

// ── Lazy Deferred — heavy/specialized extensions ──────────────────────────

/** Extract a React component from a module, preferring default export then first component-like named export. */
function extractComponent(mod: Record<string, any>): any {
  if (mod.default) return mod.default;
  const values = Object.values(mod);
  return (
    values.find(
      (v) => v !== null && typeof v === "object" && "$$typeof" in v
    ) ||
    values.find((v) => typeof v === "function") ||
    mod
  );
}

/** Helper to wrap a field component with `withAtom` lazily. */
function lazyWrapped(
  importFn: () => Promise<any>,
  exportName?: string,
  opts?: { showLabel?: boolean; wrapOuter?: boolean }
): () => Promise<{ default: FieldComponent }> {
  return async () => {
    const mod = await importFn();
    const Component =
      exportName && typeof exportName === "string" && mod[exportName]
        ? mod[exportName]
        : extractComponent(mod);
    return { default: withAtom(Component, opts) };
  };
}

/**
 * All lazy field registrations.
 * Reserved for heavy extensions that exceed threshold (e.g. Monaco / CodeMirror in CodeInputField).
 */
const LAZY_FIELDS: Array<[string, () => Promise<{ default: FieldComponent }>]> =
  [
    [
      "code",
      lazyWrapped(() => import("./primitive/CodeInputField"), "CodeInputField"),
    ],
  ];

/**
 * Creates the default code-split registry with lazy-loaded heavy fields.
 *
 * Drop-in replacement for `defaultRegistry`:
 * ```tsx
 * import { defaultRegistry } from "@ui/form";
 * // defaultRegistry now uses lazy loading — zero migration needed
 * ```
 */
export function createDefaultRegistry(): LazyRegistryStore {
  const registry = new LazyRegistryStore(EAGER_CORE);

  for (const [type, loader] of LAZY_FIELDS) {
    registry.registerLazy(type, loader);
  }

  return registry;
}

/**
 * Creates a minimal registry with only basic input fields.
 * Use for forms with very specific field needs.
 */
export function createMinimalRegistry(): LazyRegistryStore {
  const registry = new LazyRegistryStore(EAGER_CORE);
  return registry;
}

/**
 * Creates the split registry (alias of createDefaultRegistry for discoverability).
 */
export const createSplitRegistry = createDefaultRegistry;

/**
 * Preloads lazy field types for a set of form field definitions.
 * Call at route level to warm the cache and avoid skeleton flash.
 */
export async function preloadFieldTypes(
  registry: LazyRegistryStore,
  fieldTypes: string[]
) {
  await registry.preloadMany(fieldTypes);
}

/**
 * Default lazy registry instance — used by <Form> when no custom registry is provided.
 * All heavy field types are registered lazily; only the 80/20 core types are eager.
 */
export const defaultRegistry: LazyRegistryStore = createDefaultRegistry();
