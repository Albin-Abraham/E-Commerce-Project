import { type ClassValue, clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

const customTwMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "semantic-typography": [
        "text-display",
        "text-heading-1",
        "text-heading-2",
        "text-heading-3",
        "text-heading-4",
        "text-body-lg",
        "text-body-md",
        "text-body-sm",
        "text-label-lg",
        "text-label-md",
        "text-label-sm",
        "text-caption",
        "text-code",
      ],
    },
  },
});

// -------------- Tailwindcss clsx and tailwiind-css utilty fn --------------
export function cn(...classes: ClassValue[]) {
  return customTwMerge(clsx(classes));
}

export type ThemeMode = "light" | "dark";
export type ThemeBrand = "zenith" | "emerald" | "obsidian" | "corporate";
export type ThemeDensity = "compact" | "comfortable" | "spacious";
export type ThemeRadius = "sharp" | "rounded" | "pill";

export interface ThemeConfig {
  mode: ThemeMode;
  brand: ThemeBrand;
  density: ThemeDensity;
  radius: ThemeRadius;
}

const BRAND_PALETTES: Record<ThemeBrand, { primary: string; primaryRgb: string }> = {
  zenith: {
    primary: "#2563eb",
    primaryRgb: "37, 99, 235",
  },
  emerald: {
    primary: "#059669",
    primaryRgb: "5, 150, 105",
  },
  obsidian: {
    primary: "#8b5cf6",
    primaryRgb: "139, 92, 246",
  },
  corporate: {
    primary: "#4f46e5",
    primaryRgb: "79, 70, 229",
  },
};

const RADIUS_PRESETS: Record<ThemeRadius, { lg: string; xl: string }> = {
  sharp: {
    lg: "0.125rem",
    xl: "0.25rem",
  },
  rounded: {
    lg: "0.75rem",
    xl: "1.5rem",
  },
  pill: {
    lg: "9999px",
    xl: "9999px",
  },
};

// -------------- Theme Class Application --------------
export const applyThemeClass = (
  mode: ThemeMode,
  brand: ThemeBrand = "zenith",
  density: ThemeDensity = "comfortable",
  radius: ThemeRadius = "rounded"
) => {
  if (typeof document === "undefined") return;
  const root = document.documentElement;

  // 1. Dark mode toggle
  root.classList.toggle("dark", mode === "dark");

  // 2. Data attributes for density and brand
  root.setAttribute("data-density", density);
  root.setAttribute("data-brand", brand);
  root.setAttribute("data-radius", radius);

  // 3. Dynamic brand color injection
  const brandColors = BRAND_PALETTES[brand] || BRAND_PALETTES.zenith;
  root.style.setProperty("--color-primary", brandColors.primary);
  root.style.setProperty("--color-primary-rgb", brandColors.primaryRgb);

  // 4. Radius preset injection
  const radiusTokens = RADIUS_PRESETS[radius] || RADIUS_PRESETS.rounded;
  root.style.setProperty("--radius-lg", radiusTokens.lg);
  root.style.setProperty("--radius-xl", radiusTokens.xl);
};
// --------------------------- End ------------------------------------
