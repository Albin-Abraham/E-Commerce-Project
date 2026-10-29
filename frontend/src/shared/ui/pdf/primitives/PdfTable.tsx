/**
 * PdfTable — Data table primitive
 *
 * SOLID — Single Responsibility: tabular data display only.
 *         Open/Closed: column `format` is extensible via formatCell.
 * GoF   — Strategy: `formatCell` is a formatting strategy per column.
 *         Flyweight: theme values shared via context.
 *
 * Uses available width from PdfLayoutContext (or page contentWidth fallback) for exact column widths.
 * `wrap={false}` on rows prevents rows splitting across pages.
 */
import React from "react";

import { Link, Text, View } from "@react-pdf/renderer";

import { usePdfLayout } from "../core/PdfLayoutContext";
import { usePdfPage } from "../core/PdfPageContext";
import { usePdfTheme } from "../core/PdfThemeContext";
import { PdfFormat } from "../mappers/pdf.mapper";
import type { PdfTableColumn } from "../parser/pdf.schema.types";

// ── Formatting Strategy ────────────────────────────────────────────────────

function formatCell(value: any, format?: PdfTableColumn["format"]): string {
  if (value == null || value === "") return "—";
  switch (format) {
    case "currency":
      return PdfFormat.currency(Number(value));
    case "number":
      return PdfFormat.number(Number(value));
    case "percent":
      return PdfFormat.percent(Number(value));
    case "date":
      return PdfFormat.date(value);
    case "boolean":
      return value ? "Yes" : "No";
    case "link":
      return String(value);
    default:
      return String(value);
  }
}

// ── Component ──────────────────────────────────────────────────────────────

interface PdfTableProps {
  columns: PdfTableColumn[];
  rows: Record<string, any>[];
  striped?: boolean;
  bordered?: boolean;
}

export const PdfTable: React.FC<PdfTableProps> = ({
  columns,
  rows,
  striped = true,
  bordered = false,
}) => {
  const theme = usePdfTheme();
  const page = usePdfPage();
  const layout = usePdfLayout();

  // Consume available width from parent layout context, fall back to page content width
  const currentAvailableWidth = layout
    ? layout.availableWidth
    : page.contentWidth;

  // Compute column widths: fixed-width cols are subtracted first, then flex
  const fixedTotal = columns.reduce((s, c) => s + (c.width ?? 0), 0);
  const flexTotal = columns.reduce(
    (s, c) => s + (c.width ? 0 : (c.flex ?? 1)),
    0
  );
  const flexUnit = (currentAvailableWidth - fixedTotal) / (flexTotal || 1);

  const colWidth = (col: PdfTableColumn): number =>
    col.width ?? flexUnit * (col.flex ?? 1);

  const borderStyle = bordered
    ? {
        borderWidth: 1,
        borderColor: "#E5E7EB",
        borderRadius: 4,
        overflow: "hidden" as const,
      }
    : {};

  return (
    <View style={{ width: currentAvailableWidth, ...borderStyle }}>
      {/* Header row — fixed (won't scroll off) */}
      <View
        fixed
        style={{
          flexDirection: "row",
          backgroundColor: "#F3F4F6",
          borderBottomWidth: 1,
          borderColor: "#D1D5DB",
          alignItems: "center",
        }}
      >
        {columns.map((col) => (
          <Text
            key={col.key}
            style={{
              width: colWidth(col),
              fontSize: 8.5,
              fontFamily: theme.fonts.heading,
              color: "#374151",
              fontWeight: "bold",
              textAlign: col.align ?? "left",
              paddingVertical: 6,
              paddingHorizontal: 8,
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            {col.label}
          </Text>
        ))}
      </View>

      {/* Data rows or Empty State */}
      {rows.length === 0 ? (
        <View
          wrap={false}
          style={{
            flexDirection: "row",
            backgroundColor: theme.colors.background,
            borderBottomWidth: 1,
            borderColor: "#E5E7EB",
            paddingVertical: theme.spacing.md,
            paddingHorizontal: theme.spacing.sm,
            justifyContent: "center",
          }}
        >
          <Text
            style={{
              fontSize: theme.fontSize.md,
              fontFamily: theme.fonts.body,
              color: theme.colors.textMuted,
              textAlign: "center",
              width: "100%",
            }}
          >
            No data available
          </Text>
        </View>
      ) : (
        rows.map((row, i) => (
          <View
            key={i}
            wrap={false}
            minPresenceAhead={20}
            style={{
              flexDirection: "row",
              backgroundColor:
                striped && i % 2 === 1
                  ? "#F9FAFB"
                  : "#FFFFFF",
              borderBottomWidth: i === rows.length - 1 && bordered ? 0 : 1,
              borderColor: "#E5E7EB",
              alignItems: "center",
            }}
          >
            {columns.map((col) => {
              const val = row[col.key];
              const cellText = formatCell(val, col.format);
              const isLink =
                col.format === "link" ||
                (typeof val === "string" &&
                  (val.startsWith("http://") || val.startsWith("https://")));

              if (isLink && val) {
                return (
                  <Link
                    key={col.key}
                    src={String(val)}
                    style={{
                      width: colWidth(col),
                      fontSize: 8.5,
                      fontFamily: theme.fonts.body,
                      color: "#2563EB",
                      textDecoration: "underline",
                      textAlign: col.align ?? "left",
                      paddingVertical: 5,
                      paddingHorizontal: 8,
                    }}
                  >
                    {cellText}
                  </Link>
                );
              }

              return (
                <Text
                  key={col.key}
                  style={{
                    width: colWidth(col),
                    fontSize: 8.5,
                    fontFamily: col.bold ? theme.fonts.heading : theme.fonts.body,
                    color: theme.colors[col.color ?? "text"],
                    textAlign: col.align ?? "left",
                    paddingVertical: 5,
                    paddingHorizontal: 8,
                  }}
                >
                  {cellText}
                </Text>
              );
            })}
          </View>
        ))
      )}
    </View>
  );
};
