import React, { createContext, useCallback, useContext, useMemo } from "react";

/**
 * @file DataSourceContext.tsx
 * @description DataSource Manager — wraps RemoteOptionsManager for context-based access.
 *
 * The chat architecture calls this the "DataSourceManager":
 * ```
 * Runtime
 *  └── DataSource Manager
 *       └── remote option fetch / search / pagination
 * ```
 *
 * Currently, `RemoteOptionsManager` lives inside `FormCore` and is accessed
 * via `useFieldViewModel → form.remoteOptions.executeSearch()`.
 * This context lifts it to a first-class runtime service so any driver
 * can trigger searches, refresh options, or subscribe to loading state
 * without going through the form facade.
 *
 * ## Usage
 *
 * ### Inside a field driver (AutocompleteField, SelectField):
 * ```tsx
 * const { search, getOptions, isLoading } = useDataSource(field.id);
 * // Trigger a search:
 * search("query text");
 * // Get cached options:
 * const options = getOptions();
 * ```
 *
 * ### Programmatic refresh (e.g., after a dependent field changes):
 * ```tsx
 * const ds = useDataSourceManager();
 * ds.refresh("city_field_id");
 * ```
 */

// ── Types ─────────────────────────────────────────────────────────────────

export interface DataSourceManagerValue {
  /**
   * Trigger a search for a field's remote options.
   * Delegates to `form.remoteOptions.executeSearch(fieldId, query)`.
   */
  search: (fieldId: string, query: string) => void;

  /**
   * Force a refresh of all remote options for a field.
   * Useful when a dependent field changes.
   */
  refresh: (fieldId: string) => void;

  /**
   * Get the currently cached options for a field.
   * Returns an empty array if no options are loaded yet.
   */
  getOptions: (
    fieldId: string
  ) => ReadonlyArray<{ label: string; value: unknown }>;

  /**
   * Check if a field's options are currently loading.
   */
  isLoading: (fieldId: string) => boolean;
}

export interface FieldDataSourceResult {
  search: (query: string) => void;
  refresh: () => void;
  options: ReadonlyArray<{ label: string; value: unknown }>;
  isLoading: boolean;
}

// ── Context ─────────────────────────────────────────────────────────────────

const DataSourceContext = createContext<DataSourceManagerValue | undefined>(
  undefined
);

const DEFAULT_MANAGER: DataSourceManagerValue = {
  search: () => {},
  refresh: () => {},
  getOptions: () => [],
  isLoading: () => false,
};

/**
 * `DataSourceProvider` — bridges the form engine's RemoteOptionsManager to
 * the context layer so field drivers can access it without prop drilling.
 *
 * Place at the same level as `FormOrchestratorProvider`.
 *
 * @example
 * <DataSourceProvider remoteOptions={form.remoteOptions}>
 *   <FormComposer ... />
 * </DataSourceProvider>
 */
export const DataSourceProvider: React.FC<{
  children: React.ReactNode;
  /** The RemoteOptionsManager from FormCore. */
  remoteOptions?: {
    executeSearch: (fieldId: string, query: string) => void;
    refresh?: (fieldId: string) => void;
    getOptions?: (
      fieldId: string
    ) => ReadonlyArray<{ label: string; value: unknown }>;
    isLoading?: (fieldId: string) => boolean;
  } | null;
}> = ({ children, remoteOptions }) => {
  const search = useCallback(
    (fieldId: string, query: string) => {
      remoteOptions?.executeSearch(fieldId, query);
    },
    [remoteOptions]
  );

  const refresh = useCallback(
    (fieldId: string) => {
      remoteOptions?.refresh?.(fieldId);
    },
    [remoteOptions]
  );

  const getOptions = useCallback(
    (fieldId: string) => remoteOptions?.getOptions?.(fieldId) ?? [],
    [remoteOptions]
  );

  const isLoading = useCallback(
    (fieldId: string) => remoteOptions?.isLoading?.(fieldId) ?? false,
    [remoteOptions]
  );

  const value: DataSourceManagerValue = useMemo(
    () => ({ search, refresh, getOptions, isLoading }),
    [search, refresh, getOptions, isLoading]
  );

  return (
    <DataSourceContext.Provider value={value}>
      {children}
    </DataSourceContext.Provider>
  );
};

// ── Hooks ────────────────────────────────────────────────────────────────────

/**
 * `useDataSourceManager` — access the full DataSource manager API.
 *
 * @example
 * const ds = useDataSourceManager();
 * ds.refresh("city_field_id");  // refresh after country changes
 */
export const useDataSourceManager = (): DataSourceManagerValue => {
  return useContext(DataSourceContext) ?? DEFAULT_MANAGER;
};

/**
 * `useDataSource` — field-scoped data source hook for use inside field drivers.
 *
 * Returns search/refresh/options/isLoading all pre-bound to the given fieldId.
 *
 * @example
 * const { search, options, isLoading } = useDataSource(field.id);
 * return <Autocomplete options={options} onInputChange={search} loading={isLoading} />;
 */
export const useDataSource = (fieldId: string): FieldDataSourceResult => {
  const manager = useContext(DataSourceContext) ?? DEFAULT_MANAGER;

  return useMemo(
    () => ({
      search: (query: string) => manager.search(fieldId, query),
      refresh: () => manager.refresh(fieldId),
      options: manager.getOptions(fieldId),
      isLoading: manager.isLoading(fieldId),
    }),

    [manager, fieldId]
  );
};
