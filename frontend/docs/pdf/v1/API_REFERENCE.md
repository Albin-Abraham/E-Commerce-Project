# PDF Engine API Reference

## Hooks

### `usePdfDownload(theme?)`

Generates a PDF blob and triggers a browser file download.

```typescript
const {
  downloadFromDefinition,
  isGenerating,
  error
} = usePdfDownload(theme?: Partial<PdfTheme>);
```

| Return                   | Type                                                       | Description                      |
| ------------------------ | ---------------------------------------------------------- | -------------------------------- |
| `downloadFromDefinition` | `(def: PdfDefinition, filename?: string) => Promise<void>` | Triggers generation and download |
| `isGenerating`           | `boolean`                                                  | True while the PDF is compiling  |
| `error`                  | `Error \| null`                                            | Set if generation fails          |

```tsx
const { downloadFromDefinition, isGenerating } = usePdfDownload();

downloadFromDefinition(myDefinition); // uses def.filename
downloadFromDefinition(myDefinition, "custom.pdf"); // overrides filename
```

---

### `usePdfPreview(theme?)`

Generates a PDF blob and returns an `objectUrl` for in-browser rendering.

```typescript
const {
  generate,
  objectUrl,
  isGenerating,
  error,
  clear
} = usePdfPreview(theme?: Partial<PdfTheme>);
```

| Return      | Type                                    | Description                                        |
| ----------- | --------------------------------------- | -------------------------------------------------- |
| `generate`  | `(def: PdfDefinition) => Promise<void>` | Generates and sets `objectUrl`                     |
| `objectUrl` | `string \| null`                        | Blob URL ready to mount in `<iframe>`              |
| `clear`     | `() => void`                            | Revokes the objectUrl — **always call on unmount** |

```tsx
const { generate, objectUrl, clear } = usePdfPreview();

useEffect(() => {
  generate(definition);
  return clear; // memory safety
}, [definition]);
```

---

### `usePdfPreload()`

Warms up the WASM engine and registers fonts during browser idle time. No return value.

```tsx
// Mount once in your dashboard layout shell
export function Shell({ children }) {
  usePdfPreload();
  return <>{children}</>;
}
```

---

## Components

### `<PdfDownloadButton />`

```typescript
import {
  PdfDownloadButton,
  type PdfDownloadButtonContext,
  type PdfDownloadButtonLabels,
} from "@shared/ui/pdf";
```

| Prop        | Type                                | Default     | Description                          |
| ----------- | ----------------------------------- | ----------- | ------------------------------------ |
| `onClick`   | `() => void \| Promise<void>`       | —           | Required. Triggered on click         |
| `loading`   | `boolean`                           | `false`     | Shows spinner + generating label     |
| `disabled`  | `boolean`                           | `false`     | Disables the button                  |
| `variant`   | `"primary" \| "outline" \| "ghost"` | `"outline"` | Visual style                         |
| `labels`    | `PdfDownloadButtonLabels`           | —           | Translation strings                  |
| `context`   | `PdfDownloadButtonContext`          | —           | Interpolation values for `{{token}}` |
| `className` | `string`                            | `""`        | Extra CSS classes                    |

#### `PdfDownloadButtonLabels`

| Key          | Default            | Token Support    |
| ------------ | ------------------ | ---------------- |
| `download`   | `"Download PDF"`   | ✅ `{{docName}}` |
| `generating` | `"Generating..."`  | ✅ `{{docName}}` |
| `ariaLabel`  | Same as `download` | ✅ `{{docName}}` |

#### Context-Aware Usage

```tsx
// Produces: "Download Salary Slip" / "Generating Salary Slip..."
<PdfDownloadButton
  onClick={handleDownload}
  loading={isGenerating}
  context={{ docName: t("documents.salarySlip") }}
  labels={{
    download: t("pdf.download"), // "Download {{docName}}"
    generating: t("pdf.generating"), // "Generating {{docName}}..."
  }}
/>
```

---

## Classes

### `BasePdfMapper<TRaw, TDto>`

Abstract base class implementing the Template Method pattern for PDF data mapping.

```typescript
abstract class BasePdfMapper<TRaw, TDto> implements IPdfMapper<TRaw, TDto> {
  abstract fromResponse(raw: TRaw): TDto;
  abstract toDefinition(dto: TDto): PdfDefinition;
  map(raw: TRaw): PdfDefinition; // calls fromResponse → toDefinition
}
```

```typescript
class InvoiceMapper extends BasePdfMapper<RawInvoice, InvoiceDto> {
  fromResponse(raw) { return { ...normalized }; }
  toDefinition(dto) { return { id: "invoice", pages: [...] }; }
}
export const invoiceMapper = new InvoiceMapper();
```

---

## Utilities

### `PdfFormat`

```typescript
import { PdfFormat } from "@shared/ui/pdf";
```

| Method             | Signature                                      | Output                             |
| ------------------ | ---------------------------------------------- | ---------------------------------- |
| `currency`         | `(value: number, currency?: string) => string` | `"₹50,000.00"`                     |
| `date`             | `(value: string \| Date) => string`            | `"01 Jun 2025"`                    |
| `number`           | `(value: number) => string`                    | `"50,000"`                         |
| `percent`          | `(value: number, decimals?: number) => string` | `"12.50%"`                         |
| `summaryRow`       | `(label, value, bold?) => PdfRowNode`          | Two-column label+value row node    |
| `companyHeader`    | `(title, subtitle?) => PdfNode[]`              | Standard header block with divider |
| `pageNumberFooter` | `(leftText?) => PdfNode[]`                     | `"Page 1 of 3"` footer row         |

---

### `PdfFontRegistry`

```typescript
import { PdfFontRegistry } from "@shared/ui/pdf";

PdfFontRegistry.registerDefaults(); // registers project default fonts
```

Called automatically by all hooks. Call manually only in custom bootstrap code.

---

### `registerPdfNodeRenderer`

Extends the node renderer with a custom node type at runtime.

```typescript
import { registerPdfNodeRenderer } from "@shared/ui/pdf";

registerPdfNodeRenderer("watermark", (node) => (
  <View fixed style={{ position: "absolute", opacity: 0.08 }}>
    <Text>{node.text}</Text>
  </View>
));
```

Register at application entry point (`main.tsx`) — only once per type.

---

## Type Exports

```typescript
import type {
  PdfAlign,
  PdfBadgeNode,
  PdfColNode,
  PdfColorScale,
  // Document structure
  PdfDefinition,
  PdfDividerNode,
  PdfDownloadButtonContext,
  // Component types
  PdfDownloadButtonLabels,
  PdfDownloadButtonProps,
  PdfGridNode,
  PdfImageNode,
  PdfJustify,
  // Node union + all variants
  PdfNode,
  PdfPageDefinition,
  PdfRowNode,
  PdfSectionDefinition,
  PdfSpacerNode,
  PdfTableColumn,
  PdfTableNode,
  PdfTextAlign,
  PdfTextNode,
  // Semantic aliases
  PdfTextVariant,
  // Theme
  PdfTheme,
} from "@shared/ui/pdf";
```
