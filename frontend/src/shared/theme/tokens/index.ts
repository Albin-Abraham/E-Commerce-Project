import { borders, radius } from "./borders";
import { colors } from "./colors";
import { density } from "./density";
import { detail, type DetailTokens } from "./detail";
import { icon, shadow } from "./elevation";
import { form, type FormInputVariant, type FormTokens } from "./forms";
import { motion } from "./motion";
import { layout, spacing } from "./spacing";
import { type TypographyPreset, typography } from "./typography";
import { zIndices } from "./z-index";

const opacity = {
  0: "0",
  10: "0.1",
  25: "0.25",
  50: "0.5",
  75: "0.75",
  90: "0.9",
  100: "1",
} as const;

const accessibility = {
  ringWidth: "2px",
  ringColor: "var(--color-primary/40)",
  ringOffset: "2px",
} as const;

const base = {
  unit: 4,
  root: 16,
} as const;

export const tokens = {
  base,
  colors,
  typography,
  spacing,
  layout,
  radius,
  borders,
  shadow,
  aspect: layout.aspect,
  breakpoints: layout.breakpoints,
  opacity,
  accessibility,
  motion,
  icon,
  zIndices,
  density,
  form,
  detail,
} as const;

export type Tokens = typeof tokens;
export type ColorToken = keyof typeof colors.ui | keyof typeof colors.brand;
export type SpacingToken = keyof typeof spacing;
export type ShadowToken = keyof typeof shadow;
export type ZIndexToken = keyof typeof zIndices;
export type DensityToken = keyof typeof density;

export {
  accessibility,
  base,
  borders,
  colors,
  density,
  detail,
  type DetailTokens,
  form,
  type FormInputVariant,
  type FormTokens,
  icon,
  layout,
  motion,
  opacity,
  radius,
  shadow,
  spacing,
  typography,
  type TypographyPreset,
  zIndices,
};

export default tokens;
