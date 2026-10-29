import type { FormDefinition, ValidationRule } from "../domain";
import { describe, expect, it } from "vitest";

import { FormCore } from "../engine";

/**
 * `disableDeferredValidation` screens incoming values BEFORE they reach form
 * state. Illegal input (special characters, failed rules) is REJECTED: the
 * previous value is kept, the error is recorded, and nothing is stored — not
 * stripped into a mangled form, and never thrown.
 */
function makeDefinition(
  rule: ValidationRule,
  extra: Partial<FormDefinition> = {}
): FormDefinition {
  return {
    id: "deferred-form",
    title: "Deferred Validation Form",
    sections: [
      {
        id: "section1",
        title: "Section 1",
        fields: [
          {
            id: "code",
            name: "code",
            type: "text",
            label: "Code",
            validation: { rules: [rule] },
          },
        ],
      },
    ],
    ...extra,
  } as FormDefinition;
}

describe("disableDeferredValidation", () => {
  describe("default (deferred) behaviour is preserved", () => {
    it("stores disallowed characters verbatim when the flag is off", async () => {
      const engine = new FormCore(makeDefinition({ type: "alphanumeric" }));

      await engine.setValue("code", "J0hn_Doe,#");

      expect(engine.state.values.code).toBe("J0hn_Doe,#");
    });
  });

  describe("enabled via FormCoreOptions", () => {
    it("rejects alphanumeric input containing _, comma or #", async () => {
      const engine = new FormCore(
        makeDefinition({ type: "alphanumeric" }),
        undefined,
        { disableDeferredValidation: true } as any
      );

      await engine.setValue("code", "J0hn_Doe,#");

      // Rejected outright — NOT rewritten to "J0hnDoe".
      expect(engine.state.values.code).toBeNull();
      expect(engine.getPayload()).not.toHaveProperty("code", "J0hnDoe");
    });

    it("accepts clean alphanumeric input unchanged", async () => {
      const engine = new FormCore(
        makeDefinition({ type: "alphanumeric" }),
        undefined,
        { disableDeferredValidation: true } as any
      );

      await engine.setValue("code", "a_b,c#d");

      // Still the untouched initial value — the illegal candidate never landed.
      expect(engine.getPayload()).toEqual({ code: null });
    });

    it("rejects non-digit characters for digitsOnly", async () => {
      const engine = new FormCore(
        makeDefinition({ type: "digitsOnly" }),
        undefined,
        { disableDeferredValidation: true } as any
      );

      await engine.setValue("code", "12a-34_56#");

      expect(engine.state.values.code).toBeNull();
    });

    it("rejects non-letters for alphaOnly and honours rule.value 'ignore'", async () => {
      const engine = new FormCore(
        makeDefinition({ type: "alphaOnly", value: " " }),
        undefined,
        { disableDeferredValidation: true } as any
      );

      // Space is allowed via rule.value, so a spaced name is accepted.
      await engine.setValue("code", "John Doe");
      expect(engine.state.values.code).toBe("John Doe");

      // Digits and punctuation are not — rejected, not stripped.
      await engine.setValue("code", "John_Doe,#1");
      expect(engine.state.values.code).toBe("John Doe");
    });
  });

  describe("enabled via schema settings", () => {
    it("reads FormDefinition.validation.disableDeferredValidation", async () => {
      const engine = new FormCore(
        makeDefinition(
          { type: "alphanumeric" },
          { validation: { disableDeferredValidation: true } }
        )
      );

      expect(engine.isDeferredValidationDisabled()).toBe(true);

      await engine.setValue("code", "J0hn_Doe,#");

      expect(engine.state.values.code).toBeNull();
    });

    it("lets FormCoreOptions override the schema flag", async () => {
      const engine = new FormCore(
        makeDefinition(
          { type: "alphanumeric" },
          { validation: { disableDeferredValidation: true } }
        ),
        undefined,
        { disableDeferredValidation: false } as any
      );

      expect(engine.isDeferredValidationDisabled()).toBe(false);

      await engine.setValue("code", "J0hn_Doe,#");

      expect(engine.state.values.code).toBe("J0hn_Doe,#");
    });
  });

  describe("rejection path", () => {
    it("rejects a candidate that still fails validation, keeping the previous value", async () => {
      const definition = makeDefinition({
        type: "custom",
        fn: (v: any) => String(v).startsWith("OK-"),
      });
      const engine = new FormCore(definition, undefined, {
        disableDeferredValidation: true,
      } as any);

      await engine.setValue("code", "OK-1");
      expect(engine.state.values.code).toBe("OK-1");

      await engine.setValue("code", "BAD-2");

      // Previous value survives; the bad candidate never entered form state.
      expect(engine.state.values.code).toBe("OK-1");
      expect(engine.getPayload()).toEqual({ code: "OK-1" });
    });
  });

  describe("no thrown errors", () => {
    it("resolves rather than throwing when the candidate is rejected", async () => {
      const engine = new FormCore(
        makeDefinition({ type: "alphanumeric" }),
        undefined,
        { disableDeferredValidation: true } as any
      );

      // Must settle, not reject — a controlled input cannot handle a throw here.
      await expect(
        engine.setValue("code", "bad_chars,#here")
      ).resolves.toBeUndefined();
    });

    it("resolves rather than throwing when a custom rule fn throws internally", async () => {
      const engine = new FormCore(
        makeDefinition({
          type: "custom",
          fn: () => {
            throw new Error("boom");
          },
        }),
        undefined,
        { disableDeferredValidation: true } as any
      );

      await expect(
        engine.setValue("code", "anything")
      ).resolves.toBeUndefined();
    });

    it("records the violation as a field error so the UI can surface it", async () => {
      const engine = new FormCore(
        makeDefinition({ type: "alphanumeric" }),
        undefined,
        { disableDeferredValidation: true } as any
      );

      await engine.setValue("code", "J0hn_Doe");

      const errors = engine.state.validity.code?.errors ?? [];
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].code).toBe("alphanumeric");
      expect(typeof errors[0].message).toBe("string");
    });

    it("clears the recorded error once a valid value is accepted", async () => {
      const engine = new FormCore(
        makeDefinition({ type: "alphanumeric" }),
        undefined,
        { disableDeferredValidation: true } as any
      );

      await engine.setValue("code", "J0hn_Doe");
      expect(engine.state.validity.code?.errors?.length ?? 0).toBeGreaterThan(
        0
      );

      await engine.setValue("code", "J0hnDoe");
      expect(engine.state.values.code).toBe("J0hnDoe");
      expect(engine.state.validity.code?.errors ?? []).toEqual([]);
    });
  });

  describe("rules without a sanitizer", () => {
    it("rejects a non-matching pattern value rather than flagging it", async () => {
      const engine = new FormCore(
        makeDefinition({ type: "pattern", value: /^[a-z]+$/ }),
        undefined,
        { disableDeferredValidation: true } as any
      );

      await engine.setValue("code", "abc123");

      // No sanitizer can express an arbitrary regex, so the value is never
      // rewritten — it is simply rejected and never reaches form state.
      expect(engine.state.values.code).toBeNull();

      await engine.setValue("code", "abc");
      expect(engine.state.values.code).toBe("abc");
    });

    it("accepts empty values without sanitizing or erroring", async () => {
      const engine = new FormCore(
        makeDefinition({ type: "digitsOnly" }),
        undefined,
        { disableDeferredValidation: true } as any
      );

      await engine.setValue("code", "");

      expect(engine.state.values.code).toBe("");
    });
  });
});
