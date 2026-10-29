/**
 * @file wrapped-fields.ts
 * @description Official Design System Wrapped Field Components.
 *
 * Each component is pre-wrapped with the `withAtom` HOC (the DCS layer),
 * orchestrating the Wrapper Trinity:
 *   - OuterWrapper: Icons, action slots, tooltips, password reveal toggles
 *   - InputWrapper: Field labels, required indicators, accessibility, FieldFeedback
 *   - Box: Design system density and CSS variables
 *
 * Use these components in Storybook, custom composite layouts, and direct rendering
 * rather than loading bare atomic inputs from `primitive/`.
 *
 * @module WrappedFields
 */
import { withAtom, withFieldShell } from "../hoc/withAtom";
import { AutocompleteField } from "./primitive/AutocompleteField";
import { ButtonField } from "./primitive/ButtonField";
import { CheckboxField } from "./primitive/CheckboxField";
import { CodeInputField } from "./primitive/CodeInputField";
import { FileField } from "./primitive/FileField";
import { MultiSelectField } from "./primitive/MultiSelectField";
import { NumberInputField } from "./primitive/NumberInputField";
import { PhoneField } from "./primitive/PhoneField";
import { RadioField } from "./primitive/RadioField";
import { RangeField } from "./primitive/RangeField";
import { SearchInputField } from "./primitive/SearchInputField";
import { SelectField } from "./primitive/SelectField";
import { SwitchField } from "./primitive/SwitchField";
import { TableFilterField } from "./primitive/TableFilterField";
import { TextField } from "./primitive/TextField";
import { TextareaField } from "./primitive/TextareaField";

// ── Wrapped Input Fields ───────────────────────────────────────────────────

export const FormTextField = withAtom(TextField);
export const FormTextareaField = withAtom(TextareaField);
export const FormSelectField = withAtom(SelectField);
export const FormAutocompleteField = withAtom(AutocompleteField);
export const FormNumberInputField = withAtom(NumberInputField);
export const FormCheckboxField = withAtom(CheckboxField, {
  showLabel: false,
  wrapOuter: false,
});
export const FormRadioField = withAtom(RadioField, {
  wrapOuter: false,
});
export const FormSwitchField = withAtom(SwitchField, {
  showLabel: false,
  wrapOuter: false,
});
export const FormRangeField = withAtom(RangeField, { wrapOuter: false });
export const FormFileField = withAtom(FileField, { wrapOuter: false });
export const FormMultiSelectField = withAtom(MultiSelectField, {
  wrapOuter: false,
});
export const FormPhoneField = withAtom(PhoneField);
export const FormCodeInputField = withAtom(CodeInputField, {
  wrapOuter: false,
});

// ── Search & Filter Specialized Wrapped Fields ────────────────────────────

export const FormSearchInputField = withAtom(SearchInputField, {
  showLabel: false,
  wrapOuter: false,
});

export const FormTableFilterField = withAtom(TableFilterField, {
  showLabel: false,
  wrapOuter: false,
});

// ── Static / Action Wrapped Fields ────────────────────────────────────────

export const FormButtonField = withAtom(ButtonField, {
  showLabel: false,
  wrapOuter: false,
});

// ── Smart Dynamic Controller & Composite Shell ────────────────────────────

export { Field, ControlledField, UncontrolledField } from "./Field";
export { FieldShell } from "../structure/FieldShell";
export { withAtom, withFieldShell } from "../hoc/withAtom";

