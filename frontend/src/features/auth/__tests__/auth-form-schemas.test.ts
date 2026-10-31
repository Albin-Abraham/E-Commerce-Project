import { describe, expect, it } from "vitest";
import {
  buildLoginSchema,
  buildSignupSchema,
  buildForgotPasswordSchema,
} from "@shell/pages/static-pages/configs/auth-schema";
import { schemaRegistry } from "@form-core/SchemaRegistry";

describe("User Identity Form Architecture (Login, Register, ForgotPassword)", () => {
  it("compiles Login form schema with form architecture contracts", () => {
    const schema = buildLoginSchema({ mode: "login", onModeChange: () => {} });
    expect(schema.id).toBe("auth-login");
    expect(schema.submitLabel).toBe("Sign In");

    const fields = schema.sections?.[0]?.fields ?? [];
    const fieldIds = fields.map((f: any) => f.id);
    expect(fieldIds).toContain("username");
    expect(fieldIds).toContain("password");
    expect(fieldIds).toContain("forgot-password-link");
    expect(fieldIds).toContain("submit-btn");
  });

  it("compiles Register form schema with full name and confirmation", () => {
    const schema = buildSignupSchema({ mode: "signup", onModeChange: () => {} });
    expect(schema.id).toBe("auth-signup");
    expect(schema.submitLabel).toBe("Create Account");

    const fields = schema.sections?.[0]?.fields ?? [];
    const fieldIds = fields.map((f: any) => f.id);
    expect(fieldIds).toContain("name");
    expect(fieldIds).toContain("username");
    expect(fieldIds).toContain("password");
    expect(fieldIds).toContain("confirm_password");
  });

  it("compiles ForgotPassword form schema with recovery instructions", () => {
    const schema = buildForgotPasswordSchema({
      mode: "forgot-password",
      onModeChange: () => {},
    });
    expect(schema.id).toBe("auth-forgot-password");
    expect(schema.submitLabel).toBe("Send Reset Link");

    const fields = schema.sections?.[0]?.fields ?? [];
    const fieldIds = fields.map((f: any) => f.id);
    expect(fieldIds).toContain("header");
    expect(fieldIds).toContain("username");
    expect(fieldIds).toContain("submit-btn");
    expect(fieldIds).toContain("back-link");
  });

  it("auto-registers schemas in schemaRegistry", () => {
    expect(schemaRegistry.has("auth-login")).toBe(true);
    expect(schemaRegistry.has("auth-signup")).toBe(true);
    expect(schemaRegistry.has("auth-forgot-password")).toBe(true);
  });
});
