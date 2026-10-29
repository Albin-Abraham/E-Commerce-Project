/**
 * @file index.ts
 * @description Primitive Input Atoms & Field Components (Tier 1 & Tier 2)
 *
 * Headless inputs and primitive field presentation components that operate
 * independently of any form context.
 */

// ── Headless Control Atoms ──────────────────────────────────────────
export * from "./controls";

// ── Primitive Input Fields (Tier 1) ─────────────────────────────────
export { ButtonField, type ButtonFieldProps } from "./ButtonField";
export { RadioField, type RadioFieldProps } from "./RadioField";
export { CodeInputField, type CodeInputFieldProps } from "./CodeInputField";
export { TextField, type TextFieldProps } from "./TextField";
export { CheckboxField, type CheckboxFieldProps } from "./CheckboxField";
export { SwitchField, type SwitchFieldProps } from "./SwitchField";
export { SelectField, type SelectFieldProps } from "./SelectField";
export {
  NumberInputField,
  type NumberInputFieldProps,
} from "./NumberInputField";
export { TextareaField, type TextareaFieldProps } from "./TextareaField";
export { RangeField, type RangeFieldProps } from "./RangeField";
export { FileField, type FileFieldProps } from "./FileField";
export { ImageField } from "./ImageField";
export {
  MultiSelectField,
  type MultiSelectFieldProps,
} from "./MultiSelectField";
export {
  AutocompleteField,
  type AutocompleteFieldProps,
} from "./AutocompleteField";
export { SearchInputField } from "./SearchInputField";
export { PhoneField } from "./PhoneField";
export { TableFilterField } from "./TableFilterField";

// ── Static Fields (Tier 2) ──────────────────────────────────────────
export {
  HeaderField,
  DividerField,
  ParagraphField,
  HtmlField,
} from "./StaticFields";

// ── Field Types & Interfaces ────────────────────────────────────────
export * from "./types";
