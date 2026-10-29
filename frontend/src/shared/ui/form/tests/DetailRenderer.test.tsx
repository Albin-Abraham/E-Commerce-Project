import React from "react";

import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { useFormRegistry } from "../context/FormRegistryContext";
import { DetailRenderer } from "../detail/DetailRenderer";
import { DetailRenderers } from "../detail/DetailRenderers";
import type {
  DetailDefinition,
  FormDefinition,
  RenderDefinition,
} from "../types";
import { MetaSchemaBridge } from "../utils/MetaSchemaBridge";

describe("DetailRenderer — Definition-Driven UI without <form>", () => {
  it("renders pure semantic article/div structure with ZERO <form> elements", () => {
    const definition: DetailDefinition = {
      id: "product-overview",
      title: "ZenOS Edge Gateway",
      subtitle: "High-throughput industrial IoT edge router",
      badgeIcon: "settings",
      fields: [
        { id: "sku", name: "sku", type: "text", label: "SKU Identifier" },
        { id: "cores", name: "cores", type: "number", label: "CPU Cores" },
      ],
    };

    const data = { sku: "ZOS-EDGE-8800", cores: 16 };

    const { container } = render(
      <DetailRenderer definition={definition} data={data} />
    );

    // 1. Strict assertion: NO <form> elements in the DOM!
    expect(container.querySelector("form")).toBeNull();

    // 2. Verified semantic container
    expect(
      container.querySelector("article[data-detail-renderer='true']")
    ).toBeInTheDocument();
    expect(screen.getByText("ZenOS Edge Gateway")).toBeInTheDocument();
    expect(screen.getByText("ZOS-EDGE-8800")).toBeInTheDocument();
    expect(screen.getByText("16")).toBeInTheDocument();
  });

  it("projects definition options into semantic value badges rather than raw IDs", () => {
    const definition: FormDefinition = {
      id: "server-spec",
      title: "Server Spec",
      fields: [
        {
          id: "env",
          name: "env",
          type: "select",
          label: "Environment",
          options: [
            { value: "prod", label: "Production Tier" },
            { value: "stg", label: "Staging Sandbox" },
          ],
        },
        {
          id: "status",
          name: "isActive",
          type: "switch",
          label: "Active Status",
        },
      ],
    };

    const data = { env: "prod", isActive: true };

    render(<DetailRenderer definition={definition} data={data} />);

    // Resolves option value 'prod' -> 'Production Tier' badge!
    expect(screen.getByText("Production Tier")).toBeInTheDocument();
    expect(screen.queryByText("prod")).not.toBeInTheDocument();

    // Resolves boolean true -> 'Yes' status badge with Check icon
    expect(screen.getByText("Yes")).toBeInTheDocument();
  });

  it("renders structural slots: headerSlot, mediaSlot, actionSlot, and footerSlot", () => {
    const definition: RenderDefinition = {
      sections: [
        {
          id: "specs",
          fields: [{ id: "ram", name: "ram", type: "text", label: "Memory" }],
        },
      ],
    };

    const data = { ram: "64GB DDR5 ECC" };

    const { container } = render(
      <DetailRenderer
        definition={definition}
        data={data}
        slots={{
          headerSlot: (
            <DetailRenderers.Header
              title="Quantum Compute Node"
              subtitle="Datacenter rack enclosure"
              badgeIcon="settings"
              status={{ label: "Operational", variant: "success" }}
              tags={["Cluster-A", "Zone-East"]}
            />
          ),
          mediaSlot: (
            <div data-testid="media-hero-banner">Hero Media Banner</div>
          ),
          actionSlot: (
            <>
              <button type="button" className="btn-secondary">
                Decommission
              </button>
              <button type="button" className="btn-primary">
                Provision Node
              </button>
            </>
          ),
          footerSlot: <div data-testid="custom-footer">Node Audit Footer</div>,
        }}
      />
    );

    // Assert structural slots
    expect(
      container.querySelector("[data-slot='detail-header']")
    ).toBeInTheDocument();
    expect(screen.getByText("Quantum Compute Node")).toBeInTheDocument();
    expect(screen.getByText("Operational")).toBeInTheDocument();
    expect(screen.getByText("Cluster-A")).toBeInTheDocument();

    expect(screen.getByTestId("media-hero-banner")).toBeInTheDocument();
    expect(screen.getByText("64GB DDR5 ECC")).toBeInTheDocument();

    expect(
      container.querySelector("[data-slot='bottom-action-slot']")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Provision Node" })
    ).toBeInTheDocument();

    expect(screen.getByTestId("custom-footer")).toBeInTheDocument();

    // Confirm no form
    expect(container.querySelector("form")).toBeNull();
  });

  it("injects custom field-level slot components defined in schema", () => {
    const CustomTelemetryChart = ({ field, value, data }: any) => (
      <div data-testid="telemetry-chart">
        <span>Metric: {field.label}</span>
        <span>Current: {value}</span>
        <span>Unit: {data.unit}</span>
      </div>
    );

    const definition: DetailDefinition = {
      id: "telemetry",
      title: "Telemetry View",
      fields: [
        { id: "host", name: "host", type: "text", label: "Hostname" },
        {
          id: "chartSlot",
          name: "telemetryChart",
          type: "slot",
          label: "Live Throughput",
        },
      ],
    };

    const data = {
      host: "node-us-east-4",
      telemetryChart: "4.8 Gbps",
      unit: "Gigabits/sec",
    };

    render(
      <DetailRenderer
        definition={definition}
        data={data}
        slots={{
          telemetryChart: CustomTelemetryChart,
        }}
      />
    );

    expect(screen.getByText("node-us-east-4")).toBeInTheDocument();
    expect(screen.getByTestId("telemetry-chart")).toBeInTheDocument();
    expect(screen.getByText("Metric: Live Throughput")).toBeInTheDocument();
    expect(screen.getByText("Current: 4.8 Gbps")).toBeInTheDocument();
    expect(screen.getByText("Unit: Gigabits/sec")).toBeInTheDocument();
  });

  it("supports mode='interactive' for standalone widgets without <form> submission", () => {
    const handleChange = vi.fn();

    const definition: DetailDefinition = {
      id: "interactive-toggles",
      title: "Quick Preferences",
      fields: [
        {
          id: "dark-mode",
          name: "darkMode",
          type: "switch",
          label: "Dark Appearance",
        },
      ],
    };

    const data = { darkMode: false };

    const { container } = render(
      <DetailRenderer
        definition={definition}
        data={data}
        mode="interactive"
        onChange={handleChange}
      />
    );

    // No <form> tag even in interactive mode!
    expect(container.querySelector("form")).toBeNull();

    const switchCheckbox = screen.getByRole("switch");
    expect(switchCheckbox).not.toBeChecked();

    fireEvent.click(switchCheckbox);
    expect(handleChange).toHaveBeenCalledWith("darkMode", true);
  });

  it("integrates seamlessly with MetaSchemaBridge compiled RenderDefinition", () => {
    const apiSchema = {
      id: "bridge-schema",
      fields: [
        { name: "serviceName", type: "text", label: "Service Name" },
        { name: "customWidget", type: "slot", label: "Custom Metric Widget" },
      ],
    };

    const CustomWidget = () => (
      <div data-testid="bridge-custom-widget">Bridge Widget Injected</div>
    );

    const renderDefinition = MetaSchemaBridge.compileToRenderDefinition(
      apiSchema as any,
      {},
      { customWidget: CustomWidget }
    );

    const data = { serviceName: "Auth Gateway Service" };

    const { container } = render(
      <DetailRenderer definition={renderDefinition} data={data} />
    );

    expect(container.querySelector("form")).toBeNull();
    expect(screen.getByText("Auth Gateway Service")).toBeInTheDocument();
    expect(screen.getByTestId("bridge-custom-widget")).toBeInTheDocument();
  });

  it("mounts the engine for display definitions carrying conditional rules and applies visibility", () => {
    const definition: DetailDefinition = {
      id: "conditional-detail",
      title: "Deployment Status",
      fields: [
        { id: "status", name: "status", type: "text", label: "Status" },
        {
          id: "eta",
          name: "eta",
          type: "text",
          label: "Completion ETA",
          conditions: {
            groups: [
              {
                action: "show",
                rules: [
                  {
                    field: "status",
                    operator: "equals",
                    value: "construction",
                  },
                ],
              },
            ],
          },
        },
      ],
    };

    const { rerender } = render(
      <DetailRenderer
        definition={definition}
        data={{ status: "live", eta: "2026-11-01" }}
      />
    );

    expect(screen.getByText("live")).toBeInTheDocument();
    expect(screen.queryByText("2026-11-01")).not.toBeInTheDocument();

    rerender(
      <DetailRenderer
        definition={definition}
        data={{ status: "construction", eta: "2026-11-01" }}
      />
    );

    expect(screen.getByText("2026-11-01")).toBeInTheDocument();
  });

  it("skips the form engine entirely for plain display definitions", () => {
    const Probe = () => {
      const { form } = useFormRegistry();
      return (
        <span data-testid="engine-probe">{form ? "engine" : "formless"}</span>
      );
    };

    const definition: DetailDefinition = {
      id: "plain-detail",
      title: "Plain Detail",
      fields: [{ id: "host", name: "host", type: "text", label: "Hostname" }],
    };

    const { rerender } = render(
      <DetailRenderer
        definition={definition}
        data={{ host: "node-1" }}
        slots={{ headerSlot: <Probe /> }}
      />
    );
    expect(screen.getByTestId("engine-probe")).toHaveTextContent("formless");

    rerender(
      <DetailRenderer
        definition={definition}
        data={{ host: "node-1" }}
        mode="interactive"
        slots={{ headerSlot: <Probe /> }}
      />
    );
    expect(screen.getByTestId("engine-probe")).toHaveTextContent("engine");
  });

  it("emits onChange exactly once per user-modified field (no stale re-emission)", async () => {
    const handleChange = vi.fn();

    const definition: DetailDefinition = {
      id: "toggle-bank",
      title: "Preferences",
      fields: [
        {
          id: "dark-mode",
          name: "darkMode",
          type: "switch",
          label: "Dark Appearance",
        },
        {
          id: "sound",
          name: "soundOn",
          type: "switch",
          label: "Sound Effects",
        },
      ],
    };

    const data = { darkMode: false, soundOn: true };

    render(
      <DetailRenderer
        definition={definition}
        data={data}
        mode="interactive"
        onChange={handleChange}
      />
    );

    const switches = screen.getAllByRole("switch");
    expect(switches).toHaveLength(2);

    const user = userEvent.setup();
    await user.click(switches[0]);
    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith("darkMode", true);

    await user.click(switches[1]);
    expect(handleChange).toHaveBeenCalledTimes(2);
    expect(handleChange).toHaveBeenLastCalledWith("soundOn", false);

    // darkMode was touched exactly once — the second change must not
    // re-emit a stale diff of the first field.
    const darkModeCalls = handleChange.mock.calls.filter(
      ([key]) => key === "darkMode"
    );
    expect(darkModeCalls).toHaveLength(1);
  });

  it("never renders schema component overrides as native DOM elements for non-slot fields", () => {
    const definition: DetailDefinition = {
      id: "meta-ui-safety",
      title: "Meta UI Safety",
      fields: [
        {
          id: "region",
          name: "region",
          type: "text",
          label: "Region",
          meta: { ui: { component: "select" } },
        },
      ],
    };

    render(
      <DetailRenderer definition={definition} data={{ region: "eu-west-1" }} />
    );

    // A schema component override must never leak as a native <select>.
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(screen.getByText("eu-west-1")).toBeInTheDocument();
  });

  it("renders exactly one label per interactive field (none missing, none duplicated)", () => {
    const definition: DetailDefinition = {
      id: "label-hygiene",
      title: "Label Hygiene",
      fields: [
        { id: "host", name: "host", type: "text", label: "Hostname" },
        {
          id: "dark-mode",
          name: "darkMode",
          type: "switch",
          label: "Dark Appearance",
        },
      ],
    };

    render(
      <DetailRenderer
        definition={definition}
        data={{ host: "node-1", darkMode: false }}
        mode="interactive"
      />
    );

    expect(screen.getAllByText("Hostname")).toHaveLength(1);
    expect(screen.getAllByText("Dark Appearance")).toHaveLength(1);
  });

  describe("Suspense Streaming Boundary & Incremental Skeleton Loading", () => {
    it("attaches Skeleton to DetailRenderer and DetailKeyDetailsCard", () => {
      expect(DetailRenderer.Skeleton).toBeDefined();
      expect(DetailRenderer.KeyDetailsCard.Skeleton).toBeDefined();
      expect(DetailRenderer.Skeleton).toBe(DetailRenderer.KeyDetailsCard.Skeleton);
    });

    it("renders accessible skeleton fallback when DetailCardSkeleton is mounted", () => {
      render(<DetailRenderer.Skeleton rows={3} data-testid="detail-skeleton" />);
      const skeleton = screen.getByRole("status");
      expect(skeleton).toBeInTheDocument();
      expect(skeleton).toHaveAttribute("aria-busy", "true");
      expect(skeleton).toHaveAttribute("aria-label", "Loading details");
    });

    it("renders custom fallback slot inside DetailKeyDetailsCard when suspense is enabled", async () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      function LazyChild() {
        // Simple suspense thrower
        if (!resolved) {
          throw promise;
        }
        return <div>Resolved Async Details</div>;
      }

      let resolved = false;

      const { rerender } = render(
        <DetailRenderer.KeyDetailsCard
          title="Async Server"
          suspense
          fallback={<div data-testid="custom-stream-fallback">Streaming hydrated data...</div>}
        >
          <LazyChild />
        </DetailRenderer.KeyDetailsCard>
      );

      expect(screen.getByTestId("custom-stream-fallback")).toBeInTheDocument();
      expect(screen.queryByText("Resolved Async Details")).not.toBeInTheDocument();

      // Resolve and re-render
      resolved = true;
      resolvePromise!(true);
      rerender(
        <DetailRenderer.KeyDetailsCard
          title="Async Server"
          suspense
          fallback={<div data-testid="custom-stream-fallback">Streaming hydrated data...</div>}
        >
          <LazyChild />
        </DetailRenderer.KeyDetailsCard>
      );

      expect(await screen.findByText("Resolved Async Details")).toBeInTheDocument();
    });

    it("renders virtualized viewport container when virtualized prop is enabled", () => {
      const definition: DetailDefinition = {
        id: "large-dataset",
        title: "Large Telemetry Specs",
        fields: Array.from({ length: 10 }).map((_, i) => ({
          id: `field_${i}`,
          name: `field_${i}`,
          type: "text",
          label: `Field ${i}`,
        })),
      };

      const { container } = render(
        <DetailRenderer
          definition={definition}
          data={{}}
          virtualized
        />
      );

      const viewport = container.querySelector("[data-slot='virtualized-viewport']");
      expect(viewport).toBeInTheDocument();
      expect(viewport).toHaveAttribute("role", "region");
      expect(viewport).toHaveAttribute("aria-label", "Virtualized fields list");
    });
  });
});
