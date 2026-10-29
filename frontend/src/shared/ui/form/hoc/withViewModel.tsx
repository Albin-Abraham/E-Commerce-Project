import React from "react";

import type { FormField } from "@ui/form/fields";
import { useFieldViewModel } from "../hooks/useFieldViewModel";

/**
 * withViewModel HOC (The Data/State ViewModel Adapter)
 *
 * Responsibility: Connects an atomic or composite presentation component
 * directly to the Form Engine's reactive field state via `useFieldViewModel(field.id)`.
 *
 * Features:
 * - Flattens engine `inputProps` (value, onChange, onBlur, onFocus, error, errorMessage, errors).
 * - Forwards remote options, loading states, and search callbacks.
 * - Bridges dynamic slot props (startContent, endContent, leftContent, rightContent).
 * - Decouples UI components from FormEngine internal state representations.
 */
export function withViewModel<P extends { field: FormField }>(
  Component: React.ComponentType<P>
): React.ComponentType<P> {
  const BoundViewModelComponent = React.forwardRef<any, P>((props, ref) => {
    const viewModelProps = useFieldViewModel(props.field.id);
    return <Component ref={ref} {...(viewModelProps as any)} {...props} />;
  });

  BoundViewModelComponent.displayName = `withViewModel(${
    Component.displayName || Component.name || "Component"
  })`;

  return React.memo(BoundViewModelComponent) as any;
}
