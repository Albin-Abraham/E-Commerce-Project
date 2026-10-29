import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DetailKPI, DetailRenderer, DetailTelemetry } from "../DetailRenderer";
import type { DetailSchema } from "../detail.types";

interface TestProduct {
  id: string;
  name: string;
  price: number;
  stock: number;
  status: "active" | "draft" | "archived";
}

const TEST_SCHEMA: DetailSchema<TestProduct> = {
  id: "test-product-detail",
  title: "Product Overview",
  fields: [
    { id: "name", label: "Product Name", format: "text" },
    {
      id: "price",
      label: "Unit Price",
      format: "currency",
      currency: "USD",
    },
    {
      id: "stock",
      label: "Current Stock",
      format: "number",
    },
    {
      id: "status",
      label: "Product Status",
      format: "badge",
      badgeIntent: (status) => (status === "active" ? "success" : "warning"),
      badgeLabel: (status) => (status === "active" ? "Active (Live)" : "Draft"),
    },
  ],
};

describe("DetailRenderer Architecture", () => {
  it("renders declarative key-value grid with semantic formatting", () => {
    const data: TestProduct = {
      id: "prod-001",
      name: "Wireless ANC Headphones",
      price: 299.99,
      stock: 1420,
      status: "active",
    };

    render(<DetailRenderer.Grid schema={TEST_SCHEMA} data={data} columns={2} />);

    expect(screen.getByText("Product Name")).toBeInTheDocument();
    expect(screen.getByText("Wireless ANC Headphones")).toBeInTheDocument();
    expect(screen.getByText("Unit Price")).toBeInTheDocument();
    expect(screen.getByText("$299.99")).toBeInTheDocument();
    expect(screen.getByText("Current Stock")).toBeInTheDocument();
    expect(screen.getByText("1,420")).toBeInTheDocument();
    expect(screen.getByText("Product Status")).toBeInTheDocument();
    expect(screen.getByText("Active (Live)")).toBeInTheDocument();
  });

  it("renders horizontal telemetry strip", () => {
    const items = [
      { id: "1", label: "Cluster", value: "US-East-1", intent: "primary" as const },
      { id: "2", label: "Latency", value: "1.2ms", intent: "success" as const },
    ];

    render(<DetailTelemetry items={items} />);

    expect(screen.getByText("Cluster:")).toBeInTheDocument();
    expect(screen.getByText("US-East-1")).toBeInTheDocument();
    expect(screen.getByText("Latency:")).toBeInTheDocument();
    expect(screen.getByText("1.2ms")).toBeInTheDocument();
  });

  it("renders KPI metric card with trends", () => {
    render(
      <DetailKPI
        title="Monthly Revenue"
        value="$4,250,000"
        trend="+14.2%"
        trendDirection="up"
        subtitle="vs last quarter"
      />
    );

    expect(screen.getByText("Monthly Revenue")).toBeInTheDocument();
    expect(screen.getByText("$4,250,000")).toBeInTheDocument();
    expect(screen.getByText("+14.2%")).toBeInTheDocument();
    expect(screen.getByText("vs last quarter")).toBeInTheDocument();
  });
});
