import type { TableRouteBinding } from "../route.types";
import { BaseRegistry } from "./base.registry";

/**
 * A registered binding with a stable id equal to its tableId.
 */
export interface TableRouteBindingEntry extends TableRouteBinding {
  id: string;
}

/**
 * TableRouteBindingRegistry
 *
 * Maps table ids to their route destinations (list, details, create, edit)
 * through stable routeIds. Tables resolve destinations through this registry
 * rather than implementing their own route-resolution logic.
 * Application-scoped — see createRouterAppInstance.
 */
export class TableRouteBindingRegistry extends BaseRegistry<TableRouteBindingEntry> {
  registerBinding(binding: TableRouteBinding): void {
    this.register({ ...binding, id: binding.tableId });
  }

  getBinding(tableId: string): TableRouteBindingEntry | undefined {
    return this.get(tableId);
  }
}

export const tableRouteBindingRegistry = new TableRouteBindingRegistry();
