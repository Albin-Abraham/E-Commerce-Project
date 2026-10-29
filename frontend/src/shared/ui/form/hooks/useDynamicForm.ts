import { useCallback, useEffect, useState } from "react";

import { schemaRegistry } from "@form-core/SchemaRegistry";
import type { FormField } from "../fields";
import type { FormDefinition } from "../types";

export interface UseDynamicFormOptions {
  /**
   * If true, the hook will load the schema synchronously and skip the loading state.
   * Only use this if you know the schema builder registered is synchronous.
   */
  sync?: boolean;
}

/**
 * useDynamicForm
 *
 * Replaces bespoke controllers (e.g. useCreateBranchController).
 * Retrieves the logical skeleton, rules, and UI config dynamically by formId.
 */
export function useDynamicForm(
  formId: string,
  options?: UseDynamicFormOptions
) {
  const [schema, setSchema] = useState<FormDefinition | null>(() => {
    if (options?.sync) {
      try {
        return schemaRegistry.resolveSync(formId);
      } catch (err) {
        console.error(
          `[useDynamicForm] Sync resolution failed for "${formId}":`,
          err
        );
        return null;
      }
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState(!options?.sync);
  const [loadError, setLoadError] = useState<Error | null>(null);

  // For submission
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (options?.sync || schema) return;

    let isMounted = true;
    setIsLoading(true);

    schemaRegistry
      .resolve(formId)
      .then((resolvedSchema) => {
        if (isMounted) {
          setSchema(resolvedSchema);
          setLoadError(null);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setLoadError(err);
          console.error(
            `[useDynamicForm] Failed to load schema for "${formId}":`,
            err
          );
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [formId, options?.sync, schema]);

  // Generic handler for custom rules (transformers)
  // This can be expanded to allow passing custom handlers or retrieving them from a RuleRegistry.
  const handleFieldChange = useCallback(
    (values: Record<string, any>, field?: FormField) => {
      if (field?.meta?.events?.onChange) {
        const val = field.name ? values[field.name] : undefined;
        const fallbackVal = field.id ? values[field.id] : undefined;
const result = field.meta.events.onChange(
          field,
          val !== undefined ? val : fallbackVal,
          values
        );
        if (result !== undefined && field.name) {
          return { [field.name]: result };
        }
      }

      return undefined;
    },
    []
  );

  // Generic submission handler
  const submitAction = useCallback(
    async (_data: Record<string, any>) => {
      setSubmitError(null);
      setIsSubmitting(true);
      try {
        // In a real implementation, you would inspect schema.action (e.g., API endpoint path)
        // and use your HttpService to POST the data.
        await new Promise((resolve) => setTimeout(resolve, 1500));
        const successMsg =
          schema?.customData?.successMessage ||
          `Form "${formId}" Submitted Successfully!`;
        alert(successMsg);
      } catch (err) {
        setSubmitError(
          err instanceof Error ? err.message : "Submission failed"
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [formId]
  );

  return {
    schema,
    isLoading,
    error: loadError?.message || submitError,
    isSubmitting,
    handleFieldChange,
    submitAction,
  };
}
