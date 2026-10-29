import { describe, expect, it, vi } from "vitest";

import { TableColumnFactory } from "../../utils/TableColumnFactory";
import { compileEntityToTableDef } from "../compileEntityToTableDef";
import { compileFiltersToFormDef } from "../compileFiltersToFormDef";
import type { TableEntity } from "../table-entity";
import { tableCellRegistry } from "../tableCellRegistry";

interface User {
  id: string;
  name: string;
  role: string;
}

const users: User[] = [{ id: "1", name: "Alice", role: "Admin" }];

describe("compileFiltersToFormDef", () => {
  it("names search and column fields", () => {
    const def = compileFiltersToFormDef("users", [
      { id: "search", name: "search", label: "Search", type: "text" },
      {
        id: "role",
        name: "role",
        label: "Role",
        type: "select",
        options: [{ value: "Admin", label: "Admin" }],
      },
    ]);
    expect(def.id).toBe("users-filters");
    expect(def.fields?.map((f) => f.name)).toEqual(["search", "role"]);
  });
});

describe("compileEntityToTableDef", () => {
  it("compiles client behavior into DataSource and TableColumnFactory columns", () => {
    const entity: TableEntity<User> = {
      id: "users",
      name: "Users",
      content: {
        columns: [
          { id: "name", label: "Name", sortable: true },
          { id: "role", label: "Role" },
        ],
        getRowId: (row) => row.id,
      },
      behavior: { client: { data: users, totalCount: 10 } },
      surface: { pagination: true, toolbar: true },
      presentation: { striped: true },
    };

    const compiled = compileEntityToTableDef(entity);

    expect(compiled.meta.id).toBe("users");
    expect(compiled.source).toEqual({ type: "client", data: users });
    expect(compiled.totalCount).toBe(10);
    expect(compiled.columns.map((c) => c.id)).toEqual(["name", "role"]);
    expect(compiled.pagination).toBe(true);
    expect(compiled.toolbar).toBe(true);
    expect(compiled.striped).toBe(true);
    expect(compiled.getRowId?.(users[0], 0)).toBe("1");
  });

  it("moves fetcher, guard, gate, and export onto compiled runtime", () => {
    const fetcher = vi.fn(async () => ({ rows: users, totalCount: 1 }));
    const guard = vi.fn(() => true);
    const createExport = vi.fn();
    const entity: TableEntity<User> = {
      id: "users",
      name: "Users",
      content: {
        columns: [{ id: "name", label: "Name" }],
        filters: [{ id: "role", name: "role", label: "Role", type: "select" }],
      },
      behavior: {
        server: { fetcher, guard, gate: "manual" },
        export: {
          createExport: createExport as never,
          getStatus: vi.fn() as never,
          downloadFile: vi.fn() as never,
        },
      },
    };

    const compiled = compileEntityToTableDef(entity);

    expect(compiled.source.type).toBe("server");
    if (compiled.source.type === "server") {
      expect(compiled.source.fetcher).toBe(fetcher);
      expect(compiled.source.guard).toBe(guard);
      expect(compiled.source.gate).toBe("manual");
    }
    expect(compiled.serverExport?.createExport).toBe(createExport);
    expect(compiled.filterForm?.id).toBe("users-filters");
    expect(compiled.filterBar).toBe(true);
    expect(compiled.chrome).toMatchObject({
      exportBtn: true,
      importBtn: false,
      deleteBtn: false,
      filterStatusBadge: true,
    });
  });

  it("moves import ports and page surface onto compiled runtime", () => {
    const uploadFile = vi.fn();
    const getStatus = vi.fn();
    const onImport = vi.fn();
    const entity: TableEntity<User> = {
      id: "users",
      name: "Users",
      content: { columns: [{ id: "name", label: "Name" }] },
      behavior: {
        client: { data: users },
        import: {
          uploadFile: uploadFile as never,
          getStatus: getStatus as never,
        },
      },
      surface: { import: { mode: "page", onImport } },
    };

    const compiled = compileEntityToTableDef(entity);

    expect(compiled.import?.uploadFile).toBe(uploadFile);
    expect(compiled.import?.getStatus).toBe(getStatus);
    expect(compiled.importSurface).toEqual({ mode: "page", onImport });
    expect(compiled.chrome?.importBtn).toBe(true);
    expect(compiled.chrome?.exportBtn).toBe(false);
  });

  it("lets surface.exportBtn false suppress inferred export chrome", () => {
    const compiled = compileEntityToTableDef<User>({
      id: "users",
      name: "Users",
      content: { columns: [{ id: "name", label: "Name" }] },
      behavior: {
        client: { data: users },
        export: {
          createExport: vi.fn() as never,
          getStatus: vi.fn() as never,
          downloadFile: vi.fn() as never,
        },
      },
      surface: { exportBtn: false },
    });
    expect(compiled.serverExport).toBeDefined();
    expect(compiled.chrome?.exportBtn).toBe(false);
  });

  it("throws when both client and server are set", () => {
    expect(() =>
      compileEntityToTableDef<User>({
        id: "users",
        name: "Users",
        content: { columns: [] },
        behavior: {
          client: { data: users },
          server: { fetcher: async () => ({ rows: [], totalCount: 0 }) },
        },
      })
    ).toThrow(/cannot set both/);
  });

  it("throws when neither client nor server is set", () => {
    expect(() =>
      compileEntityToTableDef<User>({
        id: "users",
        name: "Users",
        content: { columns: [] },
      })
    ).toThrow(/needs behavior.client or behavior.server/);
  });
});

describe("tableCellRegistry", () => {
  it("lets TableColumnFactory resolve a feature renderer by string", () => {
    tableCellRegistry.register(
      "feature-name",
      ({ value }) => `CELL:${String(value)}`
    );
    try {
      const [col] = TableColumnFactory.compile<User>([
        { id: "name", label: "Name", renderer: "feature-name" },
      ]);
      const cell = col.cell as (info: unknown) => unknown;
      expect(
        cell({
          getValue: () => "Alice",
          row: { id: "1", original: users[0] },
        })
      ).toBe("CELL:Alice");
    } finally {
      tableCellRegistry.unregister("feature-name");
    }
  });
});
