import { BrowserRouter } from "react-router-dom";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Breadcrumbs } from "../Breadcrumbs";
import { PageHeader } from "../PageHeader";

describe("Breadcrumbs & PageHeader Components", () => {
  it("renders breadcrumbs trail with items, links, and active leaf", async () => {
    const items = [
      { id: "1", label: "Home", path: "/" },
      { id: "2", label: "Operations", path: "/operations" },
      { id: "3", label: "Branch Management", active: true },
    ];

    render(
      <BrowserRouter>
        <Breadcrumbs items={items} />
      </BrowserRouter>
    );

    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("Operations")).toBeInTheDocument();
    expect(screen.getByText("Branch Management")).toBeInTheDocument();

    const activeItem = screen.getByText("Branch Management").closest("[aria-current='page']");
    expect(activeItem).toBeInTheDocument();
  });

  it("renders sibling dropdown menu when items property is provided", async () => {
    const items = [
      { id: "1", label: "Admin", path: "/admin" },
      {
        id: "2",
        label: "Modules",
        items: [
          { label: "Branch Management", href: "/showcase/table", active: true },
          { label: "Employee Form", href: "/showcase/employee" },
        ],
      },
    ];

    render(
      <BrowserRouter>
        <Breadcrumbs items={items} />
      </BrowserRouter>
    );

    expect(screen.getByText("Admin")).toBeInTheDocument();
    expect(screen.getByText("Modules")).toBeInTheDocument();
  });

  it("renders PageHeader with title, subtitle, badge, and custom actions", async () => {
    render(
      <BrowserRouter>
        <PageHeader
          title="Branch Management"
          subtitle="Regional distribution logistics"
          badge="Active"
          breadcrumbs={[
            { label: "Admin", path: "/admin" },
            { label: "Branches", active: true },
          ]}
          actions={<button type="button">New Branch</button>}
        />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Branch Management")).toBeInTheDocument();
      expect(screen.getByText("Regional distribution logistics")).toBeInTheDocument();
      expect(screen.getByText("Active")).toBeInTheDocument();
      expect(screen.getByText("New Branch")).toBeInTheDocument();
      expect(screen.getByText("Branches")).toBeInTheDocument();
    });
  });

  it("renders compound slots: Tabs and Utility in PageHeader", async () => {
    render(
      <BrowserRouter>
        <PageHeader
          title="Overview"
          tabs={
            <PageHeader.Tabs>
              <PageHeader.Tab active badge={12}>All Items</PageHeader.Tab>
              <PageHeader.Tab badge={3}>Archived</PageHeader.Tab>
            </PageHeader.Tabs>
          }
          utility={<PageHeader.Utility><span>Last synced: 2m ago</span></PageHeader.Utility>}
        />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("All Items")).toBeInTheDocument();
      expect(screen.getByText("Archived")).toBeInTheDocument();
      expect(screen.getByText("Last synced: 2m ago")).toBeInTheDocument();
    });
  });
});
