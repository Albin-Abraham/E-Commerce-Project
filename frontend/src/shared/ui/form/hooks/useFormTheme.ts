import { useMemo } from "react";

import { useStyleAdapter } from "@ui/form/context/FormThemeContext";
import type { FormTheme } from "@ui/form/styles/FormTheme";
import { DEFAULT_FORM_THEME } from "@ui/form/styles/FormTheme";
import type { StyleAdapter } from "@ui/form/styles/style-adapter";
import { defaultTailwindAdapter } from "@ui/form/styles/tailwind-adapter";
import type { FormDefinition } from "@ui/form/types";

export interface ThemeResult {
  activeTheme: FormTheme;
  adapter: StyleAdapter;
  slots: ReturnType<StyleAdapter["buildShellStyles"]>;
  actionClasses: string;
  submitBtnClass: string;
  cancelButtonClass: string;
}

export function useFormTheme(
  definition: FormDefinition<any>,
  theme?: FormTheme,
  adapterOverride?: StyleAdapter
): ThemeResult {
  const contextAdapter = useStyleAdapter();
  const adapter = adapterOverride || contextAdapter || defaultTailwindAdapter;

  const activeTheme = useMemo(() => {
    const baseTheme = theme || DEFAULT_FORM_THEME;
    const settings = (definition as any).settings || {};
    const isDrawer = settings.layoutMode === "drawer";
    const density = isDrawer
      ? "compact"
      : settings.density || baseTheme.density || "comfortable";

    return {
      ...baseTheme,
      density,
      radius: baseTheme.radius || "large",
    };
  }, [theme, definition]);

  const slots = useMemo(
    () => adapter.buildShellStyles(definition as any, activeTheme),
    [adapter, definition, activeTheme]
  );

  const actionStyles = useMemo(
    () => adapter.buildActionStyles(definition as any, activeTheme),
    [adapter, definition, activeTheme]
  );

  return {
    activeTheme,
    adapter,
    slots,
    actionClasses: actionStyles.base,
    submitBtnClass: actionStyles.submitButton,
    cancelButtonClass: actionStyles.cancelButton,
  };
}
