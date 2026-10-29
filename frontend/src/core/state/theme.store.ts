import { create } from "zustand";
import { persist } from "zustand/middleware";

import {
  applyThemeClass,
  type ThemeBrand,
  type ThemeDensity,
  type ThemeMode,
  type ThemeRadius,
} from "@libs/utils";

export interface ThemeState {
  mode: ThemeMode;
  brand: ThemeBrand;
  density: ThemeDensity;
  radius: ThemeRadius;
  toggleTheme: () => void;
  setMode: (mode: ThemeMode) => void;
  setBrand: (brand: ThemeBrand) => void;
  setDensity: (density: ThemeDensity) => void;
  setRadius: (radius: ThemeRadius) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: "light",
      brand: "zenith",
      density: "comfortable",
      radius: "rounded",

      toggleTheme: () => {
        const nextMode = get().mode === "light" ? "dark" : "light";
        set({ mode: nextMode });
        applyThemeClass(nextMode, get().brand, get().density, get().radius);
      },

      setMode: (mode) => {
        set({ mode });
        applyThemeClass(mode, get().brand, get().density, get().radius);
      },

      setBrand: (brand) => {
        set({ brand });
        applyThemeClass(get().mode, brand, get().density, get().radius);
      },

      setDensity: (density) => {
        set({ density });
        applyThemeClass(get().mode, get().brand, density, get().radius);
      },

      setRadius: (radius) => {
        set({ radius });
        applyThemeClass(get().mode, get().brand, get().density, radius);
      },
    }),
    {
      name: "theme-preference",
      onRehydrateStorage: () => (state) => {
        if (state) {
          applyThemeClass(state.mode, state.brand, state.density, state.radius);
        }
      },
    }
  )
);
