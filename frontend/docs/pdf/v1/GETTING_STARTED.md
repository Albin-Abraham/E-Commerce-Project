# Getting Started: ZenOS PDF Engine

## Installation Requirements

The PDF engine depends on `@react-pdf/renderer`. It is already registered in the shared workspace.

---

## Step 1: Define the Document Schema (`PdfDefinition`)

A `PdfDefinition` is a plain JSON object describing your document. You never write React components directly for layout.

```typescript
import type { PdfDefinition } from "@shared/ui/pdf";

const salarySlipDef: PdfDefinition = {
  id: "salary-slip",
  filename: "Salary_Slip_June_2025.pdf",
  meta: {
    title: "Salary Slip",
    author: "ZenOS Payroll",
  },
  pages: [
    {
      size: "A4",
      orientation: "portrait",
      // Fixed header — repeats on every page
      header: [
        {
          type: "text",
          value: "ACME Corp — Confidential",
          variant: "caption",
          color: "textMuted",
        },
      ],
      // Fixed footer — repeats on every page
      footer: [
        {
          type: "row",
          justify: "between",
          children: [
            {
              type: "text",
              value: "ZenOS Payroll",
              variant: "caption",
              color: "textMuted",
            },
            {
              type: "text",
              value: "Page {{page}} of {{pages}}",
              variant: "caption",
              color: "textMuted",
            },
          ],
        },
      ],
      sections: [
        {
          nodes: [
            {
              type: "text",
              value: "Salary Slip — June 2025",
              variant: "h2",
              bold: true,
            },
            { type: "divider", my: "sm" },
            {
              type: "table",
              columns: [
                { key: "component", label: "Component", flex: 2 },
                {
                  key: "amount",
                  label: "Amount",
                  flex: 1,
                  align: "right",
                  format: "currency",
                },
              ],
              rows: [
                { component: "Basic Salary", amount: 50000 },
                { component: "HRA", amount: 20000 },
                { component: "Tax (TDS)", amount: -8500 },
              ],
              striped: true,
            },
          ],
        },
      ],
    },
  ],
};
```

---

## Step 2: Map Your API Response (via `BasePdfMapper`)

Your API returns raw JSON — never pass it directly to the engine. Use `BasePdfMapper`:

```typescript
import { BasePdfMapper, PdfFormat } from "@shared/ui/pdf";
import type { PdfDefinition } from "@shared/ui/pdf";

interface RawPayslipResponse {
  employee_name: string;
  month: string;
  components: { name: string; amount: number }[];
}

class PayslipMapper extends BasePdfMapper<
  RawPayslipResponse,
  RawPayslipResponse
> {
  fromResponse(raw: RawPayslipResponse) {
    return raw; // DTO step — validate / normalize here
  }

  toDefinition(dto: RawPayslipResponse): PdfDefinition {
    return {
      id: "payslip",
      filename: `Payslip_${dto.month}.pdf`,
      pages: [
        {
          sections: [
            {
              nodes: [
                ...PdfFormat.companyHeader(
                  "ACME Corp",
                  `Payslip — ${dto.month}`
                ),
                {
                  type: "table",
                  columns: [
                    { key: "name", label: "Component", flex: 2 },
                    {
                      key: "amount",
                      label: "Amount",
                      flex: 1,
                      align: "right",
                      format: "currency",
                    },
                  ],
                  rows: dto.components,
                  striped: true,
                },
              ],
            },
          ],
        },
      ],
    };
  }
}

export const payslipMapper = new PayslipMapper();
```

---

## Step 3: Download the PDF in a Component

```tsx
import { useTranslation } from "react-i18next";

import { PdfDownloadButton, usePdfDownload } from "@shared/ui/pdf";

import { payslipMapper } from "./payslip.mapper";

export function PayslipDownloader({ apiResponse }) {
  const { t } = useTranslation("pdf");
  const { downloadFromDefinition, isGenerating, error } = usePdfDownload();

  const handleDownload = () => {
    // 1. Map raw API → PdfDefinition
    const definition = payslipMapper.map(apiResponse);
    // 2. Pass to the download hook — blob generation + browser download handled automatically
    downloadFromDefinition(definition);
  };

  return (
    <>
      <PdfDownloadButton
        onClick={handleDownload}
        loading={isGenerating}
        // Context-aware label: "Download Salary Slip" (not a hardcoded generic string)
        context={{ docName: t("documents.salarySlip") }}
        labels={{
          download: t("pdf.download"), // "Download {{docName}}"
          generating: t("pdf.generating"), // "Generating {{docName}}..."
        }}
      />
      {error && <p className="text-error text-sm mt-2">{error.message}</p>}
    </>
  );
}
```

---

## Step 4: Preload for Faster First Generation (Optional)

The `@react-pdf/renderer` engine uses WASM which has a cold-start delay of 1–3 seconds on first use. Mount `usePdfPreload()` on your layout or dashboard shell to warm it up during browser idle time:

```tsx
import { usePdfPreload } from "@shared/ui/pdf";

export function DashboardLayout({ children }) {
  usePdfPreload(); // Warms up WASM + registers fonts during requestIdleCallback

  return <>{children}</>;
}
```
