/**
 * ZenOS PDF Engine — Public API
 *
 * Single barrel export. Consumers import only from "@ui/pdf".
 * Internal modules are NOT re-exported — this enforces encapsulation.
 */

// Core
export { PdfEngine } from "./core/PdfEngine";
export { PdfPage } from "./core/PdfPage";
export { PdfThemeProvider, usePdfTheme } from "./core/PdfThemeContext";
export { PdfPageProvider, usePdfPage } from "./core/PdfPageContext";
export { PdfLayoutProvider, usePdfLayout } from "./core/PdfLayoutContext";

// Primitives
export { PdfText } from "./primitives/PdfText";
export { PdfRow, PdfCol } from "./primitives/PdfRow";
export { PdfBox } from "./primitives/PdfBox";
export { PdfGrid } from "./primitives/PdfGrid";
export { PdfTable } from "./primitives/PdfTable";
export { PdfImage } from "./primitives/PdfImage";
export { PdfDivider, PdfBadge, PdfSpacer } from "./primitives/PdfAtoms";

// Runtime & Token Resolver
export {
  interpolateDocumentTokens,
  resolveTokenPath,
} from "./runtime/document.token-resolver";
export type {
  DocumentRuntimeContext,
  DocumentPaginationRules,
  BoxNodeDefinition,
  DocumentLayoutDirection,
} from "./runtime/document.runtime.types";

// Parser / Renderer
export {
  PdfNodeRenderer,
  registerPdfNodeRenderer,
} from "./parser/PdfNodeRenderer";

// Mapper contracts
export type { IPdfMapper } from "./mappers/pdf.mapper";
export { BasePdfMapper, PdfFormat } from "./mappers/pdf.mapper";

// Hooks
export { usePdfDownload, usePdfPreview, usePdfPreload } from "./hooks/usePdf";

// Font Registry
export { PdfFontRegistry } from "./theme/pdf.font-registry";

// Components
export { PdfDownloadButton } from "./components/PdfDownloadButton";
export type {
  PdfDownloadButtonLabels,
  PdfDownloadButtonContext,
  PdfDownloadButtonProps,
} from "./components/PdfDownloadButton";

// Types
export type {
  PdfDefinition,
  PdfPageDefinition,
  PdfSectionDefinition,
  PdfNode,
  PdfBoxNode,
  PdfTextNode,
  PdfRowNode,
  PdfColNode,
  PdfGridNode,
  PdfTableNode,
  PdfTableColumn,
  PdfImageNode,
  PdfDividerNode,
  PdfBadgeNode,
  PdfSpacerNode,
  PdfTextVariant,
  PdfAlign,
  PdfJustify,
  PdfTextAlign,
} from "./parser/pdf.schema.types";

export type { PdfTheme, PdfColorScale } from "./theme/pdf.theme";
export type { SpacingScale, PageSize, Orientation } from "./theme/pdf.tokens";
export type { PdfPageGeometry } from "./core/PdfPageContext";

