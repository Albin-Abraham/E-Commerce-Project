import React from "react";

import type { FormField } from "@ui/form/fields";

interface SlotFieldProps {
  field: FormField;
  [key: string]: any;
}

/**
 * SlotField - Portal component for injecting arbitrary React components into the Form.
 * Usage: Provide a React component or element in field.meta.ui.component OR field.componentProps.component
 */
export const SlotField: React.FC<SlotFieldProps> = ({ field, ...rest }) => {
  const Component =
    field.meta?.ui?.component || field.componentProps?.component;

  if (!Component) {
    if (process.env.NODE_ENV === "development") {
      return (
        <div className="p-4 border border-dashed border-danger/50 bg-danger/5 rounded-lg text-xs text-danger">
          [Slot Error]: No component provided for slot <b>{field.id}</b>
        </div>
      );
    }
    return null;
  }

  // If it's a function (Component), render it with props.
  // If it's a React Element, just render it.
  if (typeof Component === "function") {
    return <Component field={field} {...rest} />;
  }

  return <>{Component}</>;
};
