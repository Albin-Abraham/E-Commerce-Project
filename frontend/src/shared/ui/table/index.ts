/**
 * ZenithTable — Public API Surface
 *
 * Exposes what consumers need to build, customize, and interact with the table.
 * Fully supports Microkernel architecture, Composable Toolbar Primitives,
 * Layout & Alignment Presets, and Design Data Viewport Physics.
 */

// 1. Core Component & Presets
export { ZenithTable } from "./ui/ZenithTable";
export {
  PRESET_CONFIGS,
  resolvePresetLayout,
} from "./ui/ZenithTablePresets";

// 2. Types
export type {
  TableMeta,
  TableColumnMeta,
  TableFeatureMeta,
  TableUrlMeta,
  TableHandle,
  DataSource,
  ServerDataSource,
  TableFetchGate,
  TableQueryParams,
  TableServerResponse,
  TableTaskStatus,
  PaginationMeta,
  PaginationContext,
  PaginationLabel,
  TableUISlots,
  CellSlotProps,
  RowSlotProps,
  HeaderSlotProps,
  PaginationSlotProps,
  EmptySlotProps,
  LoadingSlotProps,
  ErrorSlotProps,
  FormFieldSchema,
  ViewMode,
  TableFeature,
  TableFeatureContext,
  ViewRenderer,
} from "./types";

export type {
  TableSurfaceLayoutConfig,
  ZenithTablePreset,
  ToolbarLayout,
  ToolbarAlign,
  SearchAlign,
  SearchVariant,
  SearchWidth,
  FilterPlacement,
  FilterAlign,
  PaginationPosition,
  PaginationAlign,
} from "./types/layout";

export type { TableViewportMetrics } from "./core/createTablePhysicsStore";

// 3. Controllers & Services
export { useTableController } from "./controller/useTableController";
export { useZenithTable } from "./hooks/useZenithTable";
export type {
  UseZenithTableConfig,
  UseZenithTableResult,
} from "./hooks/useZenithTable";
export { useMDAPTable } from "./hooks/useMDAPTable";
export type { UseMDAPTableResult } from "./hooks/useMDAPTable";
export { TableCore } from "./core/TableCore";
export { TableUrl } from "./url/TableUrl";

// 4. Primitive UI Components & Custom Slots
export { TableAtomicCell } from "./ui/TableAtomicCell";
export {
  TH,
  TD,
  TR,
  THead,
  TBody,
  Table,
  ResizeHandle,
} from "./ui/TablePrimitives";
export {
  ZenithTableFooter,
  type ZenithTableFooterProps,
  type AggregationType,
} from "./ui/components/ZenithTableFooter";
export { TableErrorBoundary } from "./ui/components/TableErrorBoundary";
export type { TableErrorBoundaryProps } from "./ui/components/TableErrorBoundary";
export { SelectionHUD } from "./ui/components/SelectionHUD";
export type { SelectionHUDProps } from "./ui/components/SelectionHUD";
export { FilterDrawer } from "./ui/components/FilterDrawer";
export type { FilterDrawerProps } from "./ui/components/FilterDrawer";

// 5. Toolbar & Layout Primitives
export {
  ZenithTableToolbar,
  type ZenithTableToolbarProps,
} from "./ui/components/ZenithTableToolbar";
export {
  ToolbarStart,
  ToolbarCenter,
  ToolbarEnd,
  ToolbarSlot,
  ToolbarDensity,
  ToolbarSelectionType,
  ToolbarFilters,
  ToolbarSort,
  ToolbarColumns,
  ToolbarActions,
  ToolbarFilterPills,
  ToolbarSelectionBanner,
} from "./ui/components/toolbar/ToolbarPrimitives";
export {
  ToolbarSearch,
  type ToolbarSearchProps,
} from "./ui/components/toolbar/ToolbarSearch";
export { TableFilterBar } from "./ui/components/TableFilterBar";
export { ZenithTablePagination } from "./ui/components/ZenithTablePagination";
export type { ZenithTablePaginationProps } from "./ui/components/ZenithTablePagination";

// 6. Engine Abstraction & Contexts
export type { ITableEngine } from "./core/table-engine";
export { TanStackAdapter } from "./core/TanStackAdapter";
export {
  TableLayoutProvider,
  useTableLayout,
} from "./core/TableLayoutContext";
export {
  TablePhysicsProvider,
  useTablePhysics,
  useTableCellAtom,
  useIsRowLocked,
  useIsRowExpanded,
  useTableViewport,
  useTableBreakpoint,
} from "./core/TablePhysicsContext";
export {
  TableDOMProvider,
  useTableDOM,
  useTableDOMRefs,
} from "./core/TableDOMContext";
export {
  TableFeaturesProvider,
  useFeatures,
  useFeature,
} from "./core/TableFeaturesContext";
export { useTableMeta, useMeta } from "./core/TableMetaContext";
export { useTableView } from "./core/TableViewContext";
export { useTableEngine, useTableContext } from "./core/TableEngineContext";

// 7. Pagination Helpers
export { getPageNumbers, getPageRange } from "./utils/PaginationHelpers";
export { resolvePaginationLabel } from "./utils/resolvePaginationLabel";

// 8. Default State Components
export {
  DefaultEmptyState,
  DefaultLoadingState,
  DefaultErrorState,
} from "./ui/states";

// 9. Headless UI Primitives
export { ProgressModal } from "./ui/primitives/ProgressModal";
export type {
  ProgressModalProps,
  TaskStatus as ProgressTaskStatus,
} from "./ui/primitives/ProgressModal";
export {
  TaskStatus,
  DefaultSummary,
  DefaultErrorList,
} from "./ui/primitives/TaskStatus";
export type {
  TaskStatusProps,
  ImportSummary as TaskImportSummary,
} from "./ui/primitives/TaskStatus";
export {
  ScopeSelector,
  DefaultScopeSelector,
} from "./ui/primitives/ScopeSelector";
export type {
  ScopeSelectorProps,
  ScopeOption,
} from "./ui/primitives/ScopeSelector";

// 10. Inline Edit
export {
  InlineEditProvider,
  useInlineEditContext,
} from "./core/InlineEditContext";
export type {
  InlineEditContextValue,
  InlineEditProviderProps,
} from "./core/InlineEditContext";
export { InlineEditCell } from "./ui/components/InlineEditCell";
export type { InlineEditCellProps } from "./ui/components/InlineEditCell";

// 11. CSV & Validation Utilities
export {
  parseCSV,
  generateCSV,
  generateCSVFast,
  downloadCSV,
  downloadBlob,
} from "./utils/csv";
export {
  validateExportData,
  validateImportFile,
  validateCSVHeaders,
} from "./utils/validation";
export { validateTableConfig, validateColumns } from "./utils/validateConfig";
export { TableColumnFactory } from "./utils/TableColumnFactory";
export { extractQueryParams } from "./utils/query-params";
export {
  compileEntityToTableDef,
  compileFiltersToFormDef,
  tableCellRegistry,
} from "./mdap";
export type {
  TableEntity,
  TableContentDefinition,
  TableBehaviorDefinition,
  TableSurfaceDefinition,
  TablePresentationDefinition,
  TableExportBehavior,
  TableImportBehavior,
  TableImportSurface,
  CompiledTableDef,
  TableChromeFlags,
  TableCellRenderer,
  TableCellRenderContext,
} from "./mdap";
export type {
  ExportValidationRule,
  ImportFileValidationRules,
  ValidationError,
  ImportError as ImportValidationError,
  ValidationResult,
  ImportValidationResult,
} from "./utils/validation";

// 12. Hooks & Preference Persistence
export { useGridKeyboardNavigation } from "./hooks/useGridKeyboardNavigation";
export { useExportTask } from "./hooks/useExportTask";
export type {
  UseExportTaskOptions,
  ExportTaskStatus,
  ExportTaskState,
} from "./hooks/useExportTask";
export { useExportService } from "./hooks/useExportService";
export type {
  ExportServiceConfig,
  CreateExportParams,
} from "./hooks/useExportService";
export { useImportTask } from "./hooks/useImportTask";
export type {
  UseImportTaskOptions,
  ImportTaskStatus,
  ImportSummary,
  ImportError,
} from "./hooks/useImportTask";
export { useImportService } from "./hooks/useImportService";
export type { ImportServiceConfig } from "./hooks/useImportService";
export { useImportValidation } from "./hooks/useImportValidation";
export type { UseImportValidationOptions } from "./hooks/useImportValidation";
export { useTablePreferences } from "./hooks/useTablePreferences";
export type { UseTablePreferencesOptions } from "./hooks/useTablePreferences";

// 13. MetaSchemaBridge
export { MetaSchemaBridge } from "@ui/form/utils/MetaSchemaBridge";
export type {
  HeaderMetaSchema,
  HeaderMetaSchemaField,
} from "@ui/form/utils/MetaSchemaBridge";

// 14. Actions Column Utility
export { createActionsColumn } from "./utils/actionsColumn";
export type { RowActionsSlotProps } from "./types";

// 15. Scroll Restoration
export { useScrollRestoration } from "./hooks/useScrollRestoration";
export type { UseScrollRestorationOptions } from "./hooks/useScrollRestoration";

// 16. Composable Feature Plug-ins
export {
  ScrollRestorationFeature,
  KeyboardNavigationFeature,
  PhysicsTrackingFeature,
} from "./features";
export type {
  ScrollRestorationFeatureOptions,
  ScrollRestorationApi,
  KeyboardNavigationOptions,
  KeyboardNavigationApi,
  PhysicsMetrics,
  PhysicsTrackingApi,
} from "./features";

// 17. DCS / ECS Surface Popovers & Row Action Presets
export { RowActionPanel } from "./ui/components/RowActionPanel";
export type {
  RowActionPanelProps,
  RowActionItem,
} from "./ui/components/RowActionPanel";
export { ToolbarFilterPopover } from "./ui/components/ToolbarFilterPopover";
export { ToolbarSortPopover } from "./ui/components/ToolbarSortPopover";
export { ToolbarColumnVisibilityDropdown } from "./ui/components/ToolbarColumnVisibilityDropdown";

// 18. New Types
export type {
  TableRowVariant,
  RowExpansionMode,
  RowExpansionPolicy,
  RowContext,
  RowExpansionConfig,
  PaginationVariant,
} from "./types";

// 19. Registries & Plugins Hub
export * from "./registry";
export * from "./plugins";
export * from "./kernel";
