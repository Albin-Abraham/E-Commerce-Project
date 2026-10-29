import type { ComponentType, Ref } from "react";

import type { FieldComponentProps } from "@form-core/react-adapter";

/**
 * A field renderer: a React component that receives its props from the form
 * engine via `FieldComponentProps`.
 *
 * Used as the value type of the field registry maps, both eager
 * (`Record<FieldType, FieldComponent>`) and lazily loaded
 * (`() => Promise<{ default: FieldComponent }>`).
 *
 * The prop type is intentionally wider than {@link FieldComponentProps} because
 * registry entries are heterogeneous by design:
 *  - the engine forwards a `ref` to each field;
 *  - HOC wrappers (e.g. `withAtom`) inject their own props;
 *  - lazy wrappers spread an opaque module's props.
 *
 * `FieldType` and `FormField` are re-exported here so registry consumers can
 * import the whole field-registration surface from one module.
 */
export type FieldComponent = ComponentType<
  FieldComponentProps & { ref?: Ref<unknown> } & Record<string, unknown>
>;

export type { FieldType, FormField } from "../fields";
