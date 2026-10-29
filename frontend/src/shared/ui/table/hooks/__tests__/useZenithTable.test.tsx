import React from "react";
import { MemoryRouter } from "react-router-dom";

import type { ColumnDef } from "@tanstack/react-table";
import { act, render, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useTableController } from "../../controller/useTableController";
import { useZenithTable } from "../useZenithTable";

interface User {
  id: string;
  name: string;
}

const columns: ColumnDef<User>[] = [{ accessorKey: "name", header: "Name" }];

const data: User[] = [
  { id: "1", name: "Alice" },
  { id: "2", name: "Bob" },
];

function RouterWrap({ children }: { children: React.ReactNode }) {
  return <MemoryRouter>{children}</MemoryRouter>;
}

describe("useZenithTable (public hook)", () => {
  it("exposes Header on Table so Table.Header works", () => {
    const { result } = renderHook(
      () =>
        useZenithTable<User>({
          meta: { id: "users-hook", features: { urlSync: false } },
          columns,
          source: { type: "client", data },
        }),
      { wrapper: RouterWrap }
    );

    expect(result.current.Table.Header).toBeDefined();
    expect(result.current.Table.Body).toBeDefined();
    expect(result.current.Table.Pagination).toBeDefined();
    expect(result.current.Table.Toolbar).toBeDefined();
    expect(result.current.Header).toBeDefined();

    const { Table } = result.current;
    const { getByTestId } = render(
      <Table>
        <Table.View>
          <Table.Header />
          <Table.Body />
        </Table.View>
      </Table>,
      { wrapper: RouterWrap }
    );

    expect(getByTestId("users-hook")).toBeDefined();
  });

  it("does not auto-render Pagination unless pagination: true", () => {
    const { result } = renderHook(
      () =>
        useZenithTable<User>({
          meta: { id: "users-no-auto", features: { urlSync: false } },
          columns,
          source: { type: "client", data },
        }),
      { wrapper: RouterWrap }
    );

    const { Table } = result.current;
    const { queryByTestId } = render(
      <Table>
        <Table.View>
          <Table.Header />
          <Table.Body />
        </Table.View>
      </Table>,
      { wrapper: RouterWrap }
    );

    expect(queryByTestId("table-pagination")).toBeNull();
  });

  it("auto-renders Pagination when pagination: true", () => {
    const { result } = renderHook(
      () =>
        useZenithTable<User>({
          meta: { id: "users-auto", features: { urlSync: false } },
          columns,
          source: { type: "client", data },
          pagination: true,
        }),
      { wrapper: RouterWrap }
    );

    const { Table } = result.current;
    const { getByTestId } = render(
      <Table>
        <Table.View>
          <Table.Header />
          <Table.Body />
        </Table.View>
      </Table>,
      { wrapper: RouterWrap }
    );

    expect(getByTestId("table-pagination")).toBeDefined();
  });

  it("honors totalCount override for page count", () => {
    const { result } = renderHook(
      () =>
        useZenithTable<User>({
          meta: { id: "users-total", features: { urlSync: false } },
          columns,
          source: { type: "client", data },
          totalCount: 100,
          pagination: true,
        }),
      { wrapper: RouterWrap }
    );

    expect(result.current.totalCount).toBe(100);

    const { Table } = result.current;
    const { getByTestId } = render(
      <Table>
        <Table.View>
          <Table.Header />
          <Table.Body />
        </Table.View>
      </Table>,
      { wrapper: RouterWrap }
    );

    expect(getByTestId("table-pagination-page-10")).toBeDefined();
  });

  it("recomputes pageCount when pageSize changes", async () => {
    const { result } = renderHook(
      () =>
        useTableController<User>({
          meta: { id: "users-pagesize", features: { urlSync: false } },
          columns,
          source: { type: "client", data },
          totalCount: 100,
        }),
      { wrapper: RouterWrap }
    );

    expect(result.current.engine.getPageCount()).toBe(10);

    act(() => {
      result.current.engine.setPageSize(25);
    });

    await waitFor(() => {
      expect(result.current.engine.getPageCount()).toBe(4);
    });
  });
});
