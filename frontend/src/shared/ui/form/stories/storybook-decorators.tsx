/**
 * @file storybook-decorators.tsx
 * @description Storybook decorators providing Phase 1 runtime environment.
 *
 * Wraps stories in `FormRuntimeProvider` and `FormOrchestratorProvider` so that:
 * 1. Wrapped field components (`FormTextField`, etc.) resolve DCS themes, tokens, and density.
 * 2. Icons resolve through Lucide icon registries.
 * 3. Validation errors, labels, tooltips, and help text render accurately.
 *
 * @module StorybookDecorators
 */
import type { Decorator } from "@storybook/react";

import { manifestRegistry } from "@form-core/ManifestRegistry";
import { FormOrchestratorProvider } from "../context/FormOrchestratorContext";
import { FormThemeProvider } from "../context/FormThemeContext";
import { defaultRegistry } from "../fields/lazy-registry-builder";

/**
 * Storybook decorator supplying runtime context with Theme and Orchestrator.
 */
export const FormRuntimeDecorator: Decorator = (Story, context) => {
  const density = (context.args?.density as "compact" | "comfortable" | "spacious") || "comfortable";
  const mode = (context.args?.mode as "edit" | "view") || "edit";
  const theme = (context.globals?.theme as "light" | "dark") || "light";
  const isDark = theme === "dark";

  return (
    <FormThemeProvider>
      <FormOrchestratorProvider
        value={{
          mode,
          density,
          registry: {
            registry: defaultRegistry,
            form: null as any,
            debug: false,
          },
          manifest: { manifestRegistry },
        }}
      >
        <div
          className={`p-6 max-w-lg mx-auto w-full transition-all bg-background text-foreground ${isDark ? "dark" : ""}`}
          data-density={density}
          data-theme={theme}
        >
          <Story />
        </div>
      </FormOrchestratorProvider>
    </FormThemeProvider>
  );
};
