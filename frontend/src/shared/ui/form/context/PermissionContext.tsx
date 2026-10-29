// PermissionContext.tsx – extended for column, row, and cell permissions
import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

/**
 * Permission model for form fields.
 * - "edit"   – can view and modify the field (default)
 * - "view"   – can see the value but not modify it (read‑only)
 * - "hidden" – field is completely hidden from the UI
 */
export type FieldPermission = "edit" | "view" | "hidden";

/**
 * Flat field‑level permission map.
 */
export interface PermissionMap {
  [fieldId: string]: FieldPermission;
}

/**
 * Grid‑level permission resolvers.
 */
export type ColumnPermissionResolver =
  | FieldPermission
  | ((context?: { columnKey: string; formValues?: any }) => FieldPermission);

export type RowPermissionResolver = (
  row: any,
  rowIndex: number,
  formValues?: any
) => FieldPermission;

export type CellPermissionResolver = (
  row: any,
  columnKey: string,
  rowIndex: number,
  formValues?: any
) => FieldPermission;

/**
 * Layout‑level permission configuration. Allows column/row/cell granularity as well as
 * a flat field map for backward compatibility.
 */
export interface LayoutPermissionConfig {
  /** Flat field‑level permissions */
  fields?: Record<string, FieldPermission>;
  /** Column permissions for repeaters, tables, and grids */
  columns?: Record<string, ColumnPermissionResolver>;
  /** Row permissions based on record status or predicate */
  rows?: RowPermissionResolver;
  /** Cell permissions – intersection of row and column */
  cells?: CellPermissionResolver;
}

/**
 * Union type accepted by PermissionProvider.
 */
export type FormPermissionsProp =
  | Record<string, FieldPermission>
  | LayoutPermissionConfig;

/**
 * Public API exposed by the Permission context.
 */
export interface PermissionManagerValue {
  /** Resolve permission for a specific field id */
  getPermission: (fieldId: string) => FieldPermission;
  /** Resolve column permission */
  getColumnPermission: (columnKey: string, formValues?: any) => FieldPermission;
  /** Resolve row permission */
  getRowPermission: (row: any, rowIndex: number, formValues?: any) => FieldPermission;
  /** Resolve cell permission */
  getCellPermission: (
    row: any,
    columnKey: string,
    rowIndex: number,
    formValues?: any
  ) => FieldPermission;
  /** Update permissions at runtime (flat map only) */
  updatePermissions: (updates: PermissionMap) => void;
  /** Replace the entire permission map (flat map only) */
  setPermissions: (permissions: PermissionMap) => void;
}

/** Result from useFieldPermission hook */
export interface FieldPermissionResult {
  permission: FieldPermission;
  /** True if the field can be edited (permission === "edit") */
  canEdit: boolean;
  /** True if the field is visible (permission !== "hidden") */
  canView: boolean;
  /** True if the field is completely hidden */
  isHidden: boolean;
}

/** Context definition */
const PermissionContext = createContext<PermissionManagerValue | undefined>(undefined);

const DEFAULT_MANAGER: PermissionManagerValue = {
  getPermission: () => "edit",
  getColumnPermission: () => "edit",
  getRowPermission: () => "edit",
  getCellPermission: () => "edit",
  updatePermissions: () => {},
  setPermissions: () => {},
};

/**
 * PermissionProvider – wraps form tree and supplies permission resolution.
 * Accepts either a flat map or a LayoutPermissionConfig.
 */
export const PermissionProvider: React.FC<{
  children: React.ReactNode;
  /** Initial permissions – flat map or layout config */
  permissions?: FormPermissionsProp;
}> = ({ children, permissions: initialPermissions = {} }) => {
  // Separate storage for flat map and layout config for simplicity.
  const [flatMap, setFlatMap] = useState<PermissionMap>(
    // If a plain object without layout keys, treat as flat map.
    typeof (initialPermissions as any).fields === "undefined" &&
      typeof (initialPermissions as any).columns === "undefined"
      ? (initialPermissions as PermissionMap)
      : {}
  );
  const [layoutConfig, setLayoutConfig] = useState<LayoutPermissionConfig | undefined>(
    typeof (initialPermissions as any).fields !== "undefined" ||
      typeof (initialPermissions as any).columns !== "undefined"
      ? (initialPermissions as LayoutPermissionConfig)
      : undefined
  );

  const getPermission = useCallback(
    (fieldId: string): FieldPermission => {
      // Preference order: layoutConfig.fields > flatMap > default "edit"
      if (layoutConfig?.fields && fieldId in layoutConfig.fields) {
        return layoutConfig.fields[fieldId];
      }
      return flatMap[fieldId] ?? "edit";
    },
    [flatMap, layoutConfig]
  );

  const getColumnPermission = useCallback(
    (columnKey: string, formValues?: any): FieldPermission => {
      if (layoutConfig?.columns && columnKey in layoutConfig.columns) {
        const resolver = layoutConfig.columns[columnKey];
        return typeof resolver === "function"
          ? resolver({ columnKey, formValues })
          : resolver;
      }
      // fallback to flat map using columnKey as fieldId (rare but compatible)
      return flatMap[columnKey] ?? "edit";
    },
    [layoutConfig, flatMap]
  );

  const getRowPermission = useCallback(
    (row: any, rowIndex: number, formValues?: any): FieldPermission => {
      if (layoutConfig?.rows) {
        return layoutConfig.rows(row, rowIndex, formValues);
      }
      // No specific row resolver – default edit
      return "edit";
    },
    [layoutConfig]
  );

  const getCellPermission = useCallback(
    (row: any, columnKey: string, rowIndex: number, formValues?: any): FieldPermission => {
      if (layoutConfig?.cells) {
        return layoutConfig.cells(row, columnKey, rowIndex, formValues);
      }
      // Fallback to column then row precedence
      const colPerm = getColumnPermission(columnKey, formValues);
      const rowPerm = getRowPermission(row, rowIndex, formValues);
      // hidden < view < edit – we choose the most restrictive (min)
      const order = { hidden: 0, view: 1, edit: 2 };
      return order[colPerm] < order[rowPerm] ? colPerm : rowPerm;
    },
    [layoutConfig, getColumnPermission, getRowPermission]
  );

  const updatePermissions = useCallback((updates: PermissionMap) => {
    setFlatMap((prev) => ({ ...prev, ...updates }));
  }, []);

  const setPermissions = useCallback((permissions: PermissionMap) => {
    setFlatMap(permissions);
  }, []);

  const value: PermissionManagerValue = useMemo(
    () => (
      {
        getPermission,
        getColumnPermission,
        getRowPermission,
        getCellPermission,
        updatePermissions,
        setPermissions,
      }
    ),
    [
      getPermission,
      getColumnPermission,
      getRowPermission,
      getCellPermission,
      updatePermissions,
      setPermissions,
    ]
  );

  return (
    <PermissionContext.Provider value={value}>{children}</PermissionContext.Provider>
  );
};

/** Hook to access the full permission manager API */
export const usePermissionManager = (): PermissionManagerValue => {
  return useContext(PermissionContext) ?? DEFAULT_MANAGER;
};

/** Hook for field‑level permission resolution */
export const useFieldPermission = (fieldId: string): FieldPermissionResult => {
  const manager = useContext(PermissionContext) ?? DEFAULT_MANAGER;
  const permission = manager.getPermission(fieldId);

  return useMemo(
    () => ({
      permission,
      canEdit: permission === "edit",
      canView: permission !== "hidden",
      isHidden: permission === "hidden",
    }),
    [permission]
  );
};

/**
 * Hook for grid permissions – convenient for RepeaterField components.
 * Returns the three resolver functions bound to the current context.
 */
export const useGridPermissions = () => {
  const manager = useContext(PermissionContext) ?? DEFAULT_MANAGER;
  return {
    getColumnPermission: manager.getColumnPermission,
    getRowPermission: manager.getRowPermission,
    getCellPermission: manager.getCellPermission,
  };
};
