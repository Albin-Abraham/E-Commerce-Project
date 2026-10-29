import { BulkDeleteModule } from "./modules/BulkDeleteModule";
import { ExportModule } from "./modules/ExportModule";
import { FilterModule } from "./modules/FilterModule";
import { ImportModule } from "./modules/ImportModule";
import { InlineEditModule } from "./modules/InlineEditModule";
import { SelectionModule } from "./modules/SelectionModule";
import { ServerExportModule } from "./modules/ServerExportModule";

/**
 * TableCore — typed module registry for table operations.
 *
 * Built-in modules are concrete exports (TableCore.Selection, …).
 * register()/get() is for optional custom modules only — it does not
 * replace the typed built-ins.
 *
 *   TableCore.Selection.columnDef<Employee>()
 *   TableCore.Selection.useSelection({ enabled: true, type: "multiple" })
 */

type CustomModuleMap = Record<string, unknown>;

class TableCoreRegistry {
  private _modules: CustomModuleMap = {};

  register(name: string, module: unknown): void {
    this._modules[name] = module;
  }

  get<T = unknown>(name: string): T | undefined {
    return this._modules[name] as T | undefined;
  }

  has(name: string): boolean {
    return name in this._modules;
  }

  names(): string[] {
    return Object.keys(this._modules);
  }

  unregister(name: string): boolean {
    if (!(name in this._modules)) return false;
    delete this._modules[name];
    return true;
  }
}

const registry = new TableCoreRegistry();

export const TableCore = {
  register: registry.register.bind(registry),
  get: registry.get.bind(registry),
  has: registry.has.bind(registry),
  names: registry.names.bind(registry),
  unregister: registry.unregister.bind(registry),

  Selection: SelectionModule,
  Filter: FilterModule,
  Export: ExportModule,
  ServerExport: ServerExportModule,
  Import: ImportModule,
  BulkDelete: BulkDeleteModule,
  InlineEdit: InlineEditModule,
} as const;
