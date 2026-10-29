import React, { useCallback, useMemo } from "react";

import type { ColumnDef } from "@tanstack/react-table";
import type { FormDefinition } from "@ui/form/types";

import { useTableController } from "@ui/table/controller/useTableController";
import type {
  TableChromeFlags,
  TableExportBehavior,
  TableImportBehavior,
  TableImportSurface,
} from "@ui/table/mdap/table-entity";
import type {
  DataSource,
  TableFeature,
  TableMeta,
  ViewMode,
} from "@ui/table/types";
import { ZenithTable } from "@ui/table/ui/ZenithTable";
import type { ZenithTableViewProps } from "@ui/table/ui/ZenithTable";
import type { ResolvedTableMeta } from "@ui/table/meta/TableMetaDefaults";

/**
 * useZenithTable
 *
 * All-in-one hook that creates a fully wired table with composable features
 * and polymorphic view inversion.
 *
 * Supported composition styles:
 *   <Table><View><Header /><Body /></View></Table>          ← default table view
 *   <Table><View views={{ board: ..., calendar: ... }} /></Table>  ← view registry
 *
 * Chrome auto-render flags (pagination, toolbar, selectionActionBar) default
 * to `false` — consumer-owned by default for full layout control.
 *
 * @example
 * ```tsx
 * const engine = useZenithTable({
 *   meta: { id: "dispense" },
 *   columns,
 *   source: { type: "client", data },
 *   defaultView: "board",
 *   features: [
 *     ScrollRestorationFeature({ key: "dispense" }),
 *     KeyboardNavigationFeature(),
 *     PhysicsTrackingFeature({ estimateRowHeight: 48 }),
 *   ],
 * });
 *
 * return (
 *   <engine.Table>
 *     <engine.Table.ViewSwitcher views={["table", "board", "calendar"]} />
 *     <engine.Table.View views={{
 *       table: (items) => <><engine.Table.Header /><engine.Table.Body /></>,
 *       board: (items) => <KanbanBoard cards={items} />,
 *       calendar: (items) => <Calendar events={items} />,
 *     }} />
 *     <engine.Table.Pagination />
 *   </engine.Table>
 * );
 * ```
 */

export interface UseZenithTableConfig<T> {
  /** Table metadata (id is required, everything else has defaults) */
  meta: TableMeta;
  /** Column definitions */
  columns: ColumnDef<T>[];
  /** Data source — client-side array or server-side fetcher */
  source: DataSource<T>;
  /** Optional: total count for server-side pagination */
  totalCount?: number;
  /** Stable row identity for selection across server pages. Default: row index. */
  getRowId?: (originalRow: T, index: number) => string;
  /** Auto-render Pagination inside Table. Default: false (consumer-owned). */
  pagination?: boolean;
  /** Auto-render Toolbar inside Table. Default: false. */
  toolbar?: boolean;
  /** Auto-render MDAP FilterBar inside Table. Default: false. */
  filterBar?: boolean;
  /** Compiled MDAP filter form (from TableEntity.content.filters). */
  filterForm?: FormDefinition;
  /** Named chrome slots from `compileEntityToTableDef`. */
  chrome?: TableChromeFlags;
  serverExport?: TableExportBehavior;
  import?: TableImportBehavior;
  importSurface?: TableImportSurface;
  /** Auto-render SelectionActionBar inside Table. Default: false. */
  selectionActionBar?: boolean;
  /** Optional: custom className on root div */
  className?: string;
  /** Optional: loading override */
  loading?: boolean;
  /** Shortcut: striped rows */
  striped?: boolean;
  /** Shortcut: bordered table */
  bordered?: boolean;
  /** Shortcut: shadow elevation */
  shadow?: TableMeta["shadow"];
  /** Shortcut: sticky header */
  stickyHeader?: boolean;
  /**
   * Composable feature plug-ins that attach behaviour to the table lifecycle.
   * Each feature receives a TableFeatureContext on setup and cleans up on destroy.
   *
   * @example
   * ```tsx
   * features: [
   *   ScrollRestorationFeature({ key: "orders" }),
   *   KeyboardNavigationFeature(),
   *   PhysicsTrackingFeature({ estimateRowHeight: 48 }),
   * ]
   * ```
   */
  features?: TableFeature<T>[];
  /**
   * Default active view on first render. Default: "table".
   * Use with `<Table.ViewSwitcher>` so the user can switch.
   */
  defaultView?: ViewMode;
  /** Optional: render row customization */
  renderRow?: (props: {
    row: import("@tanstack/react-table").Row<T>;
    index: number;
    cells: React.ReactNode[];
    isSelected: boolean;
    isHovered: boolean;
  }) => React.ReactNode;
  /** Optional: render expanded action row panel */
  renderExpandedRow?: (props: {
    context: import("../types").RowContext<T>;
  }) => React.ReactNode;
  /** Optional: custom row HTML props */
  getRowProps?: (
    row: import("@tanstack/react-table").Row<T>,
    index: number
  ) => React.HTMLAttributes<HTMLTableRowElement>;
  /** Show paginated serial number index column (SL. NO.) */
  showIndex?: boolean;
  /** Table row variant: default | cards / separated */
  variant?: TableMeta["variant"];
  /** Override container max height */
  maxHeight?: string | number;
  /** Row expansion configuration */
  expansion?: TableMeta["expansion"];
  /** Enable row virtualization for large datasets */
  virtualized?: boolean;
  /** Estimated row height in pixels for virtualization (default: 48) */
  estimateRowHeight?: number;
}

type TableRootProps = {
  children: React.ReactNode;
  className?: string;
};

export interface UseZenithTableResult<T = any> {
  /**
   * Pre-wired table root. Exposes all sub-components as static properties.
   *
   * Sub-components:
   *  .Header           — column header row
   *  .Body             — data rows (supports renderRow customisation)
   *  .View             — polymorphic view slot (views registry, board, list, or default table)
   *  .Pagination       — page controls
   *  .Toolbar          — search/sort/filter/export toolbar
   *  .FilterBar        — MDAP filter chips
   *  .SelectionActionBar — bulk-action bar
   *  .ViewSwitcher     — view mode toggle buttons
   */
  Table: React.FC<TableRootProps> & {
    Header: React.FC;
    Body: React.FC<import("../ui/components/ZenithTableBody").ZenithTableBodyProps>;
    Footer: React.FC<import("../ui/components/ZenithTableFooter").ZenithTableFooterProps>;
    View: React.FC<ZenithTableViewProps<T>>;
    Pagination: React.FC;
    Toolbar: React.FC;
    FilterBar: React.FC;
    SelectionActionBar: typeof ZenithTable.SelectionActionBar;
    ViewSwitcher: typeof ZenithTable.ViewSwitcher;
  };
  /** Shortcut: <Table.Header /> */
  Header: React.FC;
  /** Shortcut: <Table.Body /> */
  Body: React.FC<import("../ui/components/ZenithTableBody").ZenithTableBodyProps>;
  /** Shortcut: <Table.Footer /> */
  Footer: React.FC<import("../ui/components/ZenithTableFooter").ZenithTableFooterProps>;
  /** Shortcut: <Table.View views={...} /> */
  View: React.FC<ZenithTableViewProps<T>>;
  /** Shortcut: <Table.Pagination /> */
  Pagination: React.FC;
  /** Shortcut: <Table.Toolbar /> */
  Toolbar: React.FC;
  /** Shortcut: <Table.FilterBar /> */
  FilterBar: React.FC;
  /** Shortcut: <Table.SelectionActionBar> */
  SelectionActionBar: typeof ZenithTable.SelectionActionBar;
  /** Shortcut: <Table.ViewSwitcher views={["table","board"]} /> */
  ViewSwitcher: typeof ZenithTable.ViewSwitcher;
  /** Whether data is loading */
  loading: boolean;
  /** Error from data fetching */
  error: Error | null;
  /** Refetch data (server mode only) */
  refetch: () => void;
  /** Apply current filters and fetch (resets to page 0). Use with `gate: "manual"`. */
  search: () => void;
  /** False when `source.guard(params)` blocked eligibility */
  canFetch: boolean;
  /** True after at least one successful server fetch */
  hasFetched: boolean;
  /** Total row count */
  totalCount: number;
  /** Resolved meta with all defaults filled in */
  meta: ResolvedTableMeta;
}

export function useZenithTable<T>(
  config: UseZenithTableConfig<T>
): UseZenithTableResult<T> {
  const {
    meta,
    columns,
    source,
    totalCount: totalCountProp,
    pagination = false,
    toolbar = false,
    filterBar = false,
    filterForm,
    chrome,
    serverExport,
    import: tableImport,
    importSurface,
    selectionActionBar = false,
    getRowId,
    className,
    loading: loadingProp,
    renderRow,
    renderExpandedRow,
    getRowProps,
    showIndex,
    variant,
    maxHeight,
    expansion,
    striped,
    bordered,
    shadow,
    stickyHeader,
    features,
    defaultView = "table",
    virtualized,
    estimateRowHeight,
  } = config;

  const mergedMetaInput: TableMeta = useMemo(
    () => ({
      ...meta,
      ...(variant !== undefined && { variant }),
      ...(maxHeight !== undefined && { maxHeight }),
      ...(showIndex !== undefined && { showIndex }),
      ...(expansion !== undefined && { expansion }),
    }),
    [meta, variant, maxHeight, showIndex, expansion]
  );

  const controller = useTableController({
    meta: mergedMetaInput,
    columns,
    source,
    totalCount: totalCountProp,
    getRowId,
  });
  const {
    engine,
    meta: resolvedMeta,
    loading: controllerLoading,
    error,
    refetch,
    search,
    canFetch,
    hasFetched,
    totalCount: controllerTotalCount,
  } = controller;

  const totalCount = totalCountProp ?? controllerTotalCount;
  const loading = loadingProp ?? controllerLoading;
  const gate = source.type === "server" ? (source.gate ?? "auto") : "auto";

  // TD3: Group all chrome / visual config into one stable object so the
  // TableRoot useCallback dep array doesn't grow unboundedly.
  const chromeConfig = useMemo(
    () => ({
      pagination,
      toolbar,
      filterBar,
      selectionActionBar,
      filterForm,
      chrome,
      serverExport,
      tableImport,
      importSurface,
      className,
      striped,
      bordered,
      shadow,
      stickyHeader,
      features,
      defaultView,
    }),
    [
      pagination,
      toolbar,
      filterBar,
      selectionActionBar,
      filterForm,
      chrome,
      serverExport,
      tableImport,
      importSurface,
      className,
      striped,
      bordered,
      shadow,
      stickyHeader,
      features,
      defaultView,
    ]
  );

  // ── Sub-component shortcuts ────────────────────────────────────────────────
  const Header = useCallback(() => <ZenithTable.Header />, []);
  const Body = useCallback(
    (
      bodyProps: import("../ui/components/ZenithTableBody").ZenithTableBodyProps = {}
    ) => (
      <ZenithTable.Body
        showIndex={showIndex}
        renderExpandedRow={renderExpandedRow as never}
        getRowProps={getRowProps as never}
        renderRow={renderRow as never}
        virtualized={virtualized}
        estimateRowHeight={estimateRowHeight}
        {...bodyProps}
      />
    ),
    [showIndex, renderExpandedRow, getRowProps, renderRow, virtualized, estimateRowHeight]
  );
  const Footer = useCallback(
    (
      footerProps: import("../ui/components/ZenithTableFooter").ZenithTableFooterProps = {}
    ) => <ZenithTable.Footer {...footerProps} />,
    []
  );
  const View = useCallback(
    (viewProps: ZenithTableViewProps<T> = {}) => (
      <ZenithTable.View {...viewProps} />
    ),
    []
  );
  const PaginationComp = useCallback(() => <ZenithTable.Pagination />, []);
  const Toolbar = useCallback(() => <ZenithTable.Toolbar />, []);
  const FilterBar = useCallback(() => <ZenithTable.FilterBar />, []);
  const SelectionActionBar = ZenithTable.SelectionActionBar;
  const ViewSwitcher = ZenithTable.ViewSwitcher;

  // ── Root renderer ─────────────────────────────────────────────────────────
  const TableRoot = useCallback(
    ({ children, className: childClassName }: TableRootProps) => (
      <ZenithTable
        engine={engine}
        meta={resolvedMeta}
        totalCount={totalCount}
        className={childClassName ?? chromeConfig.className}
        striped={chromeConfig.striped}
        bordered={chromeConfig.bordered}
        shadow={chromeConfig.shadow}
        stickyHeader={chromeConfig.stickyHeader}
        search={search}
        refetch={refetch}
        canFetch={canFetch}
        hasFetched={hasFetched}
        gate={gate}
        loading={loading}
        error={error}
        filterForm={chromeConfig.filterForm}
        chrome={chromeConfig.chrome}
        serverExport={chromeConfig.serverExport}
        tableImport={chromeConfig.tableImport}
        importSurface={chromeConfig.importSurface}
        features={chromeConfig.features}
        defaultView={chromeConfig.defaultView}
      >
        {chromeConfig.toolbar ? <ZenithTable.Toolbar /> : null}
        {chromeConfig.filterBar ? <ZenithTable.FilterBar /> : null}
        {chromeConfig.selectionActionBar ? (
          <ZenithTable.SelectionActionBar>
            <ZenithTable.SelectionActionBar.Info />
          </ZenithTable.SelectionActionBar>
        ) : null}
        {children}
        {chromeConfig.pagination ? <ZenithTable.Pagination /> : null}
      </ZenithTable>
    ),
    [
      engine,
      resolvedMeta,
      totalCount,
      loading,
      error,
      search,
      refetch,
      canFetch,
      hasFetched,
      gate,
      chromeConfig,
    ]
  );

  const Table = useMemo(
    () =>
      Object.assign(TableRoot, {
        Header,
        Body,
        Footer,
        View,
        Pagination: PaginationComp,
        Toolbar,
        FilterBar,
        SelectionActionBar,
        ViewSwitcher,
      }),
    [
      TableRoot,
      Header,
      Body,
      Footer,
      View,
      PaginationComp,
      Toolbar,
      FilterBar,
      SelectionActionBar,
      ViewSwitcher,
    ]
  );

  return {
    Table,
    Header,
    Body,
    Footer,
    View,
    Pagination: PaginationComp,
    Toolbar,
    FilterBar,
    SelectionActionBar,
    ViewSwitcher,
    loading,
    error,
    refetch,
    search,
    canFetch,
    hasFetched,
    totalCount,
    meta: resolvedMeta,
  };
}
