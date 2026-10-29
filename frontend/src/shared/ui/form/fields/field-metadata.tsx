import React from "react";
import {
  AlignLeft,
  Calendar,
  CheckSquare,
  Circle,
  Hash,
  Link,
  List,
  Lock,
  Mail,
  Phone,
  Type,
} from "lucide-react";

import type { FieldType } from "../fields";

export interface FieldMetadata {
  type: FieldType;
  label: string;
  /** Lazily-rendered icon — call as `metadata.icon()` in JSX to avoid eager evaluation. */
  icon: () => React.ReactNode;
}

/**
 * Metadata for visual Field Selection (e.g. in a Form Builder).
 * Maps field types to human-readable labels and icons.
 */
export const FIELD_METADATA: Record<string, FieldMetadata> = {
  text: { type: "text", label: "Text Input", icon: () => <Type size={16} /> },
  textarea: {
    type: "textarea",
    label: "Text Area",
    icon: () => <AlignLeft size={16} />,
  },
  number: { type: "number", label: "Number", icon: () => <Hash size={16} /> },
  number_input: {
    type: "number_input",
    label: "Number Input",
    icon: () => <Hash size={16} />,
  },
  NumberField: {
    type: "NumberField",
    label: "Number Field",
    icon: () => <Hash size={16} />,
  },
  code: { type: "code", label: "Code / OTP", icon: () => <Lock size={16} /> },
  code_input: {
    type: "code_input",
    label: "Code Input",
    icon: () => <Lock size={16} />,
  },
  CodeInput: {
    type: "CodeInput",
    label: "Code Input",
    icon: () => <Lock size={16} />,
  },
  email: { type: "email", label: "Email", icon: () => <Mail size={16} /> },
  date: { type: "date", label: "Date", icon: () => <Calendar size={16} /> },
  select: { type: "select", label: "Dropdown", icon: () => <List size={16} /> },
  checkbox: {
    type: "checkbox",
    label: "Checkbox",
    icon: () => <CheckSquare size={16} />,
  },
  radio: {
    type: "radio",
    label: "Radio Group",
    icon: () => <Circle size={16} />,
  },
  // Aliases mapped to icons
  password: {
    type: "password",
    label: "Password",
    icon: () => <Lock size={16} />,
  },
  phone: { type: "phone", label: "Phone", icon: () => <Phone size={16} /> },
  url: { type: "url", label: "URL", icon: () => <Link size={16} /> },
  image: { type: "image", label: "Image", icon: () => <Calendar size={16} /> },
};
