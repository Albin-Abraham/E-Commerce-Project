import React, { useCallback, useMemo, useRef } from "react";

import type { Form } from "@form-core/form";
import { useForm } from "@ui/form/hooks/useForm";

import type {
  DetailRendererInternalProps,
  DetailRuntime,
} from "../types";
import { DetailRendererView } from "./DetailRendererView";

const EMPTY_DATA: Record<string, any> = {};

/**
 * DetailRuntimeBoundary
 *
 * Mounts the headless form engine only when it is actually needed:
 * interactive widgets, or display definitions carrying conditional rules.
 *
 * Also owns the change-diff baseline so `onChange` fires exactly once per
 * user-modified field (instead of re-emitting stale diffs against `data`).
 */
export function DetailRuntimeBoundary<
  T extends Record<string, any> = Record<string, any>,
>(props: DetailRendererInternalProps<T>) {
  const {
    definition,
    fields: directFields,
    data = EMPTY_DATA as T,
    mode = "display",
    onChange,
  } = props;

  const normalizedDefForForm = useMemo(() => {
    if (definition) return definition as any;
    return {
      id: "detail-form",
      fields: directFields || [],
    };
  }, [definition, directFields]);

  const engineRef = useRef<Form<any> | null>(null);
  const baselineRef = useRef<Record<string, any> | null>(null);

  const handleEngineChange = useCallback(
    (values: Record<string, any>) => {
      const baseline = baselineRef.current;
      baselineRef.current = { ...values };
      if (!baseline || !onChange) return;
      for (const [key, value] of Object.entries(values)) {
        if (baseline[key] !== value) {
          onChange(key, value);
        }
      }
    },
    [onChange]
  );

  const formCore = useForm(normalizedDefForForm, data, {
    onChange: handleEngineChange,
  });

  // (Re)anchor the emission baseline whenever the engine instance changes
  // (schema signature change or new `data` identity reseeds the engine).
  if (engineRef.current !== formCore.form) {
    engineRef.current = formCore.form;
    baselineRef.current = { ...formCore.values };
  }

  const runtime: DetailRuntime = useMemo(
    () => ({
      form: formCore.form,
      visibility: formCore.visibility ?? {},
      engineGetComponentProps:
        mode === "interactive" ? formCore.getComponentProps : undefined,
      remoteOptions: ((formCore.form as any).remoteOptions ??
        null) as DetailRuntime["remoteOptions"],
    }),
    [formCore.form, formCore.visibility, formCore.getComponentProps, mode]
  );

  return <DetailRendererView {...props} runtime={runtime} />;
}
