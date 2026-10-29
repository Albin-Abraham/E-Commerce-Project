import React, { useMemo } from "react";

import { synthesizeFormField } from "@form-core/domain/field-adapter";
import { FieldRenderer } from "@ui/form/FieldRenderer";
import { useController } from "@ui/form/hooks/useController";
import { useFormContext } from "@ui/form/hooks/useFormContext";
import { FieldShell } from "@ui/form/structure/FieldShell";

export interface UncontrolledFieldProps {
  name: string;
  type?: string;
  component?: string | React.ComponentType<any>;
  label?: any;
  [key: string]: any;
}

/**
 * UncontrolledField Component
 *
 * For standard registered fields. Automatically resolves the field definition
 * from the active Form context (or synthesizes one from inline props) and delegates
 * to `FieldRenderer` (which sets up micro-subscriptions and renders within the DCS shell).
 *
 * @example
 * <UncontrolledField name="email" className="my-custom-layout-class" />
 * <UncontrolledField name="notes" type="textarea" component="textarea" label="Notes" />
 */
export const UncontrolledField = React.memo(function UncontrolledField({
  name,
  type,
  component,
  label,
  ...props
}: UncontrolledFieldProps) {
  const form = useFormContext();
  const existingField = form?.resolveField ? form.resolveField(name) : undefined;

  const field = useMemo(
    () =>
      synthesizeFormField(
        {
          name,
          ...(type ? { type } : {}),
          ...(component ? { component } : {}),
          ...(label !== undefined ? { label } : {}),
          ...props,
        },
        existingField
      ),
    [existingField, name, type, component, label, props]
  );

  return (
    <FieldRenderer
      field={field}
      name={name}
      type={field.type}
      component={field.component}
      label={field.label}
      {...props}
    />
  );
});

export interface ControlledFieldProps {
  name: string;
  render: (fieldState: {
    value: any;
    onChange: (val: any) => void;
    onBlur: () => void;
    onFocus: () => void;
    error: boolean;
    errorMessage?: string;
    vitality: any;
    field: any;
  }) => React.ReactElement;
  [key: string]: any;
}

/**
 * ControlledField Component
 *
 * Binds custom third-party inputs (e.g. React Select, datepickers, slider inputs)
 * to the active Form context. It hooks into O(1) atomic value updates and automatically
 * wraps the custom input in Zenith's visual `withAtom` HOC layer (labels, icons, grids, and error feedback).
 *
 * @example
 * <ControlledField
 *   name="rating"
 *   render={({ value, onChange }) => (
 *     <MyRatingSlider value={value} onChange={onChange} />
 *   )}
 * />
 */
export const ControlledField = React.memo(function ControlledField({
  name,
  render,
  label,
  onChange: propsOnChange,
  onBlur: propsOnBlur,
  onFocus: propsOnFocus,
  ...props
}: ControlledFieldProps) {
  const form = useFormContext();
  const existingField = form?.resolveField ? form.resolveField(name) : undefined;
  const field = useMemo(
    () =>
      synthesizeFormField(
        {
          id: (props.id as string) || name,
          name,
          ...(label !== undefined ? { label } : {}),
          ...(!existingField ? { type: "custom" } : {}),
          ...props,
        },
        existingField
      ),
    [existingField, name, props, label]
  );

  const controller = useController(name);

  // Stable composed event handlers (merging engine controller state + consumer callbacks)
  const handleChange = React.useCallback(
    (val: any) => {
      controller.onChange(val);
      if (typeof propsOnChange === "function") {
        propsOnChange(val);
      }
    },
    [controller.onChange, propsOnChange]
  );

  const handleBlur = React.useCallback(
    (e?: any) => {
      controller.onBlur();
      if (typeof propsOnBlur === "function") {
        propsOnBlur(e);
      }
    },
    [controller.onBlur, propsOnBlur]
  );

  const handleFocus = React.useCallback(
    (e?: any) => {
      controller.onFocus();
      if (typeof propsOnFocus === "function") {
        propsOnFocus(e);
      }
    },
    [controller.onFocus, propsOnFocus]
  );

  return (
    <FieldShell
      field={field}
      name={name}
      label={label || props.label || field.label}
      error={Boolean(controller.error)}
      errorMessage={controller.errorMessage}
      {...props}
    >
      {render({
        value: controller.value,
        onChange: handleChange,
        onBlur: handleBlur,
        onFocus: handleFocus,
        error: Boolean(controller.error),
        errorMessage: controller.errorMessage,
        vitality: (controller as any).vitality,
        field,
      })}
    </FieldShell>
  );
});

export interface FieldProps
  extends
    Omit<UncontrolledFieldProps, "name">,
    Partial<Omit<ControlledFieldProps, "name">> {
  name: string;
  type?: string;
  component?: string | React.ComponentType<any>;
  label?: any;
}

/**
 * Unified Field Component
 *
 * The ultimate smart controller input wrapper. Automatically delegates to
 * UncontrolledField or ControlledField depending on the presence of the `render` prop.
 *
 * @example
 * // Uncontrolled Native Input from Schema
 * <Field name="email" />
 *
 * // Inline Defined Input with Component Mapping
 * <Field name="bio" type="string" component="textarea" label="Bio" />
 *
 * // Controlled Custom Dropdown
 * <Field
 *   name="role"
 *   render={({ value, onChange }) => (
 *     <ReactSelect value={value} onChange={onChange} />
 *   )}
 * />
 */
export const Field = React.memo(function Field({
  name,
  render,
  type,
  component,
  label,
  ...props
}: FieldProps) {
  if (render) {
    return (
      <ControlledField
        name={name}
        render={render}
        type={type}
        component={component}
        label={label}
        {...props}
      />
    );
  }
  return (
    <UncontrolledField
      name={name}
      type={type}
      component={component}
      label={label}
      {...props}
    />
  );
});

