# PDF Engine: Rules and Anti-Patterns

## 🛑 Anti-Patterns

### ❌ 1. Importing `@react-pdf/renderer` Directly in Feature Code

```tsx
// ❌ WRONG — bypasses the abstraction, breaks the schema-driven architecture
import { Document, Page, Text, View } from "@react-pdf/renderer";
```

```tsx
// ✅ CORRECT — use only the barrel export
import { PdfEngine, PdfText } from "@shared/ui/pdf";
```

---

### ❌ 2. Hardcoded Layouts with Absolute Positions

```tsx
// ❌ WRONG — breaks on A5, landscape, and different margins
const node = {
  type: "text",
  style: { position: "absolute", top: 120, left: 45 },
};
```

```tsx
// ✅ CORRECT — use semantic layout primitives
const node = { type: "row", justify: "between", children: [...] };
```

---

### ❌ 3. Data Transformation Inside the Renderer

```tsx
// ❌ WRONG — mixing domain logic with presentation
export function InvoicePdf({ invoice }) {
  const total = invoice.items.reduce((s, i) => s + i.price * i.qty, 0);
  const def = {
    pages: [
      { sections: [{ nodes: [{ type: "text", value: `Total: ${total}` }] }] },
    ],
  };
  return <PdfEngine definition={def} />;
}
```

```tsx
// ✅ CORRECT — map first, then render
class InvoiceMapper extends BasePdfMapper<RawInvoice, InvoiceDto> { ... }

export function InvoicePdf({ rawInvoice }) {
  const def = invoiceMapper.map(rawInvoice);
  return <PdfEngine definition={def} />;
}
```

---

### ❌ 4. Using `raw fetch()` or `response.json()` for PDF Delivery

```tsx
// ❌ WRONG — bypasses ResponseFactory; no MIME type handling
const response = await fetch("/api/invoice/download");
const blob = await response.blob();
```

```tsx
// ✅ CORRECT — use RequestFactory + ResponseFactory.parseFile()
const request = RequestFactory.get("/api/v1/invoice/download/").build();
const response = await httpClient.auth.request(request);
const file = ResponseFactory.parse(response).parseFile();
window.location.href = file.url;
```

---

### ❌ 5. Hardcoded Translation Strings in Buttons

```tsx
// ❌ WRONG — not translatable, not context-aware
<PdfDownloadButton onClick={download} label="Download Salary Slip" />
```

```tsx
// ✅ CORRECT — headless labels with context interpolation
<PdfDownloadButton
  onClick={download}
  context={{ docName: t("documents.salarySlip") }}
  labels={{ download: t("pdf.download") }} // "Download {{docName}}"
/>
```

---

### ❌ 6. Generating PDFs Without `usePdfPreload`

Generating a PDF on a cold WASM engine causes a 1–3 second UI freeze on first render.  
Always mount `usePdfPreload()` in your dashboard shell to warm the engine during idle time.

---

## ✅ Core Rules

| Rule                                                      | Reason                                                                         |
| --------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Import only from `@shared/ui/pdf`                         | Enforces encapsulation — internal engine can change without breaking consumers |
| Always use `BasePdfMapper` for data                       | Separates domain logic from presentation                                       |
| Use `PdfFormat.*` utilities                               | Ensures consistent currency, date, and number formatting across all PDFs       |
| Use `{{page}}` / `{{pages}}` tokens in footer text nodes  | Automatic page number injection by the engine                                  |
| Never render `<PdfEngine>` directly in feature components | Feature code should only call `usePdfDownload` or `usePdfPreview`              |
