import { useMemo } from "react";

import type { DetailedError } from "@form-core/int-types";
import type { FieldComponentProps } from "@form-core/react-adapter";

import { useFormRegistry } from "../context/FormRegistryContext";
import { useField } from "./useField";

/**
 * InputProps shape from the engine's ResolvedFieldProps.
 */
interface EngineInputProps {
  value?: unknown;
  valid?: boolean;
  errors?: DetailedError[];
  touched?: boolean;
  dirty?: boolean;
  focused?: boolean;
  onChange?: (value: unknown) => void;
  onBlur?: () => void;
  onFocus?: () => void;
}

/**
 * View-model props produced by {@link useFieldViewModel}.
 *
 * Flattens nested `inputProps` to the top level so `withAtom` / AtomicFieldProps
 * can read `value`, `onChange`, `onBlur` directly without drilling into `inputProps`.
 */
export interface FieldViewModelProps extends FieldComponentProps {
  value: unknown;
  onChange?: (value: unknown) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  error?: boolean;
  errorMessage?: string;
  errors?: ReadonlyArray<DetailedError>;
  isInvalid: boolean;
  isEmpty: boolean;
  options?: ReadonlyArray<{ label: string; value: unknown }>;
  isLoading?: boolean;
  onSearch?: (query: string) => void;
}

/**
 * Pure adapter function that maps raw engine field props and form services
 * into a flattened, UI-ready FieldViewModelProps record.
 *
 * Extracting this as a pure function ensures zero React hook coupling,
 * enabling direct unit testing without render hooks or mocks.
 */
export function adaptEnginePropsToViewModel(
  fieldId: string,
  fieldProps: unknown,
  form?: {
    remoteOptions?: {
      executeSearch: (fieldId: string, query: string) => void;
    };
  } | null
): FieldViewModelProps {
  // Extract inputProps from the resolved field props
  const resolved = (fieldProps || {}) as {
    inputProps?: EngineInputProps;
    value?: unknown;
    onChange?: (value: unknown) => void;
    onBlur?: () => void;
    onFocus?: () => void;
    options?: ReadonlyArray<{ label: string; value: unknown }>;
    isLoading?: boolean;
    [key: string]: unknown;
  };
  const ip = resolved.inputProps;

  const value = ip?.value ?? resolved.value;
  const errors = (ip?.errors ?? []) as ReadonlyArray<DetailedError>;

  return {
    // Spread the full resolved props (includes stateKey, dataPath, label, etc.)
    ...(resolved as unknown as FieldComponentProps),

    // ── Flatten inputProps to top-level for withAtom / AtomicFieldProps ───
    value,
    onChange: ip?.onChange ?? resolved.onChange,
    onBlur: ip?.onBlur ?? resolved.onBlur,
    onFocus: ip?.onFocus ?? resolved.onFocus,
    error: ip ? !ip.valid : undefined,
    errorMessage: errors[0]?.message,
    errors,

    // ── Remote options (from RemoteOptionsManager via ResolutionPipeline) ──
    options: resolved.options,
    isLoading: resolved.isLoading,
    onSearch: (query: string) => {
      if (form?.remoteOptions) {
        form.remoteOptions.executeSearch(fieldId, query);
      }
    },

    // ── Derived meta flags used by withAtom wrappers ───────────────────
    isInvalid: errors.length > 0,
    isEmpty: value === undefined || value === null || value === "",
  };
}

export function useFieldViewModel(fieldId: string): FieldViewModelProps {
  const fieldProps = useField(fieldId);
  const { form } = useFormRegistry();

  return useMemo(
    () => adaptEnginePropsToViewModel(fieldId, fieldProps, form),
    [fieldProps, fieldId, form]
  );
}
