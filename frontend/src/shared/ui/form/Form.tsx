import React from "react";

import { useFormCore } from "@ui/form/hooks/useFormCore";

import { FormRuntimeTree } from "./components/FormRuntimeTree";
import { FormShell } from "./components/FormShell";

export type { FormProps, FormHandle } from "./FormProps";
import type { FormProps } from "./FormProps";

/**
 * @file Form.tsx
 *
 * `Form` is the single entry point for MDAP forms. It now natively handles
 * both standard simple forms and flow forms based on `definition.settings.wizard.enabled`
 * utilizing a unified `FormShell` to dynamically render layout and validate fields.
 */
export function Form<T extends Record<string, any> = Record<string, any>>(
  props: FormProps<T>
): React.ReactElement {
  const isWizard = !!props.definition?.settings?.wizard?.enabled;
  const runtime = useFormCore({ ...props, runtimeMode: isWizard ? "wizard" : "simple" });

  return (
    <FormRuntimeTree runtime={runtime} Shell={FormShell} isWizard={isWizard}>
      {props.children}
    </FormRuntimeTree>
  );
}