/**
 * PdfThemeContext
 *
 * SOLID — Dependency Inversion: primitives depend on this abstraction,
 *         not on concrete theme objects.
 * GoF   — Singleton (per document tree): one context instance per <PdfEngine>.
 *         Template Method: mergePdfTheme resolves the final theme from overrides.
 */
import React, { createContext, useContext } from "react";

import type { PdfTheme } from "../theme/pdf.theme";
import { defaultPdfTheme, mergePdfTheme } from "../theme/pdf.theme";

const PdfThemeContext = createContext<PdfTheme>(defaultPdfTheme);

export const PdfThemeProvider: React.FC<{
  theme?: Partial<PdfTheme>;
  children: React.ReactNode;
}> = ({ theme, children }) => {
  const resolved = mergePdfTheme(defaultPdfTheme, theme);
  return (
    <PdfThemeContext.Provider value={resolved}>
      {children}
    </PdfThemeContext.Provider>
  );
};

/** Hook — all primitives read theme through this, never import theme directly. */
export const usePdfTheme = (): PdfTheme => useContext(PdfThemeContext);
