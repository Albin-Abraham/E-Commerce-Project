import { describe, expect, it } from "vitest";

import {
  assertValidFormDefinition,
  validateFormDefinition,
} from "../form-config-validator";

describe("form-config-validator", () => {
  it("validates a valid FormDefinition successfully", () => {
    const validDefinition = {
      id: "user-profile-form",
      title: "User Profile",
      fields: [
        { id: "firstName", name: "firstName", type: "text", label: "First Name" },
        { id: "email", name: "email", type: "email", label: "Email Address" },
      ],
      style: {
        themeBrand: "zenith",
        density: "comfortable",
        surfaceVariant: "card",
      },
    };

    const result = validateFormDefinition(validDefinition);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
  });

  it("detects missing form id as a validation error", () => {
    const invalidDef = {
      title: "No ID Form",
      fields: [{ id: "name", type: "text" }],
    };

    const result = validateFormDefinition(invalidDef);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("id"))).toBe(true);
  });

  it("detects duplicate field identifiers", () => {
    const duplicateDef = {
      id: "duplicate-fields-form",
      fields: [
        { id: "email", type: "text" },
        { id: "email", type: "text" },
      ],
    };

    const result = validateFormDefinition(duplicateDef);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("Duplicate field identifier"))).toBe(true);
  });

  it("emits warnings when deprecated raw hex colors are used in style", () => {
    const hexDef = {
      id: "hex-style-form",
      fields: [{ id: "fullName", type: "text" }],
      style: {
        primaryColor: "#2563eb",
        backgroundColor: "#ffffff",
      },
    };

    const result = validateFormDefinition(hexDef);
    expect(result.valid).toBe(true);
    expect(result.warnings.some((w) => w.includes("#2563eb"))).toBe(true);
    expect(result.warnings.some((w) => w.includes("#ffffff"))).toBe(true);
  });

  it("throws error in assertValidFormDefinition when invalid", () => {
    expect(() => {
      assertValidFormDefinition({ id: "" });
    }).toThrowError(/FormConfigValidationError/);
  });
});
