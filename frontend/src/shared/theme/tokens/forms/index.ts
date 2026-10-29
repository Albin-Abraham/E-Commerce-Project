/**
 * Zenith Modular Form Design Tokens (Aggregator)
 *
 * Assembles and exports the unified form tokens contract while exposing
 * granular modules for modular consumption across Zenith components.
 */

import {
  inputVariants,
  field,
  text,
  input,
  surface,
  animation,
  standaloneInput,
} from "./inputs";
import { codeInputTokens } from "./code-input";
import { switchTokens } from "./switch";
import { radioTokens } from "./radio";
import { checkboxTokens } from "./checkbox";
import { tooltipTokens } from "./tooltip";
import { popoverTokens } from "./popover";
import { spinnerTokens } from "./spinners";
import { statusTokens } from "./status";
import { shellTokens } from "./shell";
import {
  controlLayoutTokens,
  controlTypographyTokens,
} from "./controls-common";

export * from "./inputs";
export * from "./code-input";
export * from "./switch";
export * from "./radio";
export * from "./checkbox";
export * from "./tooltip";
export * from "./popover";
export * from "./spinners";
export * from "./status";
export * from "./shell";
export * from "./controls-common";

export const form = {
  inputVariants,
  field,
  text,
  input,
  surface,
  animation,
  controls: {
    layout: controlLayoutTokens,
    typography: controlTypographyTokens,
    checkbox: checkboxTokens,
    switch: switchTokens,
    radio: radioTokens,
    codeInput: codeInputTokens,
    standaloneInput,
  },
  tooltip: tooltipTokens,
  popover: popoverTokens,
  spinners: spinnerTokens,
  status: statusTokens,
  shell: shellTokens,
} as const;

export type FormTokens = typeof form;
export type FormInputVariant = keyof typeof form.inputVariants;
