import { schemaRegistry } from "@form-core/SchemaRegistry";
import type { FormDefinition } from "@ui/form/types";
import type { EntityDefinition } from "@ui/form/types/application";
import { fuseSchema } from "@ui/form/utils/schema-fusion";

import {
  buildLoginEntity,
  buildSignupEntity,
  buildForgotPasswordEntity,
  type AuthTranslator,
} from "./auth-logical";
import type { AuthModeToggleProps } from "./auth-types";

/**
 * ── TRUE MDAP COMPILER ───────────────────────────────────────────────────────
 *
 * Consumes a complete 6-Layer MDAP Entity (Content, Behavior, Surface, Presentation)
 * and compiles it down into a flattened runtime FormDefinition.
 */
export function compileEntityToFormDef<T extends Record<string, any>>(
  entity: EntityDefinition<T>,
  formId: string,
  submitLabel: string
): FormDefinition<T> {
  const content = entity.content;
  const behavior = entity.behavior;
  const surface = entity.surface?.ui;
  const presentation = entity.presentation;

  // 1. Apply Behavior Pipeline Middleware & Events (from entity content — no cross-layer coupling)
  const fieldsWithBehavior = (content.sections || []).map((section) => ({
    ...section,
    fields: (section.fields ?? []).map((field) => field), // Fields carry their events from the logical layer
  }));

  const flatContent = { ...content, sections: fieldsWithBehavior };

  // 2. Map MDAP Surface & Presentation to the Fusion Engine
  const uiConfig = {
    layout: "split" as const,
    containers: surface?.containers,
    shell: surface?.shell,
    settings: {
      density: surface?.density,
      maxHeight: surface?.maxHeight,
      hideFooter: true,
    },
    style: presentation?.style,
  };

  // 3. Compile everything down to a standard FormDefinition
  const compiledForm = fuseSchema(flatContent as any, uiConfig);
  compiledForm.id = formId;
  compiledForm.submitLabel = submitLabel;

  // Attach the behavior middleware so the FormCore can execute it on submit
  // NOTE: Assigned to metadata.events (canonical path) — not root events —
  // to avoid the [FormSchema] deprecation warning from schema-compat.ts.
  if (behavior?.pipeline?.middleware) {
    // Parameter typed as the concrete `Record<string, any>` that
    // `events.onSubmit` is declared with, not as the generic `T` — an
    // unresolved type parameter is not assignable to the instantiated
    // contract, so `(data: T) => ...` failed to fit.
    const onSubmit = async (data: Record<string, any>) => {
      behavior.pipeline!.middleware!.forEach((mw) => mw(data as T));
    };
    compiledForm.metadata = {
      ...(compiledForm.metadata || {}),
      events: {
        ...compiledForm.metadata?.events,
        onSubmit,
      },
    };
  }

  return compiledForm as FormDefinition<T>;
}

export const buildLoginSchema = (
  toggleProps?: AuthModeToggleProps,
  t?: AuthTranslator
) => {
  const persona = toggleProps?.persona || "customer";
  const defaultLabel =
    persona === "staff"
      ? "Authorize & Sign In"
      : persona === "partner"
      ? "Partner Sign In"
      : t
      ? t("login.submit")
      : "Sign In";

  const formId = persona === "customer" ? "auth-login" : `auth-login-${persona}`;

  return compileEntityToFormDef(
    buildLoginEntity(toggleProps || { mode: "login", onModeChange: () => {} }, t),
    formId,
    defaultLabel
  );
};

export const buildSignupSchema = (
  toggleProps?: AuthModeToggleProps,
  t?: AuthTranslator
) => {
  const persona = toggleProps?.persona || "customer";
  const defaultLabel =
    persona === "partner"
      ? "Complete Vendor Registration"
      : t
      ? t("register.submit")
      : "Create Account";

  const formId = persona === "customer" ? "auth-signup" : `auth-signup-${persona}`;

  return compileEntityToFormDef(
    buildSignupEntity(
      toggleProps || { mode: "signup", onModeChange: () => {} },
      t
    ),
    formId,
    defaultLabel
  );
};

export const buildForgotPasswordSchema = (
  toggleProps?: AuthModeToggleProps,
  t?: AuthTranslator
) =>
  compileEntityToFormDef(
    buildForgotPasswordEntity(
      toggleProps || { mode: "forgot-password", onModeChange: () => {} },
      t
    ),
    "auth-forgot-password",
    "Send Reset Link"
  );

// Auto-register so dynamic hooks can find them
schemaRegistry.register("auth-login", buildLoginSchema as any);
schemaRegistry.register("auth-signup", buildSignupSchema as any);
schemaRegistry.register("auth-forgot-password", buildForgotPasswordSchema as any);
