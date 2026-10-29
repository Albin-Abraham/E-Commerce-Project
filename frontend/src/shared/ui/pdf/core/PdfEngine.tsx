/**
 * PdfEngine — Root document renderer
 *
 * SOLID — Single Responsibility: composes all contexts + renders pages.
 *         Dependency Inversion: depends on PdfDefinition abstraction, not concrete docs.
 * GoF   — Facade: single entry point hiding context composition.
 *         Builder: PdfSchemaParser.render() builds the tree from definition.
 *         Composite: renders PdfPage[] as children.
 */
import React from "react";

import { Document } from "@react-pdf/renderer";

import type { PdfDefinition } from "../parser/pdf.schema.types";
import type { PdfTheme } from "../theme/pdf.theme";
import { PdfPage } from "./PdfPage";
import { PdfThemeProvider } from "./PdfThemeContext";

interface PdfEngineProps {
  definition: PdfDefinition;
  theme?: Partial<PdfTheme>;
}

/**
 * PdfEngine is the renderable root.
 * Pass to `pdf(<PdfEngine ... />).toBlob()` or `<PDFViewer>`.
 */
export const PdfEngine: React.FC<PdfEngineProps> = ({ definition, theme }) => {
  const mergedTheme = {
    ...(definition.theme ?? {}),
    ...(theme ?? {}),
  } as Partial<PdfTheme>;

  return (
    <PdfThemeProvider theme={mergedTheme}>
      <Document
        title={definition.meta?.title ?? definition.id}
        author={definition.meta?.author ?? "ZenOS"}
        subject={definition.meta?.subject ?? ""}
        keywords={definition.meta?.keywords ?? ""}
        creator="ZenOS PDF Engine"
        producer="@react-pdf/renderer"
      >
        {definition.pages.map((page, i) => (
          <PdfPage key={i} config={page} />
        ))}
      </Document>
    </PdfThemeProvider>
  );
};
