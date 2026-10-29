import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
} from "react";

import { cn } from "@core/libs/utils";
import type { FormDefinition } from "@ui/form/types";
import {
  TableDOMProvider,
  buildTableHandle,
  useTableDOM,
  useTableDOMRefs,
} from "@ui/table/core/TableDOMContext";
import {
  TableEngineContext,
  useTableEngine,
} from "@ui/table/core/TableEngineContext";
import { TableFeaturesProvider } from "@ui/table/core/TableFeaturesContext";
import { TableFetchProvider } from "@ui/table/core/TableFetchContext";
import { TableLayoutProvider } from "@ui/table/core/TableLayoutContext";
import {
  TableMetaProvider,
  useTableMeta,
} from "@ui/table/core/TableMetaContext";
import {
  TablePhysicsProvider,
  useTablePhysics,
} from "@ui/table/core/TablePhysicsContext";
import {
  TableViewProvider,
  useTableView,
} from "@ui/table/core/TableViewContext";
import { createTableCompound } from "@ui/table/core/createTableCompound";
import type { ITableEngine } from "@ui/table/core/table-engine";
import { useScrollRestoration } from "@ui/table/hooks/useScrollRestoration";
import { TableChromeProvider } from "@ui/table/mdap/TableChromeContext";
import { TableFilterProvider } from "@ui/table/mdap/TableFilterContext";
import type {
  TableChromeFlags,
  TableExportBehavior,
  TableImportBehavior,
  TableImportSurface,
} from "@ui/table/mdap/table-entity";
import { resolveTablePropsMeta } from "@ui/table/meta/TableMetaDefaults";
import { SelectionActionBar } from "@ui/table/plugins/selection";
import type {
  TableFeature,
  TableFetchGate,
  TableHandle,
  TableMeta,
  ViewMode,
  ViewRenderer,
} from "@ui/table/types";
import type {
  TableSurfaceLayoutConfig,
  ZenithTablePreset,
} from "@ui/table/types/layout";

import { Table } from "./TablePrimitives";
import { SelectionHUD } from "./components/SelectionHUD";
import { TableErrorBoundary } from "./components/TableErrorBoundary";
import { TableFilterBar } from "./components/TableFilterBar";
import { ZenithTableBody } from "./components/ZenithTableBody";
import { ZenithTableFooter } from "./components/ZenithTableFooter";
import { ZenithTableHeader } from "./components/ZenithTableHeader";
import { ZenithTablePagination } from "./components/ZenithTablePagination";
import { ZenithTableToolbar } from "./components/ZenithTableToolbar";

// ─── Internal bridge ──────────────────────────────────────────────────────────

/**
 * TotalCountSync — bridges an external totalCount into the physics store.
 * Must be rendered inside TablePhysicsProvider.
 */
function TotalCountSync({ totalCount }: { totalCount: number }) {
  const setTotalCount = useTablePhysics((s) => s.setTotalCount);
  useEffect(() => {
    setTotalCount(totalCount);
  }, [totalCount, setTotalCount]);
  return null;
}

/**
 * TopOffsetSync — measures table container top offset relative to viewport
 * and updates CSS variable `--zenith-top-offset` on resize.
 */
function TopOffsetSync({
  containerRef,
}: {
  containerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const setTopOffset = useTablePhysics((s) => s.setTopOffset);

  useEffect(() => {
    const measure = () => {
      if (!containerRef.current) return;
      const top = Math.max(0, containerRef.current.getBoundingClientRect().top);
      containerRef.current.style.setProperty("--zenith-top-offset", `${top}px`);
      setTopOffset(top);
    };

    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [containerRef, setTopOffset]);

  return null;
}

/**
 * ViewportObserverSync — observes table container width/height and updates
 * viewport metrics in the physics store and container CSS variables.
 */
function ViewportObserverSync({
  containerRef,
}: {
  containerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const setViewport = useTablePhysics((s) => s.setViewport);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        const breakpoint =
          width < 640 ? "mobile" : width < 1024 ? "tablet" : "desktop";
        el.style.setProperty("--zenith-viewport-width", `${width}px`);
        el.style.setProperty("--zenith-viewport-height", `${height}px`);
        setViewport({
          width,
          height,
          breakpoint,
          isMobile: breakpoint === "mobile",
          isTablet: breakpoint === "tablet",
          isDesktop: breakpoint === "desktop",
        });
      }
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, [containerRef, setViewport]);

  return null;
}

// ─── Root Component ───────────────────────────────────────────────────────────

export interface ZenithTableProps<T> extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "children"
> {
  engine: ITableEngine<T>;
  meta: TableMeta;
  children: React.ReactNode;
  totalCount?: number;
  /** Shortcut: striped rows (merged into meta.striped) */
  striped?: boolean;
  /** Shortcut: striped columns (merged into meta.columnStriped) */
  columnStriped?: boolean;
  /** Shortcut: bordered table (merged into meta.bordered) */
  bordered?: boolean;
  /** Shortcut: shadow elevation (merged into meta.shadow) */
  shadow?: TableMeta["shadow"];
  /** Shortcut: sticky header (merged into meta.stickyHeader) */
  stickyHeader?: boolean;
  /** Shortcut: show index/SL NO column (merged into meta.showIndex) */
  showIndex?: boolean;
  /** Custom index header label (merged into meta.indexLabel) */
  indexLabel?: string;
  /** Header column filter popover toggle (merged into meta.enableHeaderFilter) */
  enableHeaderFilter?: boolean;
  /** Header column sort direction arrows toggle (merged into meta.showSortIcon) */
  showSortIcon?: boolean;
  /** Density token preset: compact (34px) | comfortable (42px) */
  density?: "compact" | "comfortable";
  /** Apply current filters and fetch (resets to page 0). Used by Toolbar when gate is manual. */
  search?: () => void;
  refetch?: () => void;
  canFetch?: boolean;
  hasFetched?: boolean;
  gate?: TableFetchGate;
  loading?: boolean;
  error?: Error | null;
  /** Compiled MDAP filter FormDefinition (FilterBar + column popovers). */
  filterForm?: FormDefinition | null;
  /** Named chrome slots (`exportBtn` / `importBtn` / `filterStatusBadge`). */
  chrome?: TableChromeFlags;
  serverExport?: TableExportBehavior | null;
  tableImport?: TableImportBehavior | null;
  importSurface?: TableImportSurface | null;
  /**
   * Composable feature plug-ins (scroll restoration, physics, keyboard nav, etc).
   * Each feature runs setup() on mount and destroy() on unmount.
   */
  features?: TableFeature<T>[];
  /** Default active view mode. Default: "table". */
  defaultView?: ViewMode;
  /** Layout and alignment configurations */
  layout?: TableSurfaceLayoutConfig;
  /** High-level enterprise layout preset (crud | analytics | minimal | master-detail) */
  preset?: ZenithTablePreset;
  /** Selection indicator display mode: toolbar banner, floating HUD, or both */
  selectionDisplay?: "toolbar" | "floating-hud" | "both";
  renderPagination?: (props: {
    engine: ITableEngine<T>;
    meta: Required<TableMeta>;
  }) => React.ReactNode;
}

const ZenithTableRoot = forwardRef<TableHandle, ZenithTableProps<any>>(
  (
    {
      engine,
      meta,
      children,
      className,
      totalCount,
      striped,
      columnStriped,
      bordered,
      shadow,
      stickyHeader,
      showIndex,
      indexLabel,
      enableHeaderFilter,
      showSortIcon,
      density,
      search,
      refetch,
      canFetch,
      hasFetched,
      gate,
      loading,
      error,
      filterForm,
      chrome,
      serverExport,
      tableImport,
      importSurface,
      features,
      defaultView = "table",
      layout,
      preset,
      selectionDisplay,
      ...rest
    },
    ref
  ) => {
    const domRefs = useTableDOMRefs();

    useImperativeHandle(ref, () => buildTableHandle(domRefs), [domRefs]);

    // Merge shortcut props into meta (props override meta)
    const mergedMeta = resolveTablePropsMeta(meta, {
      striped,
      columnStriped,
      bordered,
      shadow,
      stickyHeader,
      showIndex,
      indexLabel,
      enableHeaderFilter,
      showSortIcon,
      density,
    });

    // Scroll position restoration (Yafei pattern: list → detail → back to list)
    useScrollRestoration({
      tableId: mergedMeta.id,
      scrollerRef: domRefs.scrollerRef,
      enabled: true,
    });

    const chromeValue = useMemo(
      () => ({
        exportBtn: Boolean(chrome?.exportBtn),
        importBtn: Boolean(chrome?.importBtn),
        deleteBtn: Boolean(chrome?.deleteBtn),
        filterStatusBadge: Boolean(chrome?.filterStatusBadge),
        serverExport: serverExport ?? null,
        tableImport: tableImport ?? null,
        importSurface: importSurface ?? null,
      }),
      [chrome, serverExport, tableImport, importSurface]
    );

    const mergedLayout = useMemo<TableSurfaceLayoutConfig>(
      () => ({
        ...layout,
        selectionDisplay:
          selectionDisplay ?? layout?.selectionDisplay ?? "toolbar",
      }),
      [layout, selectionDisplay]
    );

    return (
      <TableErrorBoundary tableId={mergedMeta.id}>
        <TableMetaProvider meta={mergedMeta}>
          <TableEngineContext.Provider value={{ engine }}>
            <TableFetchProvider
              value={{
                search,
                refetch,
                canFetch,
                hasFetched,
                gate,
                loading,
                error,
              }}
            >
              <TableFilterProvider value={filterForm ?? null}>
                <TableChromeProvider value={chromeValue}>
                  <TablePhysicsProvider containerRef={domRefs.containerRef}>
                    <TableLayoutProvider layout={mergedLayout} preset={preset}>
                      {/* Bridge server-side totalCount into the physics store */}
                      {totalCount !== undefined && (
                        <TotalCountSync totalCount={totalCount} />
                      )}
                      <TableDOMProvider refs={domRefs}>
                        <TableViewProvider defaultView={defaultView}>
                          {/* Features run after DOM and view contexts are ready */}
                          <TableFeaturesProvider features={features ?? []}>
                            <TopOffsetSync
                              containerRef={domRefs.containerRef}
                            />
                            <ViewportObserverSync
                              containerRef={domRefs.containerRef}
                            />
                            <div
                              ref={domRefs.containerRef}
                              className={cn(
                                "flex flex-col gap-0 relative rounded-2xl border border-border/40 bg-card shadow-premium overflow-hidden",
                                className
                              )}
                              style={{
                                height: mergedMeta.maxHeight
                                  ? String(mergedMeta.maxHeight)
                                  : "calc(100dvh - var(--zenith-top-offset, 0px))",
                              }}
                              data-table-root
                              data-testid={mergedMeta.id}
                              role="region"
                              aria-label="Data table"
                              {...rest}
                            >
                              {children}
                            </div>
                            {(mergedLayout.selectionDisplay ===
                              "floating-hud" ||
                              mergedLayout.selectionDisplay === "both") && (
                              <SelectionHUD />
                            )}
                          </TableFeaturesProvider>
                        </TableViewProvider>
                      </TableDOMProvider>
                    </TableLayoutProvider>
                  </TablePhysicsProvider>
                </TableChromeProvider>
              </TableFilterProvider>
            </TableFetchProvider>
          </TableEngineContext.Provider>
        </TableMetaProvider>
      </TableErrorBoundary>
    );
  }
);
ZenithTableRoot.displayName = "ZenithTableRoot";

// ─── View Container (Polymorphic — View Inversion) ────────────────────────────

/**
 * ZenithTableView — the Polymorphic View Slot
 *
 * Three usage patterns, unified:
 *
 * 1. Legacy (children only — renders default HTML table):
 *    <ZenithTable.View>
 *      <ZenithTable.Header />
 *      <ZenithTable.Body />
 *    </ZenithTable.View>
 *
 * 2. Slot props for simple custom views:
 *    <ZenithTable.View board={<KanbanBoard />} list={<ListCards />}>
 *      <ZenithTable.Header />
 *      <ZenithTable.Body />
 *    </ZenithTable.View>
 *
 * 3. View Inversion Registry (full polymorphism):
 *    <ZenithTable.View views={{
 *      table: (items, engine) => <...>,
 *      board: (items, engine, ctx) => <KanbanBoard items={items} />,
 *      calendar: (items, engine, ctx) => <Calendar events={items} />,
 *    }} />
 */
export interface ZenithTableViewProps<T = any> {
  /** Rendered when `activeView === "table"` and no `views` map is provided. */
  children?: React.ReactNode;
  /** Simple slot: rendered when `activeView === "board"` (no views map needed). */
  board?: React.ReactNode;
  /** Simple slot: rendered when `activeView === "list"` (no views map needed). */
  list?: React.ReactNode;
  /** Enable virtualised rendering for the default table view. */
  virtualized?: boolean;
  /**
   * View Inversion Registry.
   * When provided, the active view key is resolved here first.
   * The renderer receives:
   *   - `items` — current engine row data (after filter/sort/page)
   *   - `engine` — the full ITableEngine for imperative access
   *   - `context` — rows, totalCount, meta, domRefs
   */
  views?: Partial<Record<ViewMode, ViewRenderer<T>>>;
}

function ZenithTableView<T = any>({
  children,
  board,
  list,
  virtualized,
  views,
}: ZenithTableViewProps<T>) {
  const { activeView } = useTableView();
  const { scrollerRef, tableRef } = useTableDOM();
  const meta = useTableMeta();

  // ── View Inversion: registry takes priority ───────────────────────────────
  if (views) {
    const renderer = views[activeView] ?? views["table"];
    if (renderer) {
      // Engine access via hook — safe because we're inside TableEngineContext
      // Rendered lazily so the engine hook call doesn't break when views is absent.
      return (
        <ViewRegistryRenderer<T>
          renderer={renderer}
          scrollerRef={scrollerRef}
        />
      );
    }
  }

  // ── Simple slot props fallback ────────────────────────────────────────────
  if (activeView === "board" && board) return <>{board}</>;
  if (activeView === "list" && list) return <>{list}</>;

  // ── Default HTML Table view ───────────────────────────────────────────────
  return (
    <Table
      ref={tableRef}
      scrollerRef={scrollerRef}
      virtualized={virtualized}
      striped={meta.striped}
      bordered={meta.bordered}
      shadow={meta.shadow}
    >
      {children}
    </Table>
  );
}
ZenithTableView.displayName = "ZenithTableView";

/**
 * ViewRegistryRenderer — isolated component so hooks run after view check.
 * Reads engine + meta + dom inside context and calls the active ViewRenderer.
 */
function ViewRegistryRenderer<T>({
  renderer,
  scrollerRef,
}: {
  renderer: ViewRenderer<T>;
  scrollerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const engine = useTableEngine<T>();
  const meta = useTableMeta();
  const domCtx = useTableDOM();
  const totalCount = useTablePhysics((s) => s.totalDataCount);

  const rows = engine.getRowModel().rows;
  const items = rows.map((r) => r.original);

  const node = renderer(items, engine, {
    rows,
    totalCount,
    meta,
    domRefs: {
      containerRef: domCtx.containerRef,
      scrollerRef,
      tableRef: domCtx.tableRef,
      headerRef: domCtx.headerRef,
      bodyRef: domCtx.bodyRef,
      paginationRef: domCtx.paginationRef,
    },
  });

  return (
    <div
      ref={scrollerRef}
      className="zenith-view-scroller flex-1 min-h-0 overflow-auto scrollbar-thin scrollbar-thumb-primary/20"
    >
      {node}
    </div>
  );
}

// ─── View Switcher ────────────────────────────────────────────────────────────

export interface ZenithTableViewSwitcherProps {
  /** The view modes to show as toggle buttons. */
  views: ViewMode[];
  /** Optional label map for display text. Defaults to capitalised mode name. */
  labels?: Partial<Record<ViewMode, string>>;
  className?: string;
}

function ZenithTableViewSwitcher({
  views,
  labels,
  className,
}: ZenithTableViewSwitcherProps) {
  const { activeView, setView } = useTableView();

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 bg-muted/60 p-1 rounded-lg border border-border/40",
        className
      )}
      role="tablist"
      aria-label="Switch view"
    >
      {views.map((mode) => {
        const label =
          labels?.[mode] ?? mode.charAt(0).toUpperCase() + mode.slice(1);
        return (
          <button
            key={mode}
            role="tab"
            aria-selected={activeView === mode}
            onClick={() => setView(mode)}
            className={cn(
              "px-3 py-1 text-xs font-semibold rounded capitalize transition-all",
              activeView === mode
                ? "bg-background shadow-sm text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
ZenithTableViewSwitcher.displayName = "ZenithTableViewSwitcher";

// ─── Compound Component Assembly ──────────────────────────────────────────────

export const ZenithTable = createTableCompound(ZenithTableRoot, {
  Header: ZenithTableHeader,
  Body: ZenithTableBody,
  Footer: ZenithTableFooter,
  /** Polymorphic view slot: table (default) | board | list | calendar | any custom view */
  View: ZenithTableView,
  Pagination: ZenithTablePagination,
  Toolbar: ZenithTableToolbar,
  FilterBar: TableFilterBar,
  SelectionActionBar: SelectionActionBar,
  SelectionHUD: SelectionHUD,
  /** View mode toggle buttons */
  ViewSwitcher: ZenithTableViewSwitcher,
});
ZenithTable.displayName = "ZenithTable";

// Re-export view types for consumer use
export type { ZenithTableViewProps as ZenithViewProps };
