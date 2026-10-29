/**
 * form-test-utils.tsx
 *
 * Form-specific test utilities.
 *
 * Provides `renderWithForm` — a harness that mounts a live Form engine instance
 * and wraps children in all required providers, enabling isolated testing of
 * `useWatch`, `useController`, `useFormContext<T>`, and custom field components
 * WITHOUT needing a full `<Form>` schema render.
 */
import type { PropsWithChildren, ReactElement } from "react";

import { act } from "@testing-library/react";
import type { RenderOptions } from "@testing-library/react";
import { FormRegistryProvider } from "@ui/form/context/FormRegistryContext";
import { defaultRegistry } from "@ui/form";
import { Form } from "@form-core/form";
import type { FormDefinition } from "@ui/form/types";

import { renderWithProviders } from "./test-utils";

// ─────────────────────────────────────────────────────────────────────────────
// renderWithForm
// ─────────────────────────────────────────────────────────────────────────────

export interface FormRenderContext {
  definition: FormDefinition;
  initialValues?: Record<string, any>;
}

/**
 * Renders `ui` inside a live Form engine context.
 *
 * Unlike `renderWithProviders`, this boots a real `Form` instance and exposes
 * it so tests can call `form.setValue`, `form.submit()`, `form.setErrors()` etc.
 * directly alongside DOM assertions.
 *
 * @example
 * const { form, getByTestId } = renderWithForm(
 *   <WatchConsumer fieldKey="role" />,
 *   { definition: MY_FIXTURE }
 * );
 * await act(() => form.setValue("role", "admin"));
 * expect(getByTestId("watch-output").textContent).toBe('"admin"');
 */
export const renderWithForm = (
  ui: ReactElement,
  { definition, initialValues }: FormRenderContext,
  options?: Omit<RenderOptions, "wrapper">
) => {
  const form = new Form(definition, initialValues);

  const FormProvider = ({ children }: PropsWithChildren) => (
    <FormRegistryProvider value={{ registry: defaultRegistry, form }}>
      {children}
    </FormRegistryProvider>
  );

  const result = renderWithProviders(ui, { providers: FormProvider }, options);

  return {
    ...result,
    /** The live Form engine — call setValue/submit/reset directly in tests. */
    form,
    /**
     * Helper: set a value and flush all React state updates.
     */
    setValue: async (name: string, value: any) => {
      await act(async () => {
        await form.setValue(name, value);
      });
    },
    /**
     * Helper: submit the form and flush updates.
     */
    submit: async () => {
      let result = false;
      await act(async () => {
        result = await form.submit();
      });
      return result;
    },
  };
};
