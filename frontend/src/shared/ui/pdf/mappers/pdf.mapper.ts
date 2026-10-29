/**
 * IPdfMapper — DTO Mapper contract
 *
 * SOLID — Interface Segregation: two responsibilities, two methods.
 *         Dependency Inversion: consumers depend on this interface, not mappers.
 * GoF   — Template Method: BasePdfMapper.map() calls abstract methods in fixed order.
 *         Factory Method: subclasses decide how to construct the PdfDefinition.
 */
import type { PdfDefinition, PdfNode } from "../parser/pdf.schema.types";

// ── Interface ──────────────────────────────────────────────────────────────

export interface IPdfMapper<TRaw, TDto> {
  /** Step 1: Normalise raw API response → clean typed DTO */
  fromResponse(raw: TRaw): TDto;
  /** Step 2: Convert DTO → PdfDefinition schema */
  toDefinition(dto: TDto): PdfDefinition;
  /** Convenience: raw → PdfDefinition in one call */
  map(raw: TRaw): PdfDefinition;
}

// ── Abstract base (Template Method) ───────────────────────────────────────

export abstract class BasePdfMapper<TRaw, TDto> implements IPdfMapper<
  TRaw,
  TDto
> {
  abstract fromResponse(raw: TRaw): TDto;
  abstract toDefinition(dto: TDto): PdfDefinition;

  /** Template Method: fixed order — fromResponse → toDefinition */
  map(raw: TRaw): PdfDefinition {
    const dto = this.fromResponse(raw);
    return this.toDefinition(dto);
  }
}

// ── Format utilities (Strategy functions) ─────────────────────────────────

export const PdfFormat = {
  currency: (value: number, currency = "INR"): string =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(
      value
    ),

  date: (value: string | Date): string =>
    new Date(value).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),

  number: (value: number): string => Number(value).toLocaleString("en-IN"),

  percent: (value: number, decimals = 2): string =>
    `${Number(value).toFixed(decimals)}%`,

  /** Builds a two-column summary row (label + value) */
  summaryRow: (label: string, value: string, bold = false) => ({
    type: "row" as const,
    justify: "between" as const,
    children: [
      { type: "text" as const, value: label, color: "textMuted" as const },
      { type: "text" as const, value, bold },
    ],
  }),

  /** Generates a standard styled company header block */
  companyHeader: (title: string, subtitle?: string): PdfNode[] => {
    const headerNodes: PdfNode[] = [
      {
        type: "row" as const,
        justify: "between" as const,
        align: "center" as const,
        children: [
          {
            type: "col" as const,
            children: [
              {
                type: "text" as const,
                value: title,
                variant: "h3" as const,
                bold: true,
              },
              ...(subtitle
                ? [
                    {
                      type: "text" as const,
                      value: subtitle,
                      variant: "caption" as const,
                      color: "textMuted" as const,
                    },
                  ]
                : []),
            ],
          },
        ],
      },
      { type: "divider" as const, my: "xs" as const },
    ];
    return headerNodes;
  },

  /** Generates a standard styled page number footer block */
  pageNumberFooter: (leftText?: string): PdfNode[] => [
    {
      type: "row" as const,
      justify: "between" as const,
      align: "center" as const,
      children: [
        {
          type: "text" as const,
          value: leftText ?? "",
          variant: "caption" as const,
          color: "textMuted" as const,
        },
        {
          type: "text" as const,
          value: "Page {{page}} of {{pages}}",
          variant: "caption" as const,
          color: "textMuted" as const,
        },
      ],
    },
  ],
};
