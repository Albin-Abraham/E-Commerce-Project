import { describe, expect, it } from "vitest";
import { TableDriver } from "../TableDriver";
import { useZenithTable } from "@ui/table";
import type { ColumnDef } from "@tanstack/react-table";

interface UserItem {
  id: string;
  name: string;
  role: string;
}

const mockColumns: ColumnDef<UserItem>[] = [
  { id: "name", accessorKey: "name", header: "Name" },
  { id: "role", accessorKey: "role", header: "Role" },
];

const mockData: UserItem[] = [
  { id: "u-1", name: "Alice Adams", role: "Admin" },
  { id: "u-2", name: "Bob Brown", role: "Engineer" },
  { id: "u-3", name: "Charlie Clark", role: "Designer" },
];

function TestTable({ data }: { data: UserItem[] }) {
  const table = useZenithTable<UserItem>({
    meta: { id: "users-table", features: { urlSync: false } },
    columns: mockColumns,
    source: { type: "client", data },
  });

  return (
    <table.Table>
      <table.Table.View>
        <table.Table.Header />
        <table.Table.Body />
      </table.Table.View>
    </table.Table>
  );
}

describe("TableDriver Semantic DSL", () => {
  it("renders ZenithTable and provides row queries", async () => {
    const driver = await TableDriver.render(<TestTable data={mockData} />);

    expect(driver.getRowCount()).toBe(3);
    expect(driver.isEmpty()).toBe(false);
  });

  it("handles empty state detection", async () => {
    const driver = await TableDriver.render(<TestTable data={[]} />);

    expect(driver.getRowCount()).toBe(0);
    expect(driver.isEmpty()).toBe(true);
  });

  it("verifies rendered DOM container structure", async () => {
    const driver = await TableDriver.render(<TestTable data={mockData} />);

    expect(driver.getRows().length).toBe(3);
  });
});
