import { useTableContext } from "@ui/table/core/TableEngineContext";
import { useTableFetch } from "@ui/table/core/TableFetchContext";

function isActiveFilterValue(value: unknown): boolean {
  if (value == null || value === "") return false;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

export function countActiveFilters(
  globalFilter: unknown,
  columnFilters: { id: string; value: unknown }[] | undefined
): number {
  let n = 0;
  if (String(globalFilter ?? "").trim()) n += 1;
  for (const f of columnFilters ?? []) {
    if (isActiveFilterValue(f.value)) n += 1;
  }
  return n;
}

/** Same badge in Toolbar and FilterBar (`filterStatusBadge` ×2). */
export function FilterStatusBadge() {
  const { engine } = useTableContext<unknown>();
  const { search, gate } = useTableFetch();
  const state = engine.getState();
  const count = countActiveFilters(state.globalFilter, state.columnFilters);

  if (count === 0) return null;

  const clear = () => {
    engine.setGlobalFilter("");
    engine.resetColumnFilters();
    if (gate === "manual") search();
  };

  return (
    <span
      data-testid="table-filter-status-badge"
      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-primary/10 text-primary"
    >
      {count} filter{count === 1 ? "" : "s"}
      <button
        type="button"
        data-testid="table-filter-status-clear"
        className="underline-offset-2 hover:underline"
        onClick={clear}
      >
        Clear
      </button>
    </span>
  );
}
