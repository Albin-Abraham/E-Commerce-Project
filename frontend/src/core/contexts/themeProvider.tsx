"use client";
import { useEffect } from "react";

import { useThemeStore } from "@core/state/theme.store";
import { applyThemeClass } from "@libs/utils";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const mode = useThemeStore((s) => s.mode);
  const brand = useThemeStore((s) => s.brand);
  const density = useThemeStore((s) => s.density);
  const radius = useThemeStore((s) => s.radius);

  useEffect(() => {
    applyThemeClass(mode, brand, density, radius);
  }, [mode, brand, density, radius]);

  return <>{children}</>;
}
