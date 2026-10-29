# Server-Driven UI & Internationalization (i18n)

The server defines the **semantic schema** (field names, types, constraints). The frontend decides presentation. UI fields like `renderer` and `width` are optional overrides.

## 1. Dynamic columns — `TableColumnFactory`

`TableColumnFactory.compile(TableColumnMeta[])` is the **content compiler**. `compileEntityToTableDef` calls it. Custom cells: `tableCellRegistry.register` + `renderer` string (form rule 2.2). Do not put JSX on `ColumnDef.cell` in entity JSON.

```tsx
import React from "react";

import { TableColumnFactory, useZenithTable } from "@shared/ui/table";

const serverColumns = [
  {
    id: "email",
    label: "Email Address",
    fieldSchema: { id: "email", name: "email", label: "Email", type: "email" },
  },
  {
    id: "status",
    label: "Account Status",
    fieldSchema: {
      id: "status",
      name: "status",
      label: "Status",
      type: "choice",
    },
    renderer: "badge",
  },
  {
    id: "cost",
    label: "Monthly Cost",
    fieldSchema: { id: "cost", name: "cost", label: "Cost", type: "number" },
    renderer: "currency",
    formatOptions: { currency: "USD" },
    align: "right",
  },
];

export function DynamicTable() {
  const dynamicColumns = React.useMemo(
    () => TableColumnFactory.compile(serverColumns),
    []
  );

  const { Table, Header, Body, View } = useZenithTable({
    meta: { id: "dynamic-users" },
    columns: dynamicColumns,
    source: myServerDataSource,
  });

  return (
    <Table>
      <View>
        <Header />
        <Body />
      </View>
    </Table>
  );
}
```

`align` is applied on the cell. `pinned: "left" | "right"` is written onto the column `meta` and picked up by the adapter.

### Renderer inference

When `renderer` is omitted, the factory uses `fieldSchema.type`:

| `fieldSchema.type`                         | Inferred `renderer` | Example output        |
| ------------------------------------------ | ------------------- | --------------------- |
| `"text"`, `"email"`, `"url"`, `"password"` | `"text"`            | Truncated plain text  |
| `"number"`, `"integer"`, `"float"`         | `"text"`            | Numeric string        |
| `"choice"`, `"select"`, `"radio"`          | `"text"`            | Raw option value      |
| `"boolean"`, `"checkbox"`                  | `"text"`            | `"true"` / `"false"`  |
| `"date"`, `"datetime"`                     | `"date"`            | Locale-formatted date |
| _(none / unknown)_                         | `"text"`            | Plain text fallback   |

An explicit `renderer` always wins (e.g. `"badge"` on a `choice` field, `"currency"` on a `number` field).

Layout persistence (`columnVisibility`, `columnSizing`) is application-owned. Observe `engine.getState()` and `PUT` to your API — the engine does not persist.

## 2. Currency and dates (`Intl`)

```json
{
  "id": "price",
  "label": "Total Price",
  "renderer": "currency",
  "formatOptions": {
    "currency": "EUR",
    "locale": "de-DE"
  }
}
```

Output: `1.234,56 €`. Uses `Intl.NumberFormat` / `Intl.DateTimeFormat` only.

## 3. Headless translation

Primitives (`ProgressModal`, `DefaultSummary`, `DefaultErrorList`) accept a `labels` dictionary. Call `useTranslation()` in the feature layer and pass strings down.

```tsx
import { useTranslation } from "react-i18next";

import {
  DefaultErrorList,
  DefaultSummary,
  ProgressModal,
  TaskStatus,
} from "@shared/ui/table";

export function TranslatedUploader() {
  const { t } = useTranslation("table");

  return (
    <ProgressModal
      isOpen={true}
      status="processing"
      progress={50}
      labels={{
        titleProcessing: t("status.processing"),
        titleComplete: t("status.complete"),
        titleFailed: t("status.failed"),
      }}
    >
      {({ status, progress, title }) => (
        <TaskStatus status={status} summary={mySummary} errors={myErrors}>
          {({ summary, errors }) => (
            <>
              {summary && (
                <DefaultSummary
                  summary={summary}
                  labels={{
                    created: t("summary.created"),
                    updated: t("summary.updated"),
                    failed: t("summary.failed"),
                  }}
                />
              )}
              {errors.length > 0 && (
                <DefaultErrorList
                  errors={errors}
                  labels={{ row: t("errors.row") }}
                />
              )}
            </>
          )}
        </TaskStatus>
      )}
    </ProgressModal>
  );
}
```
