/**
 * ZENITH SEMANTIC TOKEN REGISTRY
 *
 * Responsibility: Decouple the Form Engine from concrete styling libraries (Tailwind).
 * Every visual property in the engine references a semantic token key from @shared/theme.
 */
import { tokens } from "@shared/theme";

export const ZENITH_TOKENS = {
  // Surface & Containers
  surface: {
    base: tokens.form.surface.base,
    subtle: tokens.form.surface.subtle,
    card: tokens.form.surface.card,
    glass:
      "bg-surface/80 dark:bg-surface-elevated/80 backdrop-blur-md border border-border/60 shadow-xl rounded-2xl",
  },

  // Field Atmosphere (OuterWrapper)
  field: {
    shell: tokens.form.field.shell,
    ring: {
      idle: tokens.form.field.ring.idle,
      focus: tokens.form.field.ring.focus,
      error: tokens.form.field.ring.error,
    },
    surface: {
      idle: tokens.form.field.surface.idle,
      active: tokens.form.field.surface.active,
    },
  },

  // Typography
  text: tokens.form.text,

  // Input Components
  input: tokens.form.input,

  // Interaction
  animation: tokens.form.animation,

  // Status & Controls
  status: tokens.form.status,
  controls: tokens.form.controls,
  popover: tokens.form.popover,
  spinners: tokens.form.spinners,
  shell: tokens.form.shell,
  detail: tokens.detail,
} as const;

export type ZenithToken = typeof ZENITH_TOKENS;
