import React from "react";

import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { TableColumnMeta } from "../../types";
import { TableColumnFactory, inferRenderer } from "../TableColumnFactory";

function cellOf(meta: TableColumnMeta, value: unknown) {
  const [col] = TableColumnFactory.compile([{ ...meta }]);
  const cell = col.cell as (info: unknown) => React.ReactNode;
  return cell({
    getValue: () => value,
    row: { id: "1", original: { id: "1" } },
  });
}

describe("inferRenderer", () => {
  it("uses explicit renderer over fieldSchema.type", () => {
    expect(
      inferRenderer({
        id: "status",
        label: "Status",
        renderer: "badge",
        fieldSchema: {
          id: "status",
          name: "status",
          label: "Status",
          type: "choice",
        },
      })
    ).toBe("badge");
  });

  it("infers date from datetime fieldSchema", () => {
    expect(
      inferRenderer({
        id: "created",
        label: "Created",
        fieldSchema: {
          id: "created",
          name: "created",
          label: "Created",
          type: "datetime",
        },
      })
    ).toBe("date");
  });

  it("infers text from email fieldSchema", () => {
    expect(
      inferRenderer({
        id: "email",
        label: "Email",
        fieldSchema: {
          id: "email",
          name: "email",
          label: "Email",
          type: "email",
        },
      })
    ).toBe("text");
  });

  it("falls back to text when type is unknown", () => {
    expect(inferRenderer({ id: "x", label: "X" })).toBe("text");
  });
});

describe("TableColumnFactory.compile", () => {
  it("drops hidden columns", () => {
    const cols = TableColumnFactory.compile([
      { id: "name", label: "Name" },
      { id: "secret", label: "Secret", hidden: true },
    ]);
    expect(cols.map((c) => c.id)).toEqual(["name"]);
  });

  it("applies pinned and align onto column meta", () => {
    const [col] = TableColumnFactory.compile([
      { id: "name", label: "Name", pinned: "left", align: "right" },
    ]);
    expect((col.meta as { pinned?: string; align?: string }).pinned).toBe(
      "left"
    );
    expect((col.meta as { pinned?: string; align?: string }).align).toBe(
      "right"
    );
  });

  it("renders currency with Intl", () => {
    const { getByText } = render(
      <>
        {cellOf(
          {
            id: "price",
            label: "Price",
            renderer: "currency",
            formatOptions: { currency: "EUR", locale: "de-DE" },
          },
          1234.5
        )}
      </>
    );
    expect(getByText(/1.234,50/)).toBeDefined();
  });

  it("renders inferred date when renderer is omitted", () => {
    const { container } = render(
      <>
        {cellOf(
          {
            id: "created",
            label: "Created",
            fieldSchema: {
              id: "created",
              name: "created",
              label: "Created",
              type: "date",
            },
          },
          "2024-01-15T00:00:00.000Z"
        )}
      </>
    );
    expect(container.textContent).not.toBe("");
    expect(container.textContent).not.toBe("2024-01-15T00:00:00.000Z");
  });

  it("wires InlineEditCell when editable and fieldSchema are set", () => {
    const [col] = TableColumnFactory.compile([
      {
        id: "email",
        label: "Email",
        editable: true,
        fieldSchema: {
          id: "email",
          name: "email",
          label: "Email",
          type: "text",
        },
      },
    ]);
    expect(typeof col.cell).toBe("function");
  });

  it("reuses compiled ColumnDef references from cache for identical meta columns", () => {
    TableColumnFactory.clearCache();
    const meta: TableColumnMeta[] = [
      { id: "colA", label: "Column A" },
      { id: "colB", label: "Column B" },
    ];

    const firstCompile = TableColumnFactory.compile(meta);
    const secondCompile = TableColumnFactory.compile(meta);

    expect(firstCompile).toBe(secondCompile);
  });

  it("handles unknown renderer with graceful fallback element and data attribute", () => {
    const { container } = render(
      <>
        {cellOf(
          {
            id: "customMetric",
            label: "Metric",
            renderer: "unknown_custom_chart",
          },
          "42 Mbps"
        )}
      </>
    );

    const fallbackEl = container.querySelector(
      '[data-unknown-renderer="unknown_custom_chart"]'
    );
    expect(fallbackEl).toBeDefined();
    expect(fallbackEl?.textContent).toBe("42 Mbps");
  });
});

