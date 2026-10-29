import type { FieldType, FormField } from "@ui/form/fields";

type DeepPartial<T> = T extends object
  ? { [P in keyof T]?: DeepPartial<T[P]> }
  : T;

interface FieldFactoryOptions<V extends FieldType> {
  type: V;
  config: DeepPartial<any>;
  render?: any;
}

export function createField<
  T,
  V extends FieldType,
  TForm = Record<string, any>,
>(name: string, options: FieldFactoryOptions<V>): FormField<T, V, TForm> {
  return {
    id: name,
    name: name,
    type: options.type,
    config: options.config as any,
    ...(options.render ? { render: options.render } : {}),
  } as unknown as FormField<T, V, TForm>;
}
