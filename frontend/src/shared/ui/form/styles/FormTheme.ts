/**
 * FormTheme — Re-exported from global tokens.
 *
 * The FormTheme interface and DEFAULT_FORM_THEME are kept for backward compatibility.
 * New code should import directly from `@shared/theme` (tokens.form.*).
 *
 * @deprecated Import from `@shared/theme` instead.
 */
import { tokens } from "@shared/theme";

export interface FormTheme {
  density: "compact" | "comfortable" | "spacious";
  radius: "none" | "small" | "medium" | "large" | "full" | "default";
  motion: boolean;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    border: string;
    text: {
      primary: string;
      secondary: string;
      inverse: string;
    };
    error: string;
    success: string;
    warning: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    xxl: string;
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
    full: string;
  };
  typography: {
    fontFamily: string;
    fontSize: {
      sm: string;
      base: string;
      lg: string;
      xl: string;
    };
  };
  components?: {
    input?: {
      variants?: {
        outlined?: ComponentStateStyles;
        filled?: ComponentStateStyles;
        underlined?: ComponentStateStyles;
      };
    };
    label?: {
      base: string;
      requiredIndicator?: string;
    };
    helpText?: {
      base: string;
    };
    error?: {
      base: string;
      summary?: {
        container?: string;
        list?: string;
        item?: string;
      };
    };
    actions?: {
      base?: string;
      submitButton?: string;
      cancelButton?: string;
    };
    status?: Record<string, string>;
    popover?: {
      container?: string;
      option?: string;
      optionSelected?: string;
      optionActive?: string;
    };
    controls?: Record<string, any>;
    detail?: Record<string, any>;
    section?: {
      title: string;
      description: string;
      card: string;
      header: string;
      content: string;
      variants?: Record<
        string,
        {
          base?: string;
          header?: string;
          title?: string;
          description?: string;
          content?: string;
        }
      >;
    };
    shell?: {
      header?: ShellStyles;
      body?: ShellStyles;
      footer?: ShellStyles;
      stepper?: ShellStyles;
    };
  };
}

export interface ShellStyles {
  padding?: string;
  margin?: string;
  background?: string;
  border?: string;
  shadow?: string;
  className?: string;
}

export interface ComponentStateStyles {
  base: string;
  hover?: string;
  focus?: string;
  error?: string;
}

const formTokens = tokens.form;

export const DEFAULT_FORM_THEME: FormTheme = {
  density: "comfortable",
  radius: "large",
  motion: true,
  colors: {
    primary: "var(--color-primary)",
    secondary: "var(--color-secondary)",
    background: "var(--color-background)",
    surface: "var(--color-surface)",
    border: "var(--color-border)",
    text: {
      primary: "var(--color-foreground)",
      secondary: "var(--text-foreground/70)",
      inverse: "var(--color-background)",
    },
    error: "var(--color-danger)",
    success: "var(--color-success)",
    warning: "var(--color-warning)",
  },
  spacing: {
    xs: "0.25rem",
    sm: "var(--space-sm)",
    md: "var(--space-md)",
    lg: "var(--space-lg)",
    xl: "var(--space-xl)",
    xxl: "4rem",
  },
  borderRadius: {
    sm: "var(--radius-sm)",
    md: "var(--radius-md)",
    lg: "var(--radius-lg)",
    full: "var(--radius-full)",
  },
  typography: {
    fontFamily: "var(--font-sans)",
    fontSize: {
      sm: "var(--text-sm)",
      base: "var(--text-base)",
      lg: "var(--text-lg)",
      xl: "var(--text-xl)",
    },
  },
  components: {
    input: {
      variants: {
        outlined: formTokens.inputVariants.outlined,
        filled: formTokens.inputVariants.filled,
        underlined: formTokens.inputVariants.underlined,
      },
    },
    label: {
      base: "block font-semibold text-foreground/80 mb-1.5 leading-snug",
    },
    helpText: {
      base: "text-[length:var(--text-xs)] text-muted mt-1",
    },
    error: {
      base: "text-[length:var(--text-xs)] text-danger font-medium mt-1.5",
    },
    actions: {
      base: formTokens.shell.actions.container,
      submitButton: formTokens.shell.actions.submit,
      cancelButton: formTokens.shell.actions.cancel,
    },
    status: formTokens.status,
    popover: formTokens.popover,
    controls: formTokens.controls,
    detail: tokens.detail,
    section: {
      title:
        "text-[length:var(--text-lg)] font-bold text-foreground tracking-tight",
      description:
        "text-[length:var(--text-sm)] text-muted mt-1 leading-relaxed",
      card: "app-card",
      header: "mb-[var(--space-md)]",
      content: "flex flex-col gap-6",
      variants: {
        glass: {
          base: "z-card z-card--glass bg-surface/80 dark:bg-surface-elevated/80 backdrop-blur-2xl border border-border/50 shadow-2xl ring-1 ring-border/20",
          header:
            "px-8 py-6 border-b border-border/40 bg-surface/60 dark:bg-surface-elevated/60 rounded-t-[var(--radius-xl)]",
        },
      },
    },
    shell: {
      header: {
        padding: "py-[var(--space-md)] px-1",
        border: "border-b border-border",
        background: "bg-background/80",
        shadow: "shadow-sm",
      },
      body: {
        padding:
          "data-[layout-mode=portal]:p-0 p-[var(--space-md)] lg:p-[var(--space-xl)]",
      },
      footer: {
        padding: "py-[var(--space-md)]",
        border: "border-t border-border",
        background: "bg-background/80",
      },
      stepper: {
        margin: "mb-8",
      },
    },
  },
};
