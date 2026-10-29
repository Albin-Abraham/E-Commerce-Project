/**
 * @file default-manifests.ts
 * @description Default field and layout manifest registrations.
 *
 * This module has a side-effect: calling `registerDefaultManifests()` registers
 * all built-in field types (input, static, container, composite) and layout
 * renderers into the singleton `manifestRegistry`. It is auto-imported by
 * `fields.ts` to ensure the registry is populated at module load time.
 *
 * Also registers per-type InstanceDefinition defaults for select-like fields
 * (select, multiselect, radio, autocomplete) that configure value mapping,
 * selection behavior, and search configuration.
 *
 * @module DefaultManifests
 */
import { manifestRegistry } from "@form-core/ManifestRegistry";
import type { FieldManifest, LayoutRendererManifest } from "../types/manifest";

/** @internal Convenience capability presets — matches field.ts CAPS. */
const CAPS = {
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
  CONTAINER: {
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

// ── PRIMITIVE DOMAIN TYPES (Decoupled Architecture) ────────────────────────
// These types carry no UI semantics. The actual component is resolved via
// meta.ui.component in the surface schema. They must still be registered so
// the manifest registry assigns correct wrapper/atom shell treatment.

const primitiveFields: FieldManifest[] = [
  {
    type: "string",
    category: "input",
    routing: "leaf",
    capabilities: CAPS.INPUT,
    label: "String",
    wrapper: { enabled: true },
  },
  {
    type: "number",
    category: "input",
    routing: "leaf",
    capabilities: CAPS.INPUT,
    label: "Number",
    wrapper: { enabled: true },
  },
  {
    type: "boolean",
    category: "input",
    routing: "leaf",
    capabilities: CAPS.INPUT,
    label: "Boolean",
    wrapper: { enabled: true },
  },
  {
    type: "array",
    category: "input",
    routing: "leaf",
    capabilities: CAPS.INPUT,
    label: "Array",
    wrapper: { enabled: true },
  },
  {
    type: "object",
    category: "input",
    routing: "leaf",
    capabilities: CAPS.INPUT,
    label: "Object",
    wrapper: { enabled: true },
  },
];

// ── INPUT FIELDS ───────────────────────────────────────────────────────────

const inputFields: FieldManifest[] = [
  {
    type: "text",
    aliases: ["email", "password", "phone", "url", "date", "datetime", "time"],
    category: "input",
    routing: "leaf",
    capabilities: CAPS.INPUT,
    label: "Text Field",
    wrapper: { enabled: true },
  },
  {
    type: "textarea",
    category: "input",
    routing: "leaf",
    capabilities: CAPS.INPUT,
    label: "Text Area",
    wrapper: { enabled: true },
  },
  {
    type: "select",
    category: "input",
    routing: "leaf",
    capabilities: CAPS.INPUT,
    label: "Select Dropdown",
    wrapper: { enabled: true },
  },
  {
    type: "checkbox",
    category: "input",
    routing: "leaf",
    capabilities: CAPS.INPUT,
    label: "Checkbox",
    wrapper: { enabled: true },
  },
  {
    type: "radio",
    category: "input",
    routing: "leaf",
    capabilities: CAPS.INPUT,
    label: "Radio Group",
    wrapper: { enabled: true },
  },
  {
    type: "switch",
    category: "input",
    routing: "leaf",
    capabilities: CAPS.INPUT,
    label: "Switch Toggle",
    wrapper: { enabled: true },
  },
  {
    type: "multiselect",
    category: "input",
    routing: "leaf",
    capabilities: CAPS.INPUT,
    label: "Multi Select",
    wrapper: { enabled: true },
  },
  {
    type: "autocomplete",
    category: "input",
    routing: "leaf",
    capabilities: CAPS.INPUT,
    label: "Autocomplete",
    wrapper: { enabled: true },
  },
  {
    type: "file",
    category: "input",
    routing: "leaf",
    capabilities: CAPS.INPUT,
    label: "File Upload",
    wrapper: { enabled: true },
  },
  {
    type: "signature",
    category: "input",
    routing: "leaf",
    capabilities: CAPS.INPUT,
    label: "Signature",
    wrapper: { enabled: true },
  },
  {
    type: "rating",
    category: "input",
    routing: "leaf",
    capabilities: CAPS.INPUT,
    label: "Rating",
    wrapper: { enabled: true },
  },
  {
    type: "range",
    category: "input",
    routing: "leaf",
    capabilities: CAPS.INPUT,
    label: "Range Slider",
    wrapper: { enabled: true },
  },
  {
    type: "rich-text",
    category: "input",
    routing: "leaf",
    capabilities: CAPS.INPUT,
    label: "Rich Text Editor",
    wrapper: { enabled: true },
  },
  {
    type: "formatted-number",
    category: "input",
    routing: "leaf",
    capabilities: CAPS.INPUT,
    label: "Formatted Number",
    wrapper: { enabled: true },
  },
  {
    type: "search_input",
    category: "input",
    routing: "leaf",
    capabilities: CAPS.INPUT,
    label: "Search Input",
    wrapper: { enabled: true, showLabel: false },
  },
  {
    type: "table_filter",
    category: "input",
    routing: "leaf",
    capabilities: CAPS.INPUT,
    label: "Table Filter",
    wrapper: { enabled: true, showLabel: false },
  },
];

// ── STATIC FIELDS ──────────────────────────────────────────────────────────

const staticFields: FieldManifest[] = [
  {
    type: "header",
    category: "static",
    routing: "leaf",
    capabilities: CAPS.STATIC,
    label: "Header",
    wrapper: { enabled: true, showLabel: false, wrapOuter: false },
  },
  {
    type: "paragraph",
    category: "static",
    routing: "leaf",
    capabilities: CAPS.STATIC,
    label: "Paragraph",
    wrapper: { enabled: true, showLabel: false, wrapOuter: false },
  },
  {
    type: "image",
    category: "static",
    routing: "leaf",
    capabilities: CAPS.STATIC,
    label: "Image",
    wrapper: { enabled: true, showLabel: false, wrapOuter: false },
  },
  {
    type: "button",
    category: "static",
    routing: "leaf",
    capabilities: CAPS.STATIC,
    label: "Button",
    wrapper: { enabled: true, showLabel: false, wrapOuter: false },
  },
  {
    type: "divider",
    category: "static",
    routing: "leaf",
    capabilities: CAPS.STATIC,
    label: "Divider",
    wrapper: { enabled: false },
  },
  {
    type: "divider-label",
    category: "static",
    routing: "leaf",
    capabilities: CAPS.STATIC,
    label: "Labeled Divider",
    wrapper: { enabled: false },
  },
  {
    type: "message",
    category: "static",
    routing: "leaf",
    capabilities: CAPS.STATIC,
    label: "Message / Alert",
    wrapper: { enabled: false },
  },
  {
    type: "html",
    category: "static",
    routing: "leaf",
    capabilities: CAPS.STATIC,
    label: "HTML Block",
    wrapper: { enabled: false },
  },
  {
    type: "qr-code",
    category: "static",
    routing: "leaf",
    capabilities: CAPS.STATIC,
    label: "QR Code",
    wrapper: { enabled: false },
  },
  {
    type: "tooltip",
    category: "static",
    routing: "leaf",
    capabilities: CAPS.STATIC,
    label: "Tooltip",
    wrapper: { enabled: false },
  },
  {
    type: "social",
    category: "static",
    routing: "leaf",
    capabilities: CAPS.STATIC,
    label: "Social Buttons",
    wrapper: { enabled: false },
  },
  {
    type: "spacer",
    category: "static",
    routing: "leaf",
    capabilities: CAPS.STATIC,
    label: "Spacer",
    wrapper: { enabled: false },
  },
  {
    type: "progress-line",
    category: "static",
    routing: "leaf",
    capabilities: CAPS.STATIC,
    label: "Progress Bar",
    wrapper: { enabled: false },
  },
  {
    type: "progress-circle",
    category: "static",
    routing: "leaf",
    capabilities: CAPS.STATIC,
    label: "Circular Progress",
    wrapper: { enabled: false },
  },
];

// ── CONTAINER FIELDS (pure children renderers, no self-value) ──────────────

const containerFields: FieldManifest[] = [
  {
    type: "container",
    category: "container",
    routing: "container",
    capabilities: CAPS.CONTAINER,
    label: "Container",
    layout: {
      acceptsChildren: true,
      childLayoutMode: "grid",
      defaultColumns: 12,
    },
  },
  {
    type: "section",
    category: "container",
    routing: "container",
    capabilities: CAPS.CONTAINER,
    label: "Section",
    layout: {
      acceptsChildren: true,
      childLayoutMode: "grid",
      defaultColumns: 12,
    },
  },
  {
    type: "card",
    category: "container",
    routing: "container",
    capabilities: CAPS.CONTAINER,
    label: "Card",
    layout: {
      acceptsChildren: true,
      childLayoutMode: "grid",
      defaultColumns: 12,
    },
  },
  {
    type: "accordion",
    category: "container",
    routing: "container",
    capabilities: CAPS.CONTAINER,
    label: "Accordion",
    layout: {
      acceptsChildren: true,
      childLayoutMode: "block",
      defaultColumns: 12,
    },
  },
  {
    type: "tab",
    aliases: ["tabs"],
    category: "container",
    routing: "container",
    capabilities: CAPS.CONTAINER,
    label: "Tabs",
    layout: {
      acceptsChildren: true,
      childLayoutMode: "block",
      defaultColumns: 12,
    },
  },
  {
    type: "slot",
    category: "container",
    routing: "slot",
    capabilities: CAPS.CONTAINER,
    label: "Slot",
    layout: {
      acceptsChildren: true,
      childLayoutMode: "grid",
      defaultColumns: 12,
    },
  },
];

// ── COMPOSITE FIELDS (render themselves AND manage children) ───────────────

const compositeFields: FieldManifest[] = [
  {
    type: "repeater",
    category: "composite",
    routing: "repeater",
    capabilities: CAPS.COLLECTOR,
    label: "Repeater",
    layout: { acceptsChildren: true },
    wrapper: { enabled: false },
  },
  {
    type: "fieldset",
    category: "composite",
    routing: "container",
    capabilities: CAPS.COLLECTOR,
    label: "Fieldset",
    layout: {
      acceptsChildren: true,
      childLayoutMode: "grid",
      defaultColumns: 12,
    },
  },
  {
    type: "group",
    category: "composite",
    routing: "container",
    capabilities: CAPS.COLLECTOR,
    label: "Field Group",
    layout: {
      acceptsChildren: true,
      childLayoutMode: "grid",
      defaultColumns: 12,
    },
  },
  // DCS composite types (engine-expanded, registered for backward compat)
  {
    type: "address-group",
    category: "composite",
    routing: "container",
    capabilities: CAPS.COLLECTOR,
    label: "Address Group",
    layout: {
      acceptsChildren: true,
      childLayoutMode: "grid",
      defaultColumns: 12,
    },
  },
  {
    type: "branch-address-group",
    category: "composite",
    routing: "container",
    capabilities: CAPS.INPUT,
    label: "Branch Address Group",
    layout: {
      acceptsChildren: true,
      childLayoutMode: "grid",
      defaultColumns: 12,
    },
  },
];

// ── LAYOUT RENDERERS ────────────────────────────────────────────────────────

const layoutRenderers: LayoutRendererManifest[] = [
  {
    type: "grid",
    category: "container",
    acceptsChildren: true,
    childLayout: "grid",
    label: "Grid Layout",
  },
  {
    type: "flex",
    category: "container",
    acceptsChildren: true,
    childLayout: "flex",
    label: "Flex Layout",
  },
  {
    type: "block",
    category: "container",
    acceptsChildren: true,
    childLayout: "block",
    label: "Block Layout",
  },
  {
    type: "card",
    category: "container",
    acceptsChildren: true,
    childLayout: "grid",
    label: "Card Layout",
  },
  {
    type: "container",
    category: "container",
    acceptsChildren: true,
    childLayout: "grid",
    label: "Plain Container",
  },
  {
    type: "accordion",
    category: "container",
    acceptsChildren: true,
    childLayout: "block",
    label: "Accordion",
  },
  {
    type: "tabs",
    category: "container",
    acceptsChildren: true,
    childLayout: "block",
    label: "Tabs",
  },
  {
    type: "fieldset",
    category: "composite",
    acceptsChildren: true,
    childLayout: "grid",
    label: "Fieldset Layout",
  },
  {
    type: "group",
    category: "composite",
    acceptsChildren: true,
    childLayout: "grid",
    label: "Group Layout",
  },
  {
    type: "repeater",
    category: "composite",
    acceptsChildren: true,
    childLayout: "block",
    label: "Repeater Layout",
  },
];

/**
 * Register all default manifests into the singleton `manifestRegistry`.
 *
 * Called automatically as a side-effect of importing `fields.ts`.
 * Safe to call multiple times — subsequent calls overwrite earlier registrations
 * for the same type.
 *
 * Also registers per-type InstanceDefinition defaults:
 * - `select` — uses String-based value matching, single select, clearable
 * - `multiselect` — multiple selection mode
 * - `radio` — uses String-based value matching
 * - `autocomplete` — client-side search, clearable, String matching
 */
export function registerDefaultManifests(): void {
  manifestRegistry.registerFields(primitiveFields);
  manifestRegistry.registerFields(inputFields);
  manifestRegistry.registerFields(staticFields);
  manifestRegistry.registerFields(containerFields);
  manifestRegistry.registerFields(compositeFields);
  manifestRegistry.registerLayouts(layoutRenderers);

  // ── InstanceDefinition defaults ───────────────────────────────────────

  manifestRegistry.registerInstanceDefaults("select", () => ({
    valueMapper: { match: (a, b) => String(a) === String(b) },
    selection: { mode: "single", clearable: true },
  }));

  manifestRegistry.registerInstanceDefaults("multiselect", () => ({
    selection: { mode: "multiple" },
  }));

  manifestRegistry.registerInstanceDefaults("radio", () => ({
    valueMapper: { match: (a, b) => String(a) === String(b) },
  }));

  manifestRegistry.registerInstanceDefaults("autocomplete", () => ({
    valueMapper: { match: (a, b) => String(a) === String(b) },
    options: {
      source: "computed",
      search: { mode: "client", minChars: 1, debounceMs: 300 },
    },
    selection: { mode: "single", clearable: true },
  }));
}

// Auto-initialize
registerDefaultManifests();
