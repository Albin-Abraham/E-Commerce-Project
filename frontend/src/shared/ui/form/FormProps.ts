/**
 * @file FormProps.ts
 * @description Public type definitions for the Form component.
 *
 * NOTE: The primary interface definitions live in Form.tsx.
 * This file exists for consumers who need the types without importing the component.
 */
import type { RegistryStore } from "@ui/form/registry";
import type { IFormCore } from "@form-core/form-interface";
import type { FormField } from "@ui/form/fields";
import type { FormSurfaceShell } from "@ui/form/shell/surface-shell";
import type { StyleAdapter } from "@ui/form/styles/style-adapter";
import type { FormTheme } from "@ui/form/styles/FormTheme";
import type { FormDefinition, NavigationGuardConfig } from "@ui/form/types";

export interface FormProps<
  T extends Record<string, any> = Record<string, any>,
> {
  /** React 19 native ref for imperative access to FormHandle. */
  ref?: React.Ref<FormHandle<T>>;
  definition: FormDefinition<T>;
  initialData?: Partial<T>;
  validationSchema?: any;
  onSubmit?: (data: T) => Promise<Record<string, string> | void> | void;
  actions?: Record<string, (payload?: any) => Promise<any>>;
  shell?: FormSurfaceShell;
  className?: string;
  debug?: boolean;
  theme?: FormTheme;
  adapter?: StyleAdapter;
  mode?: "edit" | "view";
  onChange?: (
    values: Partial<T>,
    field?: FormField<any, any, T>
  ) => void | Partial<T>;
  onSelectChange?: (
    values: Partial<T>,
    field?: FormField<any, any, T>
  ) => void | Partial<T>;
  registry?: RegistryStore;
  locale?: string;
  validationMode?: "onChange" | "onBlur" | "onSubmit" | "manual" | "lazy";
  middleware?: Array<
    (context: { form: any; fieldId?: string }) => void | Promise<void>
  >;
  i18nNamespace?: string;
  motionConfig?: {
    disabled?: boolean;
    reduced?: boolean;
  };
  navigationGuard?: boolean | NavigationGuardConfig;
  /**
   * Field-level permission map: { [fieldId]: "edit" | "view" | "hidden" }.
   * Used by PermissionContext to restrict access per-field without prop drilling.
   * @see PermissionProvider, useFieldPermission
   */
  permissions?: import("./context/PermissionContext").FormPermissionsProp;
  secondaryActions?: React.ReactNode;
  children?: React.ReactNode;
}

export interface FormHandle<
  T extends Record<string, any> = Record<string, any>,
> {
  submit: () => Promise<boolean>;
  reset: (
    data?: Partial<T>,
    options?: {
      keepTouched?: boolean | string[];
      keepDirty?: boolean | string[];
      keepValues?: string[];
    }
  ) => void;
  setValue: <K extends keyof T>(fieldId: K | string, value: T[K]) => void;
  getValue: <K extends keyof T>(fieldId: K | string) => T[K];
  setTouched: (fieldId: string) => void;
  setErrors: (errors: Record<string, string>) => void;
  validate: (fieldIds?: string[]) => Promise<boolean>;
  getValues: () => T;
  getPayload: () => Partial<T>;
  isValid: boolean;
  isDirty: boolean;
  isDegraded: boolean;
  canUndo: boolean;
  canRedo: boolean;
  undo: () => Promise<boolean>;
  redo: () => Promise<boolean>;
  engine: IFormCore<T>;
}
