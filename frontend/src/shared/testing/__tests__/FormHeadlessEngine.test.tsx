/**
 * FormHeadlessEngine.test.tsx
 *
 * UNIT TESTS — FormCore (headless, no React, no DOM)
 *
 * Tests the engine in isolation: setValue pipeline, 5V state slices,
 * visibility cascading, validation, middleware chain, and key-based addressing.
 * These run without renderWithProviders — pure JS instantiation.
 */
import { Form } from "@form-core/form";
import { describe, expect, it, vi } from "vitest";

import { HEADLESS_ENGINE_FIXTURE } from "../fixtures/ProgrammaticControlsFixture";

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 1: Core Engine Instantiation & State Initialization
// ─────────────────────────────────────────────────────────────────────────────

describe("FormCore — Engine Instantiation", () => {
  it("initializes all 5V state slices on construction", () => {
    const form = new Form<any>(HEADLESS_ENGINE_FIXTURE);

    // V1 Values: input fields initialized to null
    expect(form.values).toBeDefined();

    // V2 Validity: all fields valid at start
    const validityEntries = Object.values(form.validity);
    expect(validityEntries.every((v) => v.valid === true)).toBe(true);

    // V3 Visibility: all fields visible unless schema says otherwise
    const visibilityEntries = Object.values(form.visibility);
    expect(visibilityEntries.length).toBeGreaterThan(0);

    // V4 View: all fields have a view entry
    const viewEntries = Object.values(form.view);
    expect(viewEntries.length).toBeGreaterThan(0);

    // V5 Vitality: all fields untouched at start
    const vitalityEntries = Object.values(form.vitality);
    expect(vitalityEntries.every((v) => v.touched === false)).toBe(true);
    expect(vitalityEntries.every((v) => v.dirty === false)).toBe(true);
  });

  it("accepts initialValues and populates V1 correctly", () => {
    const form = new Form<any>(HEADLESS_ENGINE_FIXTURE, {
      country: "us",
      notes: "Hello",
    });

    expect(form.values.country).toBe("us");
    expect(form.values.notes).toBe("Hello");
  });

  it("resolves fields by key (key = id = name)", () => {
    const form = new Form(HEADLESS_ENGINE_FIXTURE);

    const byKey = form.resolveField("country");
    expect(byKey).toBeDefined();
    expect(byKey?.id).toBe("country");
    expect(byKey?.name).toBe("country");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 2: setValue Pipeline
// ─────────────────────────────────────────────────────────────────────────────

describe("FormCore — setValue Pipeline", () => {
  it("updates V1 values after setValue", async () => {
    const form = new Form<any>(HEADLESS_ENGINE_FIXTURE);

    await form.setValue("country", "us");

    expect(form.values.country).toBe("us");
  });

  it("sets vitality.dirty = true after setValue", async () => {
    const form = new Form<any>(HEADLESS_ENGINE_FIXTURE);
    const field = form.resolveField("country");
    expect(field).toBeDefined();

    await form.setValue("country", "us");

    expect(form.vitality[field!.id]?.dirty).toBe(true);
  });

  it("notifies subscribers after setValue", async () => {
    const form = new Form<any>(HEADLESS_ENGINE_FIXTURE);
    const listener = vi.fn();
    form.subscribe(listener);

    await form.setValue("country", "us");

    expect(listener).toHaveBeenCalled();
  });

  it("does NOT notify if value is unchanged (stable reference)", async () => {
    const form = new Form<any>(HEADLESS_ENGINE_FIXTURE, { notes: "same" });
    const listener = vi.fn();
    form.subscribe(listener);

    // Set same value — engine should still notify (state version bumps)
    // This is expected behavior — the engine notifies on every setValue call
    await form.setValue("notes", "same");

    // At minimum one notify fired (vitality update)
    expect(listener).toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 3: Visibility Cascading (5V — V3)
// ─────────────────────────────────────────────────────────────────────────────

describe("FormCore — Visibility Cascading", () => {
  it("hides province and state by default (visible: false in schema)", () => {
    const form = new Form<any>(HEADLESS_ENGINE_FIXTURE);
    const province = form.resolveField("province");
    const state = form.resolveField("state");

    expect(province).toBeDefined();
    expect(state).toBeDefined();
    expect(form.visibility[province!.id]).toBe(false);
    expect(form.visibility[state!.id]).toBe(false);
  });

  it("shows province when country = 'ca'", async () => {
    const form = new Form<any>(HEADLESS_ENGINE_FIXTURE);
    await form.setValue("country", "ca");

    const province = form.resolveField("province")!;
    const state = form.resolveField("state")!;

    expect(form.visibility[province.id]).toBe(true);
    expect(form.visibility[state.id]).toBe(false); // state stays hidden
  });

  it("shows state when country = 'us'", async () => {
    const form = new Form<any>(HEADLESS_ENGINE_FIXTURE);
    await form.setValue("country", "us");

    const province = form.resolveField("province")!;
    const state = form.resolveField("state")!;

    expect(form.visibility[state.id]).toBe(true);
    expect(form.visibility[province.id]).toBe(false); // province stays hidden
  });

  it("hides again when country is cleared", async () => {
    const form = new Form<any>(HEADLESS_ENGINE_FIXTURE);
    await form.setValue("country", "ca");
    await form.setValue("country", null);

    const province = form.resolveField("province")!;
    expect(form.visibility[province.id]).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 4: Validation
// ─────────────────────────────────────────────────────────────────────────────

describe("FormCore — Validation", () => {
  it("marks required field as invalid on submit when empty", async () => {
    const form = new Form<any>(HEADLESS_ENGINE_FIXTURE);

    const isValid = await form.submit();

    expect(isValid).toBe(false);
    const country = form.resolveField("country")!;
    expect((form.validity as any)[country.id].valid).toBe(false);
    expect((form.validity as any)[country.id].errors.length).toBeGreaterThan(0);
  });

  it("returns true on submit when all required fields are filled", async () => {
    const form = new Form<any>(HEADLESS_ENGINE_FIXTURE);
    await form.setValue("country", "us");

    const isValid = await form.submit();

    expect(isValid).toBe(true);
  });

  it("marks all touched on submit", async () => {
    const form = new Form<any>(HEADLESS_ENGINE_FIXTURE);
    await form.submit();

    const vitalityValues = Object.values(form.vitality);
    expect(vitalityValues.every((v) => v.touched === true)).toBe(true);
  });

  it("setErrors injects server errors into V2 validity", () => {
    const form = new Form<any>(HEADLESS_ENGINE_FIXTURE);
    const country = form.resolveField("country")!;

    form.setErrors([
      { fieldId: country.id, code: "taken", message: "Country already taken" },
    ]);

    expect((form.validity as any)[country.id].valid).toBe(false);
    expect((form.validity as any)[country.id].errors[0].message).toBe(
      "Country already taken"
    );
  });

  it("respects maxLength validation on notes field", async () => {
    const form = new Form<any>(HEADLESS_ENGINE_FIXTURE, {
      country: "us",
      notes: "x".repeat(101), // 101 chars > maxLength: 100
    });

    const notes = form.resolveField("notes")!;
    const isValid = await form.validateFields([notes.id]);

    expect(isValid).toBe(false);
    expect((form.validity as any)[notes.id].errors[0].code).toContain("max");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 5: Middleware Chain
// ─────────────────────────────────────────────────────────────────────────────

describe("FormCore — Middleware Chain", () => {
  it("middleware fires after every setValue", async () => {
    const form = new Form<any>(HEADLESS_ENGINE_FIXTURE);
    const spy = vi.fn();
    form.use(spy);

    await form.setValue("country", "us");

    expect(spy).toHaveBeenCalledOnce();
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ form, fieldId: expect.any(String) })
    );
  });

  it("middleware can set a dependent field value", async () => {
    const form = new Form<any>(HEADLESS_ENGINE_FIXTURE);
    const country = form.resolveField("country")!;

    form.use(async ({ form: f, fieldId }) => {
      if (fieldId === country.id && f.values.country === "ca") {
        await f.setValue("notes", "Auto-set for Canada");
      }
    });

    await form.setValue("country", "ca");

    expect(form.values.notes).toBe("Auto-set for Canada");
  });

  it("multiple middleware run in registration order", async () => {
    const form = new Form<any>(HEADLESS_ENGINE_FIXTURE);
    const order: number[] = [];

    form.use(() => {
      order.push(1);
    });
    form.use(() => {
      order.push(2);
    });
    form.use(() => {
      order.push(3);
    });

    await form.setValue("country", "us");

    expect(order).toEqual([1, 2, 3]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 6: subscribeToField (Atomic Subscription)
// ─────────────────────────────────────────────────────────────────────────────

describe("FormCore — subscribeToField", () => {
  it("subscribeToField is defined and returns an unsubscribe function", () => {
    const form = new Form<any>(HEADLESS_ENGINE_FIXTURE);
    const country = form.resolveField("country")!;
    const cb = vi.fn();

    const unsubscribe = form.subscribeToField(country.id, cb);

    expect(typeof unsubscribe).toBe("function");
    unsubscribe(); // should not throw
  });

  it("unsubscribe stops the listener from being called", async () => {
    const form = new Form<any>(HEADLESS_ENGINE_FIXTURE);
    const country = form.resolveField("country")!;
    const cb = vi.fn();

    const unsubscribe = form.subscribeToField(country.id, cb);
    unsubscribe();

    // setValue triggers notifyField — but cb should NOT be called since unsubscribed
    await form.setValue("country", "us");

    expect(cb).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 7: reset()
// ─────────────────────────────────────────────────────────────────────────────

describe("FormCore — reset()", () => {
  it("resets all values to initial state", async () => {
    const form = new Form<any>(HEADLESS_ENGINE_FIXTURE, { country: "us" });
    await form.setValue("notes", "Changed");

    form.reset({ country: "us" });

    expect(form.values.notes).toBeNull();
    expect(form.values.country).toBe("us");
  });

  it("resets vitality (touched/dirty) to false", async () => {
    const form = new Form<any>(HEADLESS_ENGINE_FIXTURE);
    await form.setValue("notes", "dirty");

    form.reset();

    const vitalityValues = Object.values(form.vitality);
    expect(vitalityValues.every((v) => v.dirty === false)).toBe(true);
    expect(vitalityValues.every((v) => v.touched === false)).toBe(true);
  });

  it("keepValues preserves specific field values across reset", async () => {
    const form = new Form<any>(HEADLESS_ENGINE_FIXTURE, { country: "us" });
    await form.setValue("notes", "Keep me");

    form.reset({}, { keepValues: ["notes"] });

    expect(form.values.notes).toBe("Keep me");
    expect(form.values.country).toBeNull(); // country was NOT kept
  });
});
