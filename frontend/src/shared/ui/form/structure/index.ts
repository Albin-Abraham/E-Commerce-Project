/**
 * @file index.ts
 * @description Wrapper Trinity & Structural Form Components (Tier 3)
 *
 * Provides FieldShell, InputWrapper, OuterWrapper (FieldSurface), FieldLabel,
 * and FieldFeedback orchestrating layout, error reservation, and accessibility.
 */

export {
  FieldShell,
  FieldShellContext,
  useFieldShellContext,
  type FieldShellProps,
  type FieldShellContextValue,
} from "./FieldShell";
export { FieldLabel, type FieldLabelProps } from "./FieldLabel";
export { FieldFeedback, type FieldFeedbackProps } from "./FieldFeedback";
export { InputWrapper, type InputWrapperProps } from "./InputWrapper";
export {
  FieldSurface,
  OuterWrapper,
  type FieldSurfaceProps,
  type OuterWrapperProps,
} from "./OuterWrapper";
