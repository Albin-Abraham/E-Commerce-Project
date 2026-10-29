import { useMemo } from "react";

import { compileEntityToTableDef } from "@ui/table/mdap/compileEntityToTableDef";
import type { TableEntity } from "@ui/table/mdap/table-entity";
import type { CompiledTableDef } from "@ui/table/mdap/table-entity";
import { useZenithTable } from "@ui/table/hooks/useZenithTable";
import type { UseZenithTableResult } from "@ui/table/hooks/useZenithTable";

export interface UseMDAPTableResult<T> extends UseZenithTableResult {
  compiled: CompiledTableDef<T>;
}

/**
 * DX facade: compile TableEntity then run useZenithTable.
 * Same split as useMDAPForm — authoring is the entity, runtime is the hook.
 */
export function useMDAPTable<T>(entity: TableEntity<T>): UseMDAPTableResult<T> {
  const compiled = useMemo(() => compileEntityToTableDef(entity), [entity]);
  const table = useZenithTable<T>(compiled);
  return { ...table, compiled };
}
