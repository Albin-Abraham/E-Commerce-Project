import type { ComponentType } from "react";

export interface PrimitiveInputProps {
  value: any;
  onChange: (val: any) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  error?: string;
  required?: boolean;
}

export interface PrimitiveSelectProps extends PrimitiveInputProps {
  options?: Array<{ label: string; value: any }>;
}

export interface PrimitiveComponentRegistry {
  Input: ComponentType<PrimitiveInputProps>;
  Select: ComponentType<PrimitiveSelectProps>;
  Checkbox: ComponentType<PrimitiveInputProps>;
  DatePicker: ComponentType<PrimitiveInputProps>;
  TextArea: ComponentType<PrimitiveInputProps>;
  NumberInput: ComponentType<PrimitiveInputProps>;
}

/**
 * Global Component Primitive Registry
 * Decouples core form fields from specific UI frameworks (HeroUI, MUI, AntD).
 */
export class UIPrimitiveAdapter {
  private static registry: Partial<PrimitiveComponentRegistry> = {};

  public static register<K extends keyof PrimitiveComponentRegistry>(
    name: K,
    component: PrimitiveComponentRegistry[K]
  ): void {
    this.registry[name] = component;
  }

  public static get<K extends keyof PrimitiveComponentRegistry>(
    name: K
  ): PrimitiveComponentRegistry[K] | undefined {
    return this.registry[name];
  }
}
