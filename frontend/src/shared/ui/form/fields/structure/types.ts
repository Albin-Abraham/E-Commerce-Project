import * as React from "react";

import type { FormField } from "@ui/form/fields";

export interface StructuralFieldProps {
  field: FormField;
  className?: string;
  children?: React.ReactNode;
  styles?: {
    base?: string;
    label?: string;
    description?: string;
    wrapper?: string;
    [key: string]: string | undefined;
  };
}
