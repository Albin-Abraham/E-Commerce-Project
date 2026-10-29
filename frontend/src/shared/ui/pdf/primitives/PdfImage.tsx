/**
 * PdfImage — Image display primitive
 *
 * GoF — Proxy: wraps @react-pdf Image with safe defaults.
 */
import React from "react";

import { Image } from "@react-pdf/renderer";

import { usePdfTheme } from "../core/PdfThemeContext";

interface PdfImageProps {
  src: string;
  width?: number;
  height?: number;
  fit?: "contain" | "cover";
  radius?: number;
}

export const PdfImage: React.FC<PdfImageProps> = ({
  src,
  width,
  height,
  fit = "contain",
  radius = 0,
}) => {
  const theme = usePdfTheme();
  return (
    <Image
      src={src}
      style={{
        width,
        height,
        objectFit: fit,
        borderRadius: radius,
        backgroundColor: theme.colors.surface,
      }}
    />
  );
};
