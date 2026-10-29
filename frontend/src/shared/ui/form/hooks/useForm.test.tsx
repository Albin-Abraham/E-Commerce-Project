import { useEffect } from "react";

import { render, act } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { FormDefinition } from "../types";
import { useForm, type UseFormOptions } from "./useForm";

const baseDefinition: FormDefinition = {
  id: "hook-form",
  title: "Hook Form",
  sections: [
    {
      id: "section-1",
      title: "Section 1",
      fields: [
        { id: "field-1", name: "name", type: "text", label: "Name" },
        { id: "field-2", name: "email", type: "text", label: "Email" },
      ],
    },
  ],
};

function HookHarness(props: {
  definition: FormDefinition;
  initialData?: any;
  options?: UseFormOptions<any>;
  onReady: (form: any) => void;
}) {
  const state = useForm(props.definition, props.initialData, props.options);

  useEffect(() => {
    props.onReady(state.form);
  }, [props, state.form]);

  return null;
}

describe("useForm lifecycle & stability", () => {
  it("recreates form when schema structure changes even with same id", () => {
    const onReady = vi.fn();
    const { rerender } = render(
      <HookHarness definition={baseDefinition} onReady={onReady} />
    );

    const firstForm = onReady.mock.calls[0][0];

    const changedDefinition: FormDefinition = {
      ...baseDefinition,
      sections: [
        {
          ...baseDefinition.sections![0],
          fields: [
            ...baseDefinition.sections![0].fields!,
            { id: "field-3", name: "age", type: "number", label: "Age" },
          ],
        },
      ],
    };
    rerender(<HookHarness definition={changedDefinition} onReady={onReady} />);

    const secondForm = onReady.mock.calls[1][0];
    expect(secondForm).not.toBe(firstForm);
  });

  it("keeps form instance stable for equivalent schema objects", () => {
    const onReady = vi.fn();
    const { rerender } = render(
      <HookHarness definition={baseDefinition} onReady={onReady} />
    );
    const firstForm = onReady.mock.calls[0][0];

    const equivalentDefinition: FormDefinition = JSON.parse(
      JSON.stringify(baseDefinition)
    );
    rerender(
      <HookHarness definition={equivalentDefinition} onReady={onReady} />
    );

    const secondForm = onReady.mock.calls[1][0];
    expect(secondForm).toBe(firstForm);
  });

  describe("Phase 2: initialData lifecycle semantics", () => {
    it("keeps form instance stable when initialData reference changes but content is equivalent", () => {
      const onReady = vi.fn();
      const { rerender } = render(
        <HookHarness
          definition={baseDefinition}
          initialData={{ name: "Alice" }}
          onReady={onReady}
        />
      );
      const firstForm = onReady.mock.calls[0][0];

      // Rerender with a completely new object reference having identical contents
      rerender(
        <HookHarness
          definition={baseDefinition}
          initialData={{ name: "Alice" }}
          onReady={onReady}
        />
      );

      const latestForm = onReady.mock.calls[onReady.mock.calls.length - 1][0];
      expect(latestForm).toBe(firstForm);
      expect(latestForm.values.name).toBe("Alice");
    });

    it("synchronizes async initialData updates to pristine fields without recreating form instance", () => {
      const onReady = vi.fn();
      const { rerender } = render(
        <HookHarness
          definition={baseDefinition}
          initialData={{ name: "Initial", email: "initial@test.com" }}
          onReady={onReady}
        />
      );
      const firstForm = onReady.mock.calls[0][0];
      expect(firstForm.values.name).toBe("Initial");

      // Simulate async query result arriving with updated initialData
      rerender(
        <HookHarness
          definition={baseDefinition}
          initialData={{ name: "Updated Server Value", email: "updated@test.com" }}
          onReady={onReady}
        />
      );

      const latestForm = onReady.mock.calls[onReady.mock.calls.length - 1][0];
      expect(latestForm).toBe(firstForm); // Instance is preserved
      expect(latestForm.values.name).toBe("Updated Server Value");
      expect(latestForm.values.email).toBe("updated@test.com");
      expect(latestForm.isDirty).toBe(false);
    });

    it("preserves active user edits on dirty fields when subsequent initialData changes arrive (preserve-dirty mode)", () => {
      const onReady = vi.fn();
      const { rerender } = render(
        <HookHarness
          definition={baseDefinition}
          initialData={{ name: "Initial", email: "pristine@test.com" }}
          onReady={onReady}
        />
      );
      const firstForm = onReady.mock.calls[0][0];

      // User makes an edit to "name", making it dirty
      act(() => {
        firstForm.setValue("name", "User Edited Name");
      });
      expect(firstForm.values.name).toBe("User Edited Name");
      expect(firstForm.vitality["field-1"]?.dirty || firstForm.vitality["name"]?.dirty).toBeTruthy();

      // Subsequent server update arrives
      act(() => {
        rerender(
          <HookHarness
            definition={baseDefinition}
            initialData={{ name: "Server Newer Name", email: "server-newer@test.com" }}
            onReady={onReady}
          />
        );
      });

      const latestForm = onReady.mock.calls[onReady.mock.calls.length - 1][0];
      expect(latestForm).toBe(firstForm);
      // "name" was dirty -> user edit preserved!
      expect(latestForm.values.name).toBe("User Edited Name");
      // "email" was pristine -> updated from server!
      expect(latestForm.values.email).toBe("server-newer@test.com");
    });

    it("forces complete reset when initialDataSyncMode is force-reset", () => {
      const onReady = vi.fn();
      const { rerender } = render(
        <HookHarness
          definition={baseDefinition}
          initialData={{ name: "Initial" }}
          options={{ initialDataSyncMode: "force-reset" }}
          onReady={onReady}
        />
      );
      const firstForm = onReady.mock.calls[0][0];

      // User makes edit
      act(() => {
        firstForm.setValue("name", "User Edited Name");
      });
      expect(firstForm.values.name).toBe("User Edited Name");

      // Server update arrives with force-reset
      act(() => {
        rerender(
          <HookHarness
            definition={baseDefinition}
            initialData={{ name: "Forced Reset Value" }}
            options={{ initialDataSyncMode: "force-reset" }}
            onReady={onReady}
          />
        );
      });

      const latestForm = onReady.mock.calls[onReady.mock.calls.length - 1][0];
      expect(latestForm.values.name).toBe("Forced Reset Value");
      expect(latestForm.isDirty).toBe(false);
    });

    it("ignores initialData changes when initialDataSyncMode is ignore", () => {
      const onReady = vi.fn();
      const { rerender } = render(
        <HookHarness
          definition={baseDefinition}
          initialData={{ name: "Frozen Name" }}
          options={{ initialDataSyncMode: "ignore" }}
          onReady={onReady}
        />
      );
      const firstForm = onReady.mock.calls[0][0];

      rerender(
        <HookHarness
          definition={baseDefinition}
          initialData={{ name: "Attempted Change" }}
          options={{ initialDataSyncMode: "ignore" }}
          onReady={onReady}
        />
      );

      const latestForm = onReady.mock.calls[onReady.mock.calls.length - 1][0];
      expect(latestForm.values.name).toBe("Frozen Name");
    });
  });
});
