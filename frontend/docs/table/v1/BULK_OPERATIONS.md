# Bulk Operations (CSV Import & Export)

Prefer spreading `compiled.serverExport` / `compiled.import` under `<Table>` — [v2 compose](../v2/PLUGINS.md#compose-with-compiled). This page is polling and `ProgressModal` slots.

Two layers:

- **`TableCore.ServerExport.useServerExport`** — selection-aware; attaches live `filters` / `search` via `extractQueryParams`. Scope `"all"` is the **filtered query** (no page slice). Scope `"selected"` in ALL mode sends `ids: "select_all"` plus `excluded_ids`.
- **`useExportTask` / `useImportTask`** — headless polling machines. They do not read the engine; you pass params yourself.
- **`TableCore.Export.useExport`** — client CSV/JSON of the **current page** of rows (the table does not re-slice). Prefer ServerExport for the full filtered dataset.

`ProgressModal` takes either a `title` string or a `labels` dictionary (`titleProcessing`, `titleComplete`, `titleFailed`). Both are valid.

`useImportTask` and `useExportTask` share:

```ts
type TableTaskStatus =
  | "idle"
  | "uploading"
  | "pending"
  | "queued"
  | "processing"
  | "completed"
  | "failed";
```

`ProgressModal` accepts the same union. `idle` is dismissable. `uploading` / `pending` / `queued` / `processing` block dismiss unless `dismissable` is true.

## 1. Context-aware exports

A bulk **server** export must send the live **filtered query** (`extractQueryParams`), not the entire unfiltered dataset and not only the current page (omit `page` / `pageSize` for scope `"all"`).

```tsx
import { TableCore } from "@shared/ui/table";

const exportApi = TableCore.ServerExport.useServerExport({
  enabled: true,
  createExport: (params) => http.post("/export", params),
  getStatus: (id) => http.get(`/export/${id}`),
  downloadFile: (id) => http.download(`/export/${id}/file`),
});
exportApi.handleExport("csv");
```

`useExportTask` does not read filter/sort state. Forward live params with `extractQueryParams`:

```tsx
import { RequestFactory, ResponseFactory } from "@core/http";
import { httpClient } from "@core/http/http.instance";

import {
  ProgressModal,
  extractQueryParams,
  useExportTask,
} from "@shared/ui/table";
import type { TableTaskStatus } from "@shared/ui/table";

export function FilteredExportButton({ engine }) {
  const task = useExportTask({ pollInterval: 2000, autoCloseDelay: 1500 });

  const handleExport = () => {
    const queryParams = extractQueryParams(engine.getState());
    // { page, pageSize, sort, filters, search }

    task.startExport(
      async () => {
        const request = RequestFactory.post("/api/v1/export/users/")
          .withJson(queryParams)
          .build();
        const response = await httpClient.auth.request(request);
        return ResponseFactory.parse(response).parseEnvelope<{
          task_id: string;
        }>();
      },
      {
        getStatus: async (taskId) => {
          const request = RequestFactory.get(
            `/api/v1/export/status/${taskId}/`
          ).build();
          const response = await httpClient.auth.request(request);
          return ResponseFactory.parse(response).parse();
        },
        onCompleted: (filename) => {
          if (filename) window.location.href = `/api/v1/download/${filename}`;
        },
      }
    );
  };

  return (
    <>
      <button onClick={handleExport}>Export Filtered View</button>
      <ProgressModal
        isOpen={task.status !== "idle"}
        onClose={task.cancel}
        status={task.status}
        progress={task.progress}
        title="Exporting CSV"
      >
        {({ status, progress, title }) => (
          <div className="p-6 bg-surface rounded-xl flex flex-col items-center shadow-lg">
            <h3 className="font-bold text-lg">{title}</h3>
            {(status === "pending" || status === "queued") && (
              <span className="text-muted-foreground mt-2">
                Waiting in queue...
              </span>
            )}
            {status === "processing" && (
              <div className="w-full mt-4">
                <progress value={progress} max="100" className="w-full" />
                <div className="text-sm text-center mt-1">{progress}%</div>
              </div>
            )}
          </div>
        )}
      </ProgressModal>
    </>
  );
}
```

### `TableQueryParams`

```typescript
{
  page: 0,
  pageSize: 25,
  sort: [{ key: "name", dir: "asc" }],
  filters: { role: "admin", status: "active" },
  search: "john"
}
```

Use `ProgressModal` for the overlay (z-index + Escape). Do not invent a root modal.

## 2. Export (`useExportTask`)

- `status`: `TableTaskStatus`
- `progress`: 0–100
- `filename`: download name or URL
- `autoCloseDelay`: ms after success before reset to `idle` (default `0`)

## 3. Import (`useImportTask`)

Two stages: upload, then server processing. Declare ports on `behavior.import` and how to open on `surface.import`. The compiler copies them to `compiled.import` / `compiled.importSurface`. **`useMDAPTable` does not auto-mount the importer.**

| Surface                      | When                           | What you mount                                                                                                                                        |
| ---------------------------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `{ mode: "modal" }`          | Quick CSV, stay on the list    | File picker + `ProgressModal` (or `TableCore.Import.useImport`) using `compiled.import`                                                               |
| `{ mode: "page", onImport }` | Mapping UI, error grid, wizard | Toolbar calls `onImport()` (navigate). The **page** reuses the same ports + `useImportTask`. Same columns / `validateCSVHeaders`. `refetch` on return |

Do not put a React modal in JSON. Do not fork upload APIs for modal vs page.

- `status`: same union (includes `uploading`)
- `uploadProgress` / `progress`
- `summary`: `{ created_count, updated_count, error_count }`
- `errors`: `{ row, error }` or `{ row, message }` — `DefaultErrorList` accepts both

```tsx
import {
  useImportTask,
  ProgressModal,
  TaskStatus,
  DefaultSummary,
  DefaultErrorList,
  validateImportFile,
} from "@shared/ui/table";
import { RequestFactory, ResponseFactory } from "@core/http";
import { httpClient } from "@core/http/http.instance";

export function ImportUploader() {
  const task = useImportTask({ pollInterval: 2000, autoCloseDelay: 0 });

  const handleUpload = (file: File) => {
    const fileCheck = validateImportFile(file, { requiredHeaders: ["email"] });
    if (!fileCheck.valid) return;

    task.uploadFile(
      async (onProgress) => {
        const request = RequestFactory.post("/api/v1/import/upload/")
          .withFile({ file, fieldName: "file", onProgress })
          .build();
        const response = await httpClient.auth.request(request);
        return ResponseFactory.parse(response).parseEnvelope<{ task_id: string }>();
      },
      {
        getStatus: async (taskId) => {
          const request = RequestFactory.get(`/api/v1/import/status/${taskId}/`).build();
          const response = await httpClient.auth.request(request);
          return ResponseFactory.parse(response).parse();
        },
      }
    );
  };

  return (
    <>
      <input type="file" onChange={(e) => handleUpload(e.target.files![0])} />

      <ProgressModal
        isOpen={task.status !== "idle"}
        onClose={task.reset}
        status={task.status}
        progress={task.status === "uploading" ? task.uploadProgress : task.progress}
        title="Importing Data"
      >
        {({ status, progress, title }) => (
          <div className="p-6 bg-surface rounded-xl shadow-lg w-[400px]">
            <h3 className="mb-4 text-lg font-bold">{title}</h3>
            <TaskStatus
              status={status}
              summary={task.summary}
              errors={task.errors}
              renderSummary={(s) => <DefaultSummary summary={s} />}
              renderErrors={(e) => <DefaultErrorList errors={e} />}
            >
              {({ summary, errors, status }) => (
                <div className="flex flex-col gap-4">
                  {status === "uploading" && <div>Uploading: {progress}%</div>}
                  {(status === "pending" || status === "queued") && <div>Queued...</div>}
                  {status === "processing" && <div>Processing: {progress}%</div>}
                  {status === "completed" && summary && <DefaultSummary summary={summary} />}
      </ProgressModal>
    </>
  );
}
```

**Page surface** — list stays dumb; import route owns the job UI:

```tsx
// entity
surface: { import: { mode: "page", onImport: () => navigate("/users/import") } }

// toolbar
<button
  type="button"
  onClick={() =>
    compiled.importSurface?.mode === "page" && compiled.importSurface.onImport()
  }
>
  Import
</button>

// /users/import — same ports as compiled.import, then refetch the list
```
