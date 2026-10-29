/**
 * @file field-adapter.ts
 * @description Canonical Domain Adapter for normalizing and synthesizing FormField entities.
 *
 * Consolidates synthetic FormField construction from raw JSX props across
 * `withFieldShell` (withAtom) and `<Field />` (WrapperFields).
 *
 * Guarantees zero framework dependencies (Clean Architecture / Domain Layer).
 *
 * @module DomainFieldAdapter
 */
import type { FieldType, FormField } from "./field";

/**
 * Canonically synthesizes a full FormField entity from direct props or enhances an existing field.
 *
 * @param props - Direct JSX properties (e.g., from standalone <FormTextField />).
 * @param existingField - Optional field definition already resolved from schema.
 */
export function synthesizeFormField(
  props: Record<string, any>,
  existingField?: Partial<FormField>
): FormField {
  if (existingField) {
    if (
      props.type ||
      props.component ||
      props.label !== undefined ||
      props.placeholder !== undefined ||
      props.required !== undefined ||
      props.disabled !== undefined ||
      props.options
    ) {
      return {
        ...existingField,
        ...(props.type ? { type: props.type as FieldType } : {}),
        ...(props.component ? { component: props.component } : {}),
        ...(props.label !== undefined ? { label: props.label } : {}),
        ...(props.placeholder !== undefined
          ? { placeholder: props.placeholder }
          : {}),
        ...(props.required !== undefined
          ? { required: Boolean(props.required) }
          : {}),
        ...(props.disabled !== undefined
          ? { disabled: Boolean(props.disabled) }
          : {}),
        ...(props.options ? { options: props.options } : {}),
      } as FormField;
    }
    return existingField as FormField;
  }

  const rawName = (props.name as string) || (props.id as string) || "unnamed";
  const rawId = (props.id as string) || (props.name as string) || "field-standalone";
  const rawType = ((props.type as string) || "text") as FieldType;

  return {
    id: rawId,
    name: rawName,
    type: rawType,
    label: (props.label as string) || "",
    placeholder: props.placeholder as string | undefined,
    required: Boolean(props.required),
    disabled: Boolean(props.disabled),
    options: (props.options as readonly any[]) || [],
    properties: (props.properties as Record<string, any>) || {},
    componentProps: (props.componentProps as Record<string, any>) || {},
    meta: (props.meta as Record<string, any>) || { ui: {} },
    className: props.className as string | undefined,
    component: props.component,
  } as FormField;
}
