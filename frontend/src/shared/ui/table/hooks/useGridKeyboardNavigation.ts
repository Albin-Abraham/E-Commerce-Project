import { useCallback, useEffect, useLayoutEffect, useRef } from "react";

import { useEventRegistry } from "@core/events/stores/eventRegistry.store";

/**
 * useGridKeyboardNavigation
 *
 * WAI-ARIA grid movement. When `scope` is set, movement keys are registered
 * on Event core (`KeyboardDelegationStrategy`) and only run while the grid
 * holds focus (`activeScope`). `handleKeyDown` is always returned so Body
 * still works if `GlobalEventProvider` is not mounted (stopPropagation avoids
 * double-handling when both are live).
 *
 * Cell lookup uses `[data-table-row]` / `[data-table-cell]` / `[data-table-col]`
 * — not nth-child — so index columns and virtualizer spacers are skipped.
 *
 * Enter / Space are not Event-core shortcuts (they would steal header sort
 * and in-cell buttons). They run only from `handleKeyDown`.
 *
 * ## Performance — MutationObserver DOM cache
 *
 * `gridRows` and `gridHeaders` are called on EVERY keydown event. With large
 * non-virtualised tables (1 000+ rows) a full `querySelectorAll` subtree scan
 * was O(n·DOM nodes) per keystroke, causing visible jank at sustained keyboard
 * navigation speeds.
 *
 * Fix: `MutationObserver` watches the grid root for `childList` mutations and
 * rebuilds two shallow caches — `rowsCacheRef` and `headersCacheRef` — only
 * when the DOM actually changes (new page, sort, virtualiser window shift).
 *
 * `gridCells(row)` is intentionally NOT cached: it is scoped to a single
 * already-retrieved row element, so the query is O(cols) ≈ 5-30, always fast.
 */

interface GridNavigationOptions {
  gridRef: React.RefObject<HTMLDivElement | null>;
  getRowCount: () => number;
  getColCount: (rowIndex: number) => number;
  onCellActivate?: (row: number, col: number) => void;
  onHeaderActivate?: (col: number) => void;
  enabled?: boolean;
  /** Event-core scope (typically `table:${meta.id}`). */
  scope?: string;
}

const PAGE_JUMP = 10;

/** Movement only. Enter/Space stay on the local handler. */
const GRID_MOVE_KEYS: { id: string; key: string }[] = [
  { id: "right", key: "arrowright" },
  { id: "left", key: "arrowleft" },
  { id: "down", key: "arrowdown" },
  { id: "up", key: "arrowup" },
  { id: "home", key: "home" },
  { id: "end", key: "end" },
  { id: "ctrl-home", key: "ctrl+home" },
  { id: "ctrl-end", key: "ctrl+end" },
  { id: "page-down", key: "pagedown" },
  { id: "page-up", key: "pageup" },
];

function comboToKey(combo: string): { key: string; ctrlKey: boolean } {
  const ctrlKey = combo.startsWith("ctrl+");
  const raw = ctrlKey ? combo.slice(5) : combo;
  const key =
    raw === "arrowright"
      ? "ArrowRight"
      : raw === "arrowleft"
        ? "ArrowLeft"
        : raw === "arrowdown"
          ? "ArrowDown"
          : raw === "arrowup"
            ? "ArrowUp"
            : raw === "home"
              ? "Home"
              : raw === "end"
                ? "End"
                : raw === "pagedown"
                  ? "PageDown"
                  : raw === "pageup"
                    ? "PageUp"
                    : raw;
  return { key, ctrlKey };
}

// ── Per-row cell cache ─────────────────────────────────────────────────────────
// Avoids re-querying cells of the same row element when navigating within it.
// WeakMap: no memory leak — entries are GC'd when the row element is removed.
const cellCache = new WeakMap<HTMLElement, HTMLElement[]>();

function gridCells(row: HTMLElement): HTMLElement[] {
  const cached = cellCache.get(row);
  if (cached) return cached;
  const cells = Array.from(row.querySelectorAll<HTMLElement>("[data-table-cell]"));
  cellCache.set(row, cells);
  return cells;
}

function shouldDeferNativeActivate(el: HTMLElement): boolean {
  if (el.closest("[data-table-col]")) return true;
  const tag = el.tagName.toLowerCase();
  if (
    tag === "button" ||
    tag === "a" ||
    tag === "input" ||
    tag === "textarea" ||
    tag === "select"
  ) {
    return true;
  }
  if (el.getAttribute("role") === "button") return true;
  if (el.isContentEditable) return true;
  return false;
}

export function useGridKeyboardNavigation({
  gridRef,
  getRowCount,
  getColCount,
  onCellActivate,
  onHeaderActivate,
  enabled = true,
  scope,
}: GridNavigationOptions) {
  const activeCellRef = useRef<{ row: number; col: number }>({
    row: 0,
    col: 0,
  });
  const registerShortcut = useEventRegistry((s) => s.registerShortcut);
  const unregisterShortcut = useEventRegistry((s) => s.unregisterShortcut);
  const setActiveScope = useEventRegistry((s) => s.setActiveScope);

  // ── MutationObserver DOM caches ──────────────────────────────────────────────
  // Rebuilt only when DOM mutates — not on every keydown.
  const rowsCacheRef = useRef<HTMLElement[]>([]);
  const headersCacheRef = useRef<HTMLElement[]>([]);

  useLayoutEffect(() => {
    const root = gridRef.current;
    if (!root || !enabled) return;

    const rebuildCache = () => {
      // Invalidate per-row cell cache entries when rows change.
      // The WeakMap entries for removed rows are GC'd automatically;
      // we only need to clear entries for rows that are REUSED with new cells
      // (e.g. virtualiser row recycling). We do this by simply clearing the
      // WeakMap keys we know about before rebuilding.
      rowsCacheRef.current.forEach((row) => cellCache.delete(row));

      rowsCacheRef.current = Array.from(
        root.querySelectorAll<HTMLElement>("[data-table-row]")
      );
      headersCacheRef.current = Array.from(
        root.querySelectorAll<HTMLElement>("[data-table-col]")
      );
    };

    // Initial build
    rebuildCache();

    // Watch for DOM changes: new page load, sort re-render, virtualiser scroll
    const observer = new MutationObserver(rebuildCache);
    observer.observe(root, {
      childList: true,   // direct children added/removed (thead, tbody, tr)
      subtree: true,     // rows inside tbody
    });

    return () => {
      observer.disconnect();
      // Clear caches on unmount to release element references
      rowsCacheRef.current.forEach((row) => cellCache.delete(row));
      rowsCacheRef.current = [];
      headersCacheRef.current = [];
    };
  }, [gridRef, enabled]);

  // ── Accessors that read from the cache ───────────────────────────────────────
  // These are O(1) lookups instead of O(DOM nodes) querySelectorAll scans.
  const getCachedRows = useCallback(() => rowsCacheRef.current, []);
  const getCachedHeaders = useCallback(() => headersCacheRef.current, []);

  const syncFromDom = useCallback(() => {
    const root = gridRef.current;
    const active = document.activeElement as HTMLElement | null;
    if (!root || !active || !root.contains(active)) return;

    const header = active.closest<HTMLElement>("[data-table-col]");
    if (header && root.contains(header)) {
      const col = getCachedHeaders().indexOf(header);
      if (col >= 0) activeCellRef.current = { row: -1, col };
      return;
    }

    const rowEl = active.closest<HTMLElement>("[data-table-row]");
    const cell = active.closest<HTMLElement>("[data-table-cell]");
    if (!rowEl || !cell) return;
    const row = getCachedRows().indexOf(rowEl);
    const col = gridCells(rowEl).indexOf(cell);
    if (row >= 0 && col >= 0) activeCellRef.current = { row, col };
  }, [gridRef, getCachedRows, getCachedHeaders]);

  const focusCell = useCallback(
    (row: number, col: number) => {
      const root = gridRef.current;
      if (!root) return;

      const headers = getCachedHeaders();
      const rows = getCachedRows();

      const cell =
        row < 0
          ? headers[col]
          : (() => {
              const rowEl = rows[row];
              return rowEl ? gridCells(rowEl)[col] : undefined;
            })();

      if (!cell) return;

      root.querySelectorAll<HTMLElement>("[data-table-cell]").forEach((el) => {
        el.tabIndex = -1;
      });
      cell.tabIndex = 0;
      cell.focus();
      cell.scrollIntoView({ block: "nearest", inline: "nearest" });
      activeCellRef.current = { row, col };
    },
    [gridRef, getCachedRows, getCachedHeaders]
  );

  const applyKey = useCallback(
    (key: string, ctrlKey = false, target?: EventTarget | null): boolean => {
      if (!enabled) return false;

      const root = gridRef.current;
      if (!root) return false;

      syncFromDom();

      if (key === "Enter" || key === " ") {
        const el = (
          target instanceof HTMLElement ? target : document.activeElement
        ) as HTMLElement | null;
        if (el && shouldDeferNativeActivate(el)) return false;
      }

      // ── Read from cache — O(1) instead of O(DOM nodes) ──────────────────────
      const rows = getCachedRows();
      const headers = getCachedHeaders();

      const rowCount = rows.length || getRowCount();
      if (rowCount === 0) return false;

      const { row, col } = activeCellRef.current;
      const colCount =
        row < 0
          ? headers.length || getColCount(0)
          : rows[row]
            ? gridCells(rows[row]).length
            : getColCount(row);

      switch (key) {
        case "ArrowRight": {
          focusCell(row, Math.min(col + 1, Math.max(colCount - 1, 0)));
          return true;
        }
        case "ArrowLeft": {
          focusCell(row, Math.max(col - 1, 0));
          return true;
        }
        case "ArrowDown": {
          const nextRow = Math.min(row + 1, rowCount - 1);
          const nextCols = rows[nextRow]
            ? gridCells(rows[nextRow]).length
            : getColCount(nextRow);
          focusCell(
            nextRow,
            Math.min(Math.max(col, 0), Math.max(nextCols - 1, 0))
          );
          return true;
        }
        case "ArrowUp": {
          if (row <= 0 && headers.length > 0) {
            focusCell(-1, Math.min(col, headers.length - 1));
            return true;
          }
          const prevRow = Math.max(row - 1, 0);
          const prevCols = rows[prevRow]
            ? gridCells(rows[prevRow]).length
            : getColCount(prevRow);
          focusCell(prevRow, Math.min(col, Math.max(prevCols - 1, 0)));
          return true;
        }
        case "Home": {
          if (ctrlKey) focusCell(0, 0);
          else focusCell(row, 0);
          return true;
        }
        case "End": {
          if (ctrlKey) {
            const lastRow = rowCount - 1;
            const lastCols = rows[lastRow]
              ? gridCells(rows[lastRow]).length
              : getColCount(lastRow);
            focusCell(lastRow, Math.max(lastCols - 1, 0));
          } else {
            focusCell(row, Math.max(colCount - 1, 0));
          }
          return true;
        }
        case "Enter":
        case " ": {
          if (row < 0) {
            onHeaderActivate?.(col);
          } else if (onCellActivate) {
            onCellActivate(row, col);
          } else {
            const rowEl = rows[row];
            if (rowEl) gridCells(rowEl)[col]?.click();
          }
          return true;
        }
        case "PageDown": {
          const targetRow = Math.min(row + PAGE_JUMP, rowCount - 1);
          const cols = rows[targetRow]
            ? gridCells(rows[targetRow]).length
            : getColCount(targetRow);
          focusCell(targetRow, Math.min(col, Math.max(cols - 1, 0)));
          return true;
        }
        case "PageUp": {
          const targetRow = Math.max(row - PAGE_JUMP, 0);
          const cols = rows[targetRow]
            ? gridCells(rows[targetRow]).length
            : getColCount(targetRow);
          focusCell(targetRow, Math.min(col, Math.max(cols - 1, 0)));
          return true;
        }
        default:
          return false;
      }
    },
    [
      enabled,
      gridRef,
      getRowCount,
      getColCount,
      focusCell,
      syncFromDom,
      getCachedRows,
      getCachedHeaders,
      onCellActivate,
      onHeaderActivate,
    ]
  );

  const applyKeyRef = useRef(applyKey);
  applyKeyRef.current = applyKey;

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const handled = applyKey(e.key, !!e.ctrlKey, e.target);
      if (handled) {
        e.preventDefault();
        e.stopPropagation?.();
      }
    },
    [applyKey]
  );

  useEffect(() => {
    if (!enabled || !scope) return;

    const ids = GRID_MOVE_KEYS.map(({ id, key }) => {
      const shortcutId = `${scope}:grid:${id}`;
      registerShortcut(shortcutId, {
        key,
        description: `Table grid ${id}`,
        enabled: true,
        priority: 50,
        scope,
        command: {
          execute: (event?: KeyboardEvent) => {
            const { key: eventKey, ctrlKey } = comboToKey(key);
            applyKeyRef.current(
              eventKey,
              ctrlKey,
              event?.target ?? document.activeElement
            );
          },
        },
      });
      return shortcutId;
    });

    return () => {
      ids.forEach((id) => unregisterShortcut(id));
    };
  }, [enabled, scope, registerShortcut, unregisterShortcut]);

  useLayoutEffect(() => {
    if (!enabled || !scope) return;
    const node = gridRef.current;
    if (!node) return;

    const previousScope = { current: useEventRegistry.getState().activeScope };

    const onFocusIn = () => {
      const current = useEventRegistry.getState().activeScope;
      if (current !== scope) {
        previousScope.current = current;
      }
      setActiveScope(scope);
    };

    const onFocusOut = (event: FocusEvent) => {
      if (node.contains(event.relatedTarget as Node | null)) return;
      setActiveScope(previousScope.current || "global");
    };

    node.addEventListener("focusin", onFocusIn);
    node.addEventListener("focusout", onFocusOut);
    if (node.contains(document.activeElement)) {
      onFocusIn();
    }

    return () => {
      node.removeEventListener("focusin", onFocusIn);
      node.removeEventListener("focusout", onFocusOut);
      if (useEventRegistry.getState().activeScope === scope) {
        setActiveScope(previousScope.current || "global");
      }
    };
  }, [enabled, scope, gridRef, setActiveScope]);

  return {
    handleKeyDown,
    focusCell,
    activeCellRef,
    /** Read-only snapshot of the current DOM cache (for external consumers). */
    getCachedRows,
  };
}
