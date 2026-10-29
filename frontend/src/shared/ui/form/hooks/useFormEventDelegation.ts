import React, { useCallback } from "react";

import type { FormCore } from "@form-core/engine";
import {
  extractNativeDOMValue,
  isNativeDelegationSupported,
} from "@ui/form/fields";
import { get } from "lodash-es";

/**
 * Hook that creates onChange/onBlur handlers for the <form> element
 * using event delegation — captures bubbling native DOM events to
 * minimize React listener overhead.
 */
export function useFormEventDelegation(form: FormCore<any>) {
  const handleDelegatedChange = useCallback(
    (e: React.ChangeEvent<HTMLFormElement>) => {
      if (!e.target) return;
      const target = e.target as unknown as HTMLInputElement;
      const fieldId = target.name || target.dataset.fieldId;
      if (!fieldId) return;

      const field = form.resolveField(fieldId);
      if (!field) return;

      if (field.syncMode === "blur") return;
      if (field.onChange || field.meta?.events?.onChange) return;

      if (isNativeDelegationSupported(field.type)) {
        const newValue = extractNativeDOMValue(target);
        const currentValue = get(form.values, field.name || fieldId);
        if (currentValue !== newValue) {
          form.setValue(fieldId, newValue);
        }
      }
    },
    [form]
  );

  const handleDelegatedBlur = useCallback(
    (e: React.FocusEvent<HTMLFormElement>) => {
      const target = e.target as unknown as HTMLInputElement;
      const fieldId = target.name || target.dataset.fieldId;
      if (!fieldId) return;

      const field = form.resolveField(fieldId);
      if (!field) return;

      if (isNativeDelegationSupported(field.type)) {
        form.setTouched(fieldId);
        form.validateFields([fieldId]);
      }
    },
    [form]
  );

  return { handleDelegatedChange, handleDelegatedBlur };
}
