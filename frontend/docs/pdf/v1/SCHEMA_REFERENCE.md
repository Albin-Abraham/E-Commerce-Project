# PDF Schema Reference (`PdfNode` Catalogue)

Every PDF document is described as a tree of `PdfNode` objects. This page is the authoritative reference for all available node types.

---

## Document Root

```typescript
interface PdfDefinition {
  id: string; // Unique identifier
  filename?: string; // Downloaded file name
  meta?: {
    title?: string; // PDF metadata title
    author?: string;
    subject?: string;
    keywords?: string;
  };
  theme?: Partial<PdfTheme>; // Override default design tokens
  pages: PdfPageDefinition[];
}
```

---

## Page Definition

```typescript
interface PdfPageDefinition {
  size?: "A4" | "A5" | "Letter" | "Legal"; // Default: "A4"
  orientation?: "portrait" | "landscape"; // Default: "portrait"
  margin?: "xs" | "sm" | "md" | "lg" | "xl"; // Default: "md"
  header?: PdfNode[]; // Fixed — repeats on every page
  footer?: PdfNode[]; // Fixed — repeats on every page
  sections: PdfSectionDefinition[];
}
```

---

## All PdfNode Types

### `text` — Typography

```json
{
  "type": "text",
  "value": "Employee: Jane Doe",
  "variant": "h3",
  "bold": true,
  "italic": false,
  "color": "textMuted",
  "align": "left",
  "transform": "uppercase",
  "numberOfLines": 1
}
```

| Prop        | Values                                                                   |
| ----------- | ------------------------------------------------------------------------ |
| `variant`   | `"h1"` `"h2"` `"h3"` `"h4"` `"body"` `"caption"` `"label"` `"overline"`  |
| `color`     | Any key from `PdfColorScale` (e.g. `"text"`, `"textMuted"`, `"primary"`) |
| `align`     | `"left"` `"center"` `"right"` `"justify"`                                |
| `transform` | `"uppercase"` `"capitalize"` `"none"`                                    |

> **Special tokens**: Use `"Page {{page}} of {{pages}}"` in footer text nodes for automatic page numbers.

---

### `table` — Data Table

```json
{
  "type": "table",
  "columns": [
    { "key": "name", "label": "Component", "flex": 2 },
    {
      "key": "amount",
      "label": "Amount",
      "flex": 1,
      "align": "right",
      "format": "currency"
    }
  ],
  "rows": [
    { "name": "Basic Salary", "amount": 50000 },
    { "name": "HRA", "amount": 20000 }
  ],
  "striped": true,
  "bordered": false
}
```

| Column `format` | Output                                  |
| --------------- | --------------------------------------- |
| `"currency"`    | `₹50,000.00` (via `PdfFormat.currency`) |
| `"date"`        | `01 Jun 2025` (via `PdfFormat.date`)    |
| `"number"`      | `50,000` (locale-formatted)             |
| `"percent"`     | `12.50%`                                |
| `"boolean"`     | `Yes` / `No`                            |

---

### `row` — Horizontal Layout

```json
{
  "type": "row",
  "gap": "md",
  "justify": "between",
  "align": "center",
  "children": [ ... ]
}
```

| `justify`   | Effect                               |
| ----------- | ------------------------------------ |
| `"between"` | Space-between (label + value layout) |
| `"center"`  | Horizontally centred                 |
| `"end"`     | Right-aligned                        |

---

### `col` — Vertical Stack

```json
{ "type": "col", "gap": "sm", "flex": 1, "children": [ ... ] }
```

---

### `grid` — Fixed Column Grid

```json
{ "type": "grid", "columns": 2, "gap": "md", "children": [ ... ] }
```

`columns` accepts: `2 | 3 | 4 | 6 | 12`

---

### `image`

```json
{
  "type": "image",
  "src": "https://cdn.example.com/logo.png",
  "width": 120,
  "fit": "contain"
}
```

---

### `divider`

```json
{ "type": "divider", "color": "border", "my": "sm" }
```

---

### `badge`

```json
{ "type": "badge", "label": "Active", "color": "success", "bg": "successLight" }
```

---

### `spacer`

```json
{ "type": "spacer", "height": 16 }
```

Or use `"flex": 1` to push content to opposite ends of a row.

---

### `page-break`

```json
{ "type": "page-break" }
```

Forces a new page before the next node.

---

## Layout Modifiers (on any node)

```json
{ "type": "text", "value": "New section", "break": true }
```

| Modifier      | Effect                                      |
| ------------- | ------------------------------------------- |
| `break: true` | Force page break **before** this element    |
| `wrap: false` | Prevent element from splitting across pages |

---

## `PdfFormat` Utility Functions

```typescript
import { PdfFormat } from "@shared/ui/pdf";

PdfFormat.currency(50000, "INR"); // "₹50,000.00"
PdfFormat.currency(1234.5, "EUR"); // "€1,234.50"
PdfFormat.date("2025-06-01"); // "01 Jun 2025"
PdfFormat.number(1234567); // "12,34,567"
PdfFormat.percent(12.5); // "12.50%"

// Pre-built compound nodes
PdfFormat.summaryRow("Total Net Pay", PdfFormat.currency(61500));
PdfFormat.companyHeader("ACME Corp", "Payroll Division");
PdfFormat.pageNumberFooter("Confidential");
```
