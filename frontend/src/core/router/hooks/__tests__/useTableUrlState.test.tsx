import { MemoryRouter, useLocation } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { useTableUrlState } from "../useTableUrlState";

function LocationProbe() {
  const location = useLocation();
  return <span data-testid="search">{location.search}</span>;
}

function Harness() {
  const port = useTableUrlState({ scope: "tbl" });
  return (
    <div>
      <button
        data-testid="goto-page-3"
        onClick={() => port.updateState({ page: 3 })}
      >
        page 3
      </button>
      <button
        data-testid="search-zen"
        onClick={() => port.updateState({ search: "zen" })}
      >
        search
      </button>
      <button
        data-testid="sort-price"
        onClick={() => port.updateState({ sort: "-price" })}
      >
        sort
      </button>
      <button
        data-testid="filter-status"
        onClick={() => port.updateState({ filters: { status: "active" } })}
      >
        filter
      </button>
      <button
        data-testid="replace-filters"
        onClick={() => port.updateState({ filters: { region: "eu" } })}
      >
        replace filters
      </button>
      <button
        data-testid="reset-all"
        onClick={() =>
          port.updateState({
            page: 1,
            pageSize: 10,
            search: "",
            sort: null,
            filters: {},
          })
        }
      >
        reset
      </button>
      <LocationProbe />
    </div>
  );
}

function renderAt(initialEntry: string) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Harness />
    </MemoryRouter>
  );
}

describe("useTableUrlState", () => {
  it("returns defaults when no params are present", () => {
    let state: any;
    function Reader() {
      const port = useTableUrlState({ scope: "tbl" });
      state = port.readState();
      return null;
    }

    render(
      <MemoryRouter initialEntries={["/"]}>
        <Reader />
      </MemoryRouter>
    );

    expect(state).toEqual({
      page: 1,
      pageSize: 10,
      search: "",
      sort: null,
      filters: {},
    });
  });

  it("reads scoped params from the URL", () => {
    let state: any;
    function Reader() {
      const port = useTableUrlState({ scope: "tbl" });
      state = port.readState();
      return null;
    }

    render(
      <MemoryRouter
        initialEntries={[
          "/?tbl_page=4&tbl_pageSize=25&tbl_q=laptop&tbl_sort=-price&tbl_filter%5Bstatus%5D=active",
        ]}
      >
        <Reader />
      </MemoryRouter>
    );

    expect(state.page).toBe(4);
    expect(state.pageSize).toBe(25);
    expect(state.search).toBe("laptop");
    expect(state.sort).toBe("-price");
    expect(state.filters).toEqual({ status: "active" });
  });

  it("honors custom defaults", () => {
    let state: any;
    function Reader() {
      const port = useTableUrlState({
        scope: "tbl",
        defaults: { pageSize: 50 },
      });
      state = port.readState();
      return null;
    }

    render(
      <MemoryRouter initialEntries={["/"]}>
        <Reader />
      </MemoryRouter>
    );

    expect(state.pageSize).toBe(50);
    expect(state.page).toBe(1);
  });

  it("writes page, search, and sort as scoped params", async () => {
    const user = userEvent.setup();
    renderAt("/");

    await user.click(screen.getByTestId("goto-page-3"));
    expect(screen.getByTestId("search").textContent).toContain("tbl_page=3");

    await user.click(screen.getByTestId("search-zen"));
    expect(screen.getByTestId("search").textContent).toContain("tbl_q=zen");

    await user.click(screen.getByTestId("sort-price"));
    expect(screen.getByTestId("search").textContent).toContain(
      "tbl_sort=-price"
    );
  });

  it("writes filters as filter[key] params and replaces the old set", async () => {
    const user = userEvent.setup();
    renderAt("/");

    await user.click(screen.getByTestId("filter-status"));
    expect(screen.getByTestId("search").textContent).toContain(
      "tbl_filter[status]=active"
    );

    await user.click(screen.getByTestId("replace-filters"));
    const search = screen.getByTestId("search").textContent ?? "";
    expect(search).toContain("tbl_filter[region]=eu");
    expect(search).not.toContain("status");
  });

  it("clears params back to defaults on reset", async () => {
    const user = userEvent.setup();
    renderAt("/?tbl_page=3&tbl_q=zen&tbl_sort=-price");

    await user.click(screen.getByTestId("reset-all"));

    expect(screen.getByTestId("search").textContent).toBe("");
  });
});
