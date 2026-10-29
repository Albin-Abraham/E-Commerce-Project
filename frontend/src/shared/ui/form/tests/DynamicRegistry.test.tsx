import React from "react";

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { z } from "zod";

import { RegistryStore } from "@ui/form/registry";
import type { FieldDefinition } from "@ui/form/registry";

// 1. Pure Presenter Input Component
interface CurrencyProps {
  symbol: string;
  amount: number;
  label: string;
}
const CurrencyFieldPresenter: React.FC<CurrencyProps> = ({
  symbol,
  amount,
  label,
}) => {
  return (
    <div data-testid="currency-presenter">
      <span>{label}</span>
      <span>{symbol}</span>
      <span>{amount}</span>
    </div>
  );
};

// 2. Self-Validating Contract Definition
const baseCurrencyDefinition: FieldDefinition<any, CurrencyProps> = {
  type: "currency",
  schema: z.object({
    type: z.literal("currency"),
    symbol: z.string().default("$"),
    amount: z.number(),
    label: z.string(),
  }),
  mapper: (raw) => ({
    symbol: raw.symbol ?? "$",
    amount: raw.amount,
    label: raw.label,
  }),
  component: CurrencyFieldPresenter,
  defaultValue: 0,
};

// 3. Overridden Context Version (e.g. for EUR billing tenant)
const euroCurrencyDefinition: FieldDefinition<any, CurrencyProps> = {
  ...baseCurrencyDefinition,
  schema: z.object({
    type: z.literal("currency"),
    amount: z.number(),
    label: z.string(),
  }),
  mapper: (raw) => ({
    symbol: "€",
    amount: raw.amount,
    label: `${raw.label} (Europe)`,
  }),
};

describe("Enterprise Dynamic Registry and Field Contract System", () => {
  it("registers a contract definition and renders raw API payload cleanly", () => {
    const registry = new RegistryStore({});
    registry.registerDefinition(baseCurrencyDefinition);

    const rawPayload = {
      type: "currency",
      amount: 1500,
      label: "Salary Payment",
    };

    render(registry.render(rawPayload));

    expect(screen.getByText("Salary Payment")).toBeInTheDocument();
    expect(screen.getByText("$")).toBeInTheDocument();
    expect(screen.getByText("1500")).toBeInTheDocument();
  });

  it("applies contextual overrides correctly based on form/tenant context", () => {
    const registry = new RegistryStore({});
    registry.registerDefinition(baseCurrencyDefinition);

    // Override select currency input behaviour for "billing_form" context to use Euro symbols
    registry.overrideDefinition(
      "currency",
      "billing_form",
      euroCurrencyDefinition
    );

    const rawPayload = {
      type: "currency",
      amount: 450,
      label: "Hosting Cost",
    };

    // 1. Renders default Symbol without context
    const { unmount } = render(registry.render(rawPayload));
    expect(screen.getByText("$")).toBeInTheDocument();
    unmount();

    // 2. Renders Euro Symbol with billing_form context override
    render(registry.render(rawPayload, "billing_form"));
    expect(screen.getByText("€")).toBeInTheDocument();
    expect(screen.getByText("Hosting Cost (Europe)")).toBeInTheDocument();
  });

  it("catches invalid API payloads at the contract boundary and renders a loud FieldErrorBoundary", () => {
    const registry = new RegistryStore({});
    registry.registerDefinition(baseCurrencyDefinition);

    // Missing required "amount" (number) property, and invalid "type"
    const badPayload = {
      type: "currency",
      label: "Invoice",
      amount: "not-a-number", // Type mismatch!
    };

    render(registry.render(badPayload as any));

    expect(screen.getByTestId("schema-error-currency")).toBeInTheDocument();
    expect(screen.getByText(/Contract Error/)).toBeInTheDocument();
    expect(screen.getByText(/amount:.*expected number/i)).toBeInTheDocument();
  });

  it("renders a graceful fallback UI when requesting an unregistered field type", () => {
    const registry = new RegistryStore({});

    const rawPayload = {
      type: "advanced-gantt-chart",
      label: "Timeline",
    };

    render(registry.render(rawPayload));

    expect(
      screen.getByTestId("unknown-fallback-advanced-gantt-chart")
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Unknown field type "advanced-gantt-chart"/)
    ).toBeInTheDocument();
  });
});
