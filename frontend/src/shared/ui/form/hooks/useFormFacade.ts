import { useMemo, useState } from "react";

import {
  type UseMutationResult,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import type { FormDefinition } from "../types";
import type { EntityDefinition } from "../types/application";
import {
  compileContractToFormDefinition,
  type FormDefinitionContract,
  type FormLayerModel,
} from "../types/contract";
import { compileEntityToFormDef } from "../utils/mdap-compiler";
import { projectLayers } from "../utils/project-layers";

/**
 * @file useFormFacade.ts
 *
 * DX Facade hook for initializing MDAP forms. Entity-native: accepts a
 * 6-layer `EntityDefinition` (compiled internally), a typed
 * `FormDefinitionContract`, or an already-compiled `FormDefinition`.
 *
 * Formalizes the Mutation/Submit architecture — React Query cache invalidation
 * and optimistic updates — and exposes the effective runtime `layers`
 * (content/behavior/surface/presentation) as the public contract boundary.
 */

export interface UseFormFacadeOptions<T extends Record<string, any>> {
  /** 6-layer MDAP entity (preferred). */
  entity?: EntityDefinition<T>;
  /** Strongly-typed contract (see `defineFormContract` / `withWizard`). */
  contract?: FormDefinitionContract<any>;
  /** Already-compiled definition. */
  definition?: FormDefinition<T>;
  formId?: string;
  submitLabel?: string;
  initialData?: Partial<T>;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

export interface UseFormFacadeResult<T extends Record<string, any>> {
  /** Spread onto `<Form {...formProps} />` (or `<FormFlow>`, etc.). */
  formProps: {
    definition: FormDefinition<T>;
    initialData?: Partial<T>;
    actions: {
      submit: (payload: T) => Promise<{ root: string } | undefined>;
    };
  };
  /** Effective MDAP runtime layers (anti-flattened public boundary). */
  layers: FormLayerModel<T>;
  isSubmitting: boolean;
  submissionError: string | null;
  mutation: UseMutationResult<T, Error, T, unknown>;
}

/**
 * useFormFacade
 *
 * @example
 * ```ts
 * const { formProps, isSubmitting } = useFormFacade({ entity: userEntity });
 * return <Form {...formProps} />;
 * ```
 *
 * @example
 * ```ts
 * const contract = withWizard()(defineFormContract({ ... }));
 * const { formProps } = useFormFacade({ contract });
 * return <FormFlow {...formProps} />;
 * ```
 */
export function useFormFacade<T extends Record<string, any>>({
  entity,
  contract,
  definition,
  formId = "mdap_form",
  submitLabel = "Submit",
  initialData,
  onSuccess,
  onError,
}: UseFormFacadeOptions<T>): UseFormFacadeResult<T> {
  const queryClient = useQueryClient();
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  // 1. Project the effective layers from the chosen authoring source.
  const layers = useMemo<FormLayerModel<T>>(() => {
    if (entity) {
      const content = compileEntityToFormDef(entity, formId, submitLabel);
      return {
        content,
        behavior: entity.behavior,
        surface: entity.surface,
        presentation: entity.presentation,
      };
    }
    if (definition) return projectLayers<T>(definition);
    if (contract)
      return {
        content: compileContractToFormDefinition(
          contract
        ) as unknown as FormDefinition<T>,
      };
    throw new Error(
      "useFormFacade requires one of: `entity`, `contract`, or `definition`."
    );
  }, [entity, definition, contract, formId, submitLabel]);

  // 2. Setup React Query Mutation for the Submit Architecture
  const mutation = useMutation({
    mutationFn: async (data: T) => {
      setSubmissionError(null);
      const onSub =
        entity?.behavior?.events?.onSubmit ??
        contract?.events?.onSubmit ??
        layers.content.events?.onSubmit;
      if (onSub) await onSub(data as any);
      return data;
    },
    onMutate: async (variables) => {
      const optimisticUpdate = entity?.behavior?.mutations?.optimisticUpdate;
      if (optimisticUpdate) {
        return optimisticUpdate(variables as T);
      }
      return { variables };
    },
    onSuccess: (data) => {
      // Formalized Query Cache Invalidation
      const keys = entity?.behavior?.mutations?.invalidateKeys;
      if (keys && keys.length > 0) {
        keys.forEach((key) => queryClient.invalidateQueries({ queryKey: key }));
      }

      entity?.behavior?.events?.afterSubmit?.(data);
      onSuccess?.(data);
    },
    onError: (error: Error, variables, context) => {
      setSubmissionError(error.message || "Failed to submit form");

      const rollbackOnError = entity?.behavior?.mutations?.rollbackOnError;
      if (rollbackOnError && context) {
        // Typical TanStack Query pattern for rollback:
        // queryClient.setQueryData(key, context.previousData);
        // Assumes the optimisticUpdate returned { previousData }.
      }

      entity?.behavior?.events?.onError?.(error, variables as T);
      onError?.(error);
    },
  });

  // 3. Return the exact props needed by `<Form {...formProps} />`
  const formProps = {
    definition: layers.content,
    initialData,
    actions: {
      submit: async (payload: T) => {
        try {
          await mutation.mutateAsync(payload);
        } catch (e: any) {
          return { root: e.message || submissionError || "Submit failed" };
        }
      },
    },
  } as UseFormFacadeResult<T>["formProps"];

  return {
    formProps,
    layers,
    isSubmitting: mutation.isPending,
    submissionError,
    mutation,
  };
}