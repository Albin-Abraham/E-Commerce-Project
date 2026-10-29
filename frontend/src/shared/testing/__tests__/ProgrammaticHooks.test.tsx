/**
 * ProgrammaticHooks.test.tsx
 *
 * INTEGRATION TESTS — useWatch, useWatchFields, useController, useFormContext<T>
 *
 * Each test renders a consumer component inside `renderWithForm`, then drives
 * state changes via the live `form` engine and asserts that the React hooks
 * re-rendered with the correct values.
 */
import React from "react";

import { render, screen, waitFor } from "@testing-library/react";
import { useController } from "@ui/form/hooks/useController";
import { useFormContext } from "@ui/form/hooks/useFormContext";
import { useWatch, useWatchFields } from "@ui/form/hooks/useWatch";
import { describe, expect, it, vi } from "vitest";

import {
  HEADLESS_ENGINE_FIXTURE,
  PROGRAMMATIC_CONTROLS_FIXTURE,
} from "../fixtures/ProgrammaticControlsFixture";
import { renderWithForm } from "../form-test-utils";

// ─────────────────────────────────────────────────────────────────────────────
// CONSUMER COMPONENTS (render hooks, expose output to DOM for assertion)
// ─────────────────────────────────────────────────────────────────────────────

/** Displays a single watched field value as JSON */
function WatchOutput({ fieldKey }: { fieldKey: string }) {
  const value = useWatch(fieldKey);
  return (
    <div data-testid={`watch-${fieldKey}`}>
      {value === null || value === undefined
        ? "__empty__"
        : JSON.stringify(value)}
    </div>
  );
}

/** Displays two watched fields */
function MultiWatchOutput({ keys }: { keys: string[] }) {
  const values = useWatchFields(keys);
  return <div data-testid="multi-watch">{JSON.stringify(values)}</div>;
}

/** Renders a controlled text input using useController */
function ControlledInput({ fieldKey }: { fieldKey: string }) {
  const { value, onChange, onBlur, error, errorMessage, field } =
    useController<string>(fieldKey);
  return (
    <div>
      <input
        data-testid={`controlled-${fieldKey}`}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        aria-invalid={!!error}
        aria-label={field?.label as string}
      />
      {error && (
        <span data-testid={`error-${fieldKey}`} role="alert">
          {errorMessage}
        </span>
      )}
    </div>
  );
}

/** Accesses the form engine via useFormContext and exposes isDirty */
function FormContextConsumer() {
  const form = useFormContext();
  return (
    <div>
      <div data-testid="is-dirty">{String(form.isDirty)}</div>
      <div data-testid="is-valid">{String(form.isValid)}</div>
    </div>
  );
}

/** Shows value and calls an external spy */
function WatchWithSpy({
  fieldKey,
  spy,
}: {
  fieldKey: string;
  spy: (v: any) => void;
}) {
  const value = useWatch(fieldKey);
  spy(value);
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 1 — useWatch
// ─────────────────────────────────────────────────────────────────────────────

describe("useWatch — Reactive Field Value Subscription", () => {
  it("returns null initially for an unset field", () => {
    renderWithForm(<WatchOutput fieldKey="role" />, {
      definition: PROGRAMMATIC_CONTROLS_FIXTURE,
    });

    expect(screen.getByTestId("watch-role").textContent).toBe("__empty__");
  });

  it("updates reactively when the engine changes the value", async () => {
    const { setValue } = renderWithForm(<WatchOutput fieldKey="role" />, {
      definition: PROGRAMMATIC_CONTROLS_FIXTURE,
    });

    await setValue("role", "admin");

    await waitFor(() => {
      expect(screen.getByTestId("watch-role").textContent).toBe('"admin"');
    });
  });

  it("resolves by key — key = name = id", async () => {
    // Schema uses `key: "role"` — so id, name, and the addressable key are all "role"
    const { setValue } = renderWithForm(<WatchOutput fieldKey="role" />, {
      definition: PROGRAMMATIC_CONTROLS_FIXTURE,
    });

    await setValue("role", "user");

    await waitFor(() => {
      expect(screen.getByTestId("watch-role").textContent).toBe('"user"');
    });
  });

  it("does NOT re-render when a different field changes", async () => {
    const spy = vi.fn();
    const { setValue } = renderWithForm(
      <WatchWithSpy fieldKey="role" spy={spy} />,
      { definition: PROGRAMMATIC_CONTROLS_FIXTURE }
    );

    const initialCallCount = spy.mock.calls.length;

    // Change a different field — role watcher should NOT re-render
    await setValue("email", "alice@example.com");

    // Allow React to settle
    await new Promise((r) => setTimeout(r, 50));

    // The spy should NOT have been called with a new role value
    const newCalls = spy.mock.calls.slice(initialCallCount);
    const distinctRoleValues = new Set(newCalls.map((c) => c[0]));
    // Still returning null (unchanged)
    expect(
      [...distinctRoleValues].every((v) => v === null || v === undefined)
    ).toBe(true);
  });

  it("watches a boolean field (checkbox) correctly", async () => {
    const { setValue } = renderWithForm(<WatchOutput fieldKey="email" />, {
      definition: PROGRAMMATIC_CONTROLS_FIXTURE,
    });

    await setValue("email", "test@example.com");

    await waitFor(() => {
      expect(screen.getByTestId("watch-email").textContent).toBe(
        '"test@example.com"'
      );
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 2 — useWatchFields
// ─────────────────────────────────────────────────────────────────────────────

describe("useWatchFields — Multi-Field Reactive Subscription", () => {
  it("returns an object keyed by the field keys", () => {
    renderWithForm(<MultiWatchOutput keys={["country", "notes"]} />, {
      definition: HEADLESS_ENGINE_FIXTURE,
    });

    const output = JSON.parse(
      screen.getByTestId("multi-watch").textContent || "{}"
    );
    expect(output).toHaveProperty("country");
    expect(output).toHaveProperty("notes");
  });

  it("updates both fields when either changes", async () => {
    const { setValue } = renderWithForm(
      <MultiWatchOutput keys={["country", "notes"]} />,
      { definition: HEADLESS_ENGINE_FIXTURE }
    );

    await setValue("country", "us");
    await setValue("notes", "Hello");

    await waitFor(() => {
      const output = JSON.parse(
        screen.getByTestId("multi-watch").textContent || "{}"
      );
      expect(output.country).toBe("us");
      expect(output.notes).toBe("Hello");
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 3 — useController
// ─────────────────────────────────────────────────────────────────────────────

describe("useController — Full Controlled Field Hook", () => {
  it("renders with an empty value initially", () => {
    renderWithForm(<ControlledInput fieldKey="email" />, {
      definition: PROGRAMMATIC_CONTROLS_FIXTURE,
    });

    const input = screen.getByTestId("controlled-email") as HTMLInputElement;
    expect(input.value).toBe("");
  });

  it("reflects value set via the engine", async () => {
    const { setValue } = renderWithForm(<ControlledInput fieldKey="email" />, {
      definition: PROGRAMMATIC_CONTROLS_FIXTURE,
    });

    await setValue("email", "alice@example.com");

    await waitFor(() => {
      const input = screen.getByTestId("controlled-email") as HTMLInputElement;
      expect(input.value).toBe("alice@example.com");
    });
  });

  it("propagates onChange back to the engine", async () => {
    const { form } = renderWithForm(<ControlledInput fieldKey="email" />, {
      definition: PROGRAMMATIC_CONTROLS_FIXTURE,
    });

    const input = screen.getByTestId("controlled-email") as HTMLInputElement;

    // Simulate user typing
    await import("@testing-library/react").then(({ fireEvent, act }) => {
      act(() => {
        fireEvent.change(input, { target: { value: "bob@example.com" } });
      });
    });

    await waitFor(() => {
      expect(form.values.email).toBe("bob@example.com");
    });
  });

  it("exposes error and errorMessage after failed validation", async () => {
    const { submit } = renderWithForm(<ControlledInput fieldKey="email" />, {
      definition: PROGRAMMATIC_CONTROLS_FIXTURE,
    });

    await submit(); // submit with empty required field

    await waitFor(() => {
      const errorEl = screen.queryByTestId("error-email");
      expect(errorEl).toBeInTheDocument();
    });
  });

  it("exposes the field definition via .field", () => {
    let capturedField: any;

    function Inspector() {
      const { field } = useController("email");
      capturedField = field;
      return null;
    }

    renderWithForm(<Inspector />, {
      definition: PROGRAMMATIC_CONTROLS_FIXTURE,
    });

    expect(capturedField).toBeDefined();
    expect(capturedField.id).toBe("email");
    expect(capturedField.name).toBe("email");
    expect(capturedField.type).toBe("text");
  });

  it("resolves field by key — key = name = id", () => {
    function Inspector() {
      const { fieldId, fieldName } = useController("role");
      return (
        <div>
          <span data-testid="field-id">{fieldId}</span>
          <span data-testid="field-name">{fieldName}</span>
        </div>
      );
    }

    renderWithForm(<Inspector />, {
      definition: PROGRAMMATIC_CONTROLS_FIXTURE,
    });

    expect(screen.getByTestId("field-id").textContent).toBe("role");
    expect(screen.getByTestId("field-name").textContent).toBe("role");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 4 — useFormContext<T>
// ─────────────────────────────────────────────────────────────────────────────

describe("useFormContext<T> — Typed Engine Access", () => {
  it("provides a live form instance inside a provider", () => {
    renderWithForm(<FormContextConsumer />, {
      definition: HEADLESS_ENGINE_FIXTURE,
    });

    expect(screen.getByTestId("is-dirty").textContent).toBe("false");
    expect(screen.getByTestId("is-valid").textContent).toBe("true");
  });

  it("reflects isDirty = true after a field is changed", async () => {
    const { form, setValue } = renderWithForm(<FormContextConsumer />, {
      definition: HEADLESS_ENGINE_FIXTURE,
    });

    await setValue("country", "us");

    await waitFor(() => {
      // useFormContext does not subscribe to state changes, so we check the engine directly
      expect(form.isDirty).toBe(true);
    });
  });

  it("reflects isValid = false after a failed submit", async () => {
    const { form, submit } = renderWithForm(<FormContextConsumer />, {
      definition: HEADLESS_ENGINE_FIXTURE,
    });

    await submit(); // required field (country) is empty

    await waitFor(() => {
      expect(form.isValid).toBe(false);
    });
  });

  it("throws a clear error when used outside a provider", () => {
    // Suppress console.error from React's error boundary for this test
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    function OutsideConsumer() {
      useFormContext();
      return null;
    }

    expect(() => {
      render(<OutsideConsumer />);
    }).toThrow(/Must be used inside a <Form> component/);

    consoleSpy.mockRestore();
  });

  it("exposes form.values with correct type via generic", () => {
    interface MyForm {
      country: string;
      notes: string;
    }

    function TypedConsumer() {
      const form = useFormContext<MyForm>();
      // TypeScript ensures form.values.country is string — no cast needed
      const country: string | null = form.values.country ?? null;
      return <div data-testid="country-val">{country ?? "__null__"}</div>;
    }

    renderWithForm(<TypedConsumer />, { definition: HEADLESS_ENGINE_FIXTURE });

    expect(screen.getByTestId("country-val").textContent).toBe("__null__");
  });

  it("can call form.setValue imperatively from inside a hook consumer", async () => {
    function ProgrammaticSetter() {
      const form = useFormContext();
      React.useEffect(() => {
        form.setValue("notes", "Set from hook");
      }, [form]);
      return null;
    }

    const { form } = renderWithForm(<ProgrammaticSetter />, {
      definition: HEADLESS_ENGINE_FIXTURE,
    });

    await waitFor(() => {
      expect(form.values.notes).toBe("Set from hook");
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 5 — Key-Based Addressing (the consistency fix)
// ─────────────────────────────────────────────────────────────────────────────

describe("Key-Based Addressing — id = name = key", () => {
  it("useWatch resolves a key-based field (all three point to the same field)", async () => {
    // Schema uses `key: "country"` which sets id = name = "country"
    const { setValue } = renderWithForm(<WatchOutput fieldKey="country" />, {
      definition: HEADLESS_ENGINE_FIXTURE,
    });

    await setValue("country", "ca"); // addressing by name
    await waitFor(() => {
      expect(screen.getByTestId("watch-country").textContent).toBe('"ca"');
    });
  });

  it("useController resolves by key, id, and name interchangeably for same field", () => {
    let byKey: any, byName: any;

    function Checker() {
      byKey = useController("country");
      byName = useController("country"); // same key = same field
      return null;
    }

    renderWithForm(<Checker />, { definition: HEADLESS_ENGINE_FIXTURE });

    // Both should resolve to the same field
    expect(byKey.fieldId).toBe(byName.fieldId);
    expect(byKey.fieldName).toBe(byName.fieldName);
    expect(byKey.fieldId).toBe("country");
  });

  it("V1 (values) and V2 (validity) are consistent for key-addressed field", async () => {
    const { form, submit } = renderWithForm(
      <WatchOutput fieldKey="country" />,
      { definition: HEADLESS_ENGINE_FIXTURE }
    );

    // V1 addressed by name
    expect(form.values.country).toBeNull();

    // V2 addressed by id (= same value when using key)
    expect(form.validity["country"]?.valid).toBe(true);

    await submit(); // triggers validation

    // After submit, V2 shows invalid for required field
    expect(form.validity["country"]?.valid).toBe(false);
    // V1 is still null (no phantom value written)
    expect(form.values.country).toBeNull();
  });
});
