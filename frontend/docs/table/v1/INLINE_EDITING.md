# Inline Editing Architecture

Inline cells reuse the MDAP form engine (`FormFieldSchema` + `FieldRenderer`) instead of ad-hoc `useState` and inputs.

## Core pieces

1. **`InlineEditProvider`** — holds the active row, builds a headless `Form` from `columnSchemas`.
2. **`useInlineEditContext`** — `editingRowId`, `activeForm`, `startEdit`, `commitEdit`, `cancelEdit`, `submitting`.
3. **`InlineEditCell`** — display text without a provider; `FieldRenderer` when that row is editing (provider required for edit). Form values are keyed by **column id**.

## 1. Column schemas

`FormFieldSchema` requires `id`, `name`, `label`, and `type`:

```tsx
import type { FormFieldSchema } from "@shared/ui/table";

const columnSchemas: Record<string, FormFieldSchema> = {
  email: {
    id: "email",
    name: "email",
    type: "text",
    label: "Email",
    required: true,
  },
  role: {
    id: "role",
    name: "role",
    type: "select",
    label: "Role",
    options: [
      { value: "admin", label: "Admin" },
      { value: "user", label: "User" },
    ],
  },
};
```

## 2. Provider

```tsx
import { RequestFactory } from "@core/http";
import { httpClient } from "@core/http/http.instance";

import { InlineEditProvider } from "@shared/ui/table";

function MyTableContainer() {
  const handleSubmit = async (
    rowId: string,
    changes: Record<string, unknown>
  ) => {
    const request = RequestFactory.patch(`/api/v1/users/${rowId}/`)
      .withJson(changes)
      .build();
    await httpClient.auth.request(request);
  };

  return (
    <InlineEditProvider columnSchemas={columnSchemas} onSubmit={handleSubmit}>
      <MyDataGrid />
    </InlineEditProvider>
  );
}
```

`commitEdit` runs **form validation first** (`form.submit()`). If the form is invalid, `onSubmit` is not called. An optional `validate(rowId, changes)` callback runs after the form passes.

## 3. Cells

```tsx
import { InlineEditCell } from "@shared/ui/table";

const columns = [
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row, getValue }) => (
      <InlineEditCell rowId={row.id} colId="email" value={getValue()} />
    ),
  },
];
```

`TableColumnFactory` also wires `InlineEditCell` when `editable: true` **and** `fieldSchema` is set. Without a provider the cell still **displays** the value; starting an edit without a provider throws.

## 4. Actions column

```tsx
import { useInlineEditContext } from "@shared/ui/table";

function ActionsColumn({ row }) {
  const { isEditing, startEdit, commitEdit, cancelEdit, submitting } =
    useInlineEditContext();

  if (isEditing(row.id)) {
    return (
      <div className="flex gap-2">
        <button onClick={commitEdit} disabled={submitting}>
          Save
        </button>
        <button onClick={cancelEdit} disabled={submitting}>
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button onClick={() => startEdit(row.id, row.original)}>Edit Row</button>
  );
}
```

## Cross-column validation

There is no `watch` / `setFieldValidator` on the form facade. Subscribe to a field and inject a `DetailedError` with `setError`. Mount the guard **inside** `InlineEditProvider`:

```tsx
import { useEffect } from "react";

import { useInlineEditContext } from "@shared/ui/table";

function CrossColumnGuard() {
  const { activeForm } = useInlineEditContext();

  useEffect(() => {
    if (!activeForm) return;

    const apply = () => {
      const values = activeForm.values as Record<string, unknown>;
      const startDate = values.startDate;
      const endDate = values.endDate;
      if (!endDate || !startDate) return;

      const ok = new Date(String(endDate)) > new Date(String(startDate));
      if (!ok) {
        activeForm.setError("endDate", {
          code: "after_start",
          message: "End date must be after start date.",
          fieldId: "endDate",
        });
      }
    };

    apply();
    const unsubStart = activeForm.subscribeToField("startDate", apply);
    const unsubEnd = activeForm.subscribeToField("endDate", apply);
    return () => {
      unsubStart();
      unsubEnd();
    };
  }, [activeForm]);

  return null;
}
```

Cells stay unaware of siblings. Stack multiple guards (`DateRangeGuard`, `BudgetGuard`) without changing column defs. `commitEdit` still runs `form.submit()`; a `setError` on `endDate` keeps the form invalid until the dates are consistent.
