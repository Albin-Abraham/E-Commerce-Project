import { Download, Upload, Trash2 } from "lucide-react";

import { TableCore } from "@ui/table/core/TableCore";
import { useTableChrome } from "@ui/table/mdap/TableChromeContext";
import type {
  TableExportBehavior,
  TableImportBehavior,
  TableImportSurface,
} from "@ui/table/mdap/table-entity";
import { ProgressModal } from "@ui/table/ui/primitives/ProgressModal";

function ToolbarExportButton({ ports }: { ports: TableExportBehavior }) {
  const exportApi = TableCore.ServerExport.useServerExport({
    enabled: true,
    ...ports,
  });

  return (
    <>
      <button
        type="button"
        data-testid="table-export-btn"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-surface border border-border/40 shadow-sm text-primary hover:bg-surface-raised transition-all"
        onClick={() => exportApi.handleExport("csv")}
      >
        <Download size={12} />
        <span>Export</span>
      </button>
      <ProgressModal
        isOpen={exportApi.task.status !== "idle"}
        onClose={exportApi.handleCloseModal}
        status={exportApi.task.status}
        progress={exportApi.task.progress}
        title="Export"
      >
        {({ title, progress, status, close }) => (
          <div className="p-6 bg-surface rounded-xl shadow-lg flex flex-col items-center gap-4">
            <h3 className="font-bold text-lg">{title}</h3>
            <p className="text-sm text-muted-foreground">
              {status === "processing" ? `${progress}%` : status}
            </p>
            <button type="button" onClick={close}>
              Close
            </button>
          </div>
        )}
      </ProgressModal>
    </>
  );
}

function ToolbarImportButton({
  ports,
  surface,
}: {
  ports: TableImportBehavior;
  surface: TableImportSurface | null;
}) {
  const importApi = TableCore.Import.useImport({
    enabled: true,
    ...ports,
  });

  const openImport = () => {
    if (surface?.mode === "page") surface.onImport();
    else importApi.triggerImport();
  };

  return (
    <>
      <input
        ref={importApi.fileInputRef}
        type="file"
        className="hidden"
        data-testid="table-import-file"
        onChange={importApi.handleFileChange}
      />
      <button
        type="button"
        data-testid="table-import-btn"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-surface border border-border/40 shadow-sm text-primary hover:bg-surface-raised transition-all"
        onClick={openImport}
      >
        <Upload size={12} />
        <span>Import</span>
      </button>
      {surface?.mode !== "page" ? (
        <ProgressModal
          isOpen={importApi.isImportModalOpen || importApi.status !== "idle"}
          onClose={importApi.handleCloseModal}
          status={importApi.status}
          progress={importApi.progress}
          title="Import"
        >
          {({ title, progress, status, close }) => (
            <div className="p-6 bg-surface rounded-xl shadow-lg flex flex-col items-center gap-4">
              <h3 className="font-bold text-lg">{title}</h3>
              <p className="text-sm text-muted-foreground">
                {status === "processing" ? `${progress}%` : status}
              </p>
              <button type="button" onClick={close}>
                Close
              </button>
            </div>
          )}
        </ProgressModal>
      ) : null}
    </>
  );
}

function ToolbarDeleteButton() {
  return (
    <button
      type="button"
      data-testid="table-delete-btn"
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-destructive/10 border border-destructive/30 text-destructive hover:bg-destructive/20 transition-all"
      onClick={() => alert("Delete selected action triggered")}
    >
      <Trash2 size={12} />
      <span>Delete</span>
    </button>
  );
}

/** `{exportBtn}` / `{importBtn}` / `{deleteBtn}` — hooks run only when the slot is on. */
export function ToolbarChromeSlots() {
  const chrome = useTableChrome();

  return (
    <>
      {chrome.exportBtn && chrome.serverExport ? (
        <ToolbarExportButton ports={chrome.serverExport} />
      ) : null}
      {chrome.importBtn && chrome.tableImport ? (
        <ToolbarImportButton
          ports={chrome.tableImport}
          surface={chrome.importSurface}
        />
      ) : null}
      {chrome.deleteBtn ? <ToolbarDeleteButton /> : null}
    </>
  );
}
