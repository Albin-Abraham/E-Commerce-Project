/**
 * @file index.ts
 * @description The 4-Tier Form Field Ecosystem
 *
 * Tier 1: Primitive Input Atoms (ButtonField, RadioField, CodeInputField, TextField, SwitchField, CheckboxField, etc.)
 * Tier 2: Static Fields (HeaderField, DividerField, ParagraphField, HtmlField)
 * Tier 3: Structure Fields (CardField, TabsField, AccordionField, RepeaterField, SlotField)
 * Tier 4: Wrapped Fields (FormButtonField, FormRadioField, FormCodeInputField, FormTextField, etc.)
 */

// ── Domain Types & Component Props Maps ─────────────────────────────
export * from "@form-core/domain/field";
export type { BaseComponentProps, ComponentPropsMap } from "../fields";

// ── Tier 1 & Tier 2: Primitive Input Atoms & Static Fields ──────────
export * from "./primitive";

// ── Tier 3: Structure & Grouping Fields ─────────────────────────────
export * from "./structure";

// ── Tier 4: Official Autonomous Wrapped Fields ──────────────────────
export * from "./wrapped-fields";

// ── Registries & Field Routing ──────────────────────────────────────
export {
  createSplitRegistry,
  createDefaultRegistry,
  createMinimalRegistry,
  preloadFieldTypes,
  defaultRegistry,
} from "./lazy-registry-builder";
export { Field, ControlledField, UncontrolledField } from "./Field";
export { WrapperFields } from "./WrapperFields";
