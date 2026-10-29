import React, { useState } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Activity,
  Download,
  Edit,
  Layers,
  Server,
  Share2,
  Sliders,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { fn } from "storybook/test";

import type { DetailDefinition } from "../types";
import { DetailRenderer } from "./DetailRenderer";
import { DetailRenderers } from "./DetailRenderers";

const meta: Meta<typeof DetailRenderer> = {
  title: "Form/Detail/DetailRenderer",
  component: DetailRenderer,
  parameters: {
    layout: "padded",
    docs: {
      source: {
        type: "code",
      },
      description: {
        component:
          "Formless Definition-Driven UI presentation engine. Renders entity schemas, structured fields, and injected slots purely as read/detail/inspection views without any `<form>` element, validation pipeline, or submit button baggage.",
      },
    },
  },
  args: {
    onChange: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof DetailRenderer>;

// ─────────────────────────────────────────────────────────────────────────────
// Story 1: ProductDetailShowcase
// ─────────────────────────────────────────────────────────────────────────────

interface ProductData {
  id: string;
  name: string;
  sku: string;
  category: string;
  tier: string;
  price: number;
  inStock: boolean;
  stockCount: number;
  description: string;
  tags: string[];
}

const productDefinition: DetailDefinition<ProductData> = {
  id: "product-detail-definition",
  title: "Hardware Product Specification",
  description: "Detailed inventory and specification metadata",
  fields: [
    {
      id: "general_section",
      name: "generalSection",
      type: "section",
      label: "General Information",
      fields: [
        {
          id: "name",
          name: "name",
          type: "text",
          label: "Product Name",
        },
        {
          id: "sku",
          name: "sku",
          type: "text",
          label: "Inventory SKU",
        },
        {
          id: "category",
          name: "category",
          type: "select",
          label: "Catalog Category",
          options: [
            { label: "Hardware & Audio", value: "hardware" },
            { label: "Peripherals", value: "peripherals" },
            { label: "Accessories", value: "accessories" },
          ],
        },
        {
          id: "tier",
          name: "tier",
          type: "radio",
          label: "Product Tier",
          options: [
            { label: "Standard Tier", value: "standard" },
            { label: "Professional Studio", value: "pro" },
            { label: "Enterprise Fleet", value: "enterprise" },
          ],
        },
      ],
    },
    {
      id: "pricing_inventory_section",
      name: "pricingInventorySection",
      type: "section",
      label: "Pricing & Stock",
      fields: [
        {
          id: "price",
          name: "price",
          type: "number",
          label: "Base Retail Price ($)",
        },
        {
          id: "stockCount",
          name: "stockCount",
          type: "number",
          label: "Units in Warehouse",
        },
        {
          id: "inStock",
          name: "inStock",
          type: "switch",
          label: "Available for Immediate Dispatch",
        },
      ],
    },
    {
      id: "description_section",
      name: "descriptionSection",
      type: "section",
      label: "Technical Overview",
      fields: [
        {
          id: "description",
          name: "description",
          type: "textarea",
          label: "Product Description",
        },
      ],
    },
  ],
};

const productData: ProductData = {
  id: "prod-900-rgb",
  name: "Aether Pro Studio Wireless Headset",
  sku: "AETH-PRO-900-BLK",
  category: "hardware",
  tier: "pro",
  price: 249.99,
  inStock: true,
  stockCount: 142,
  description:
    "Low-latency dual wireless RF connectivity with planar magnetic drivers, active hybrid noise cancellation, and calibrated spatial audio.",
  tags: ["Flagship", "Spatial Audio", "Bluetooth 5.4", "Planar Magnetic"],
};

export const ProductDetailShowcase: Story = {
  render: (args) => (
    <div className="max-w-4xl mx-auto space-y-6">
      <DetailRenderer
        {...args}
        definition={productDefinition}
        data={productData}
        layoutStyle="cards"
        density="comfortable"
        slots={{
          headerSlot: (
            <DetailRenderers.Header
              title={productData.name}
              subtitle={`SKU: ${productData.sku} • Catalog: Hardware`}
              badgeIcon="sparkles"
              status={{
                label: "In Stock & Ready",
                variant: "success",
              }}
              tags={productData.tags}
            >
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border bg-card hover:bg-muted text-foreground transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5 text-muted-foreground" />
                  Share Spec
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
                >
                  <Edit className="w-3.5 h-3.5" />
                  Edit Product
                </button>
              </div>
            </DetailRenderers.Header>
          ),
          mediaSlot: (
            <div className="rounded-xl border border-border/60 bg-gradient-to-r from-primary/10 via-accent/10 to-card p-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                  Featured Product
                </span>
                <h4 className="text-lg font-semibold text-foreground">
                  Aether Pro Series — Audiophile Acoustic Grade
                </h4>
                <p className="text-xs text-muted-foreground max-w-md">
                  Includes factory calibrated frequency response certificate,
                  magnetic docking stand, and dual braided cables.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="px-4 py-2 rounded-lg bg-card border border-border text-center">
                  <div className="text-xs text-muted-foreground font-medium">
                    Rating
                  </div>
                  <div className="text-base font-bold text-foreground">
                    4.9 / 5.0
                  </div>
                </div>
                <div className="px-4 py-2 rounded-lg bg-card border border-border text-center">
                  <div className="text-xs text-muted-foreground font-medium">
                    Warranty
                  </div>
                  <div className="text-base font-bold text-foreground">
                    3 Years
                  </div>
                </div>
              </div>
            </div>
          ),
          actionSlot: (
            <DetailRenderers.BottomActionSlot sticky={false}>
              <div className="flex items-center justify-between w-full">
                <span className="text-xs text-muted-foreground">
                  Last updated by System Admin • 10 minutes ago
                </span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg border border-border bg-card hover:bg-muted text-foreground transition-colors"
                  >
                    <Download className="w-4 h-4 text-muted-foreground" />
                    Export Spec Sheet
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
                  >
                    Duplicate Item
                  </button>
                </div>
              </div>
            </DetailRenderers.BottomActionSlot>
          ),
        }}
      />
    </div>
  ),
};

// ─────────────────────────────────────────────────────────────────────────────
// Story 2: KeyValueLayoutShowcase
// ─────────────────────────────────────────────────────────────────────────────

interface ServerData {
  instanceId: string;
  hostname: string;
  region: string;
  ipAddress: string;
  cpuCores: number;
  memoryGb: number;
  diskGb: number;
  environment: string;
  status: string;
  sslEnabled: boolean;
  uptimeHours: number;
}

const serverDefinition: DetailDefinition<ServerData> = {
  id: "cloud-server-spec",
  title: "Virtual Machine Instance Specs",
  fields: [
    {
      id: "instanceId",
      name: "instanceId",
      type: "text",
      label: "Instance Identifier",
    },
    {
      id: "hostname",
      name: "hostname",
      type: "text",
      label: "FQDN Hostname",
    },
    {
      id: "region",
      name: "region",
      type: "select",
      label: "Deployment Region",
      options: [
        { label: "US East (N. Virginia)", value: "us-east-1" },
        { label: "US West (Oregon)", value: "us-west-2" },
        { label: "EU Central (Frankfurt)", value: "eu-central-1" },
        { label: "Asia Pacific (Tokyo)", value: "ap-northeast-1" },
      ],
    },
    {
      id: "environment",
      name: "environment",
      type: "select",
      label: "Environment Tier",
      options: [
        { label: "Production High-Availability", value: "production" },
        { label: "Staging / Pre-release", value: "staging" },
        { label: "Development Sandbox", value: "development" },
      ],
    },
    {
      id: "ipAddress",
      name: "ipAddress",
      type: "text",
      label: "Primary IPv4 Address",
    },
    {
      id: "cpuCores",
      name: "cpuCores",
      type: "number",
      label: "vCPU Cores Allocated",
    },
    {
      id: "memoryGb",
      name: "memoryGb",
      type: "number",
      label: "RAM Capacity (GB)",
    },
    {
      id: "diskGb",
      name: "diskGb",
      type: "number",
      label: "NVMe SSD Storage (GB)",
    },
    {
      id: "sslEnabled",
      name: "sslEnabled",
      type: "switch",
      label: "Mutual TLS (mTLS) Enforced",
    },
  ],
};

const serverData: ServerData = {
  instanceId: "i-09f8c12a7d4e5b",
  hostname: "prod-api-edge-01.us-east.zenos.internal",
  region: "us-east-1",
  environment: "production",
  ipAddress: "10.128.4.19",
  cpuCores: 16,
  memoryGb: 64,
  diskGb: 500,
  status: "healthy",
  sslEnabled: true,
  uptimeHours: 2480,
};

export const KeyValueLayoutShowcase: Story = {
  render: (args) => (
    <div className="max-w-3xl mx-auto space-y-6">
      <DetailRenderer
        {...args}
        definition={serverDefinition}
        data={serverData}
        layoutStyle="key-value"
        density="compact"
        slots={{
          headerSlot: (
            <DetailRenderers.Header
              title={serverData.hostname}
              subtitle={`Node ID: ${serverData.instanceId} • Region: US East`}
              badgeIcon="server"
              status={{
                label: "Operational / Healthy",
                variant: "success",
              }}
              tags={["Kubernetes Node", "IPv4 Private", "SSD Tier 1"]}
            />
          ),
          footerSlot: (
            <div className="p-4 rounded-xl border border-border/60 bg-muted/30 text-xs text-muted-foreground flex items-center justify-between">
              <span>Telemetry Interval: 10s • Latency: 1.2ms</span>
              <span className="font-mono text-foreground font-semibold">
                Uptime: 99.992%
              </span>
            </div>
          ),
        }}
      />
    </div>
  ),
};

// ─────────────────────────────────────────────────────────────────────────────
// Story 3: SlotInjectionShowcase
// ─────────────────────────────────────────────────────────────────────────────

const slotDefinition: DetailDefinition = {
  id: "telemetry-dashboard-definition",
  title: "Telemetry & Performance Overview",
  fields: [
    {
      id: "telemetry_metrics_slot",
      name: "telemetryMetricsSlot",
      type: "slot",
      label: "Real-time Throughput & Resource Utilization",
    },
    {
      id: "cluster_nodes",
      name: "clusterNodes",
      type: "number",
      label: "Active Worker Nodes",
    },
    {
      id: "active_sessions",
      name: "activeSessions",
      type: "number",
      label: "Concurrent Connected Sessions",
    },
    {
      id: "audit_timeline_slot",
      name: "auditTimelineSlot",
      type: "slot",
      label: "Deployment Audit Log",
    },
  ],
};

export const SlotInjectionShowcase: Story = {
  render: (args) => (
    <div className="max-w-3xl mx-auto space-y-6">
      <DetailRenderer
        {...args}
        definition={slotDefinition}
        data={{
          clusterNodes: 12,
          activeSessions: 3840,
        }}
        layoutStyle="cards"
        slots={{
          headerSlot: (
            <DetailRenderers.Header
              title="Global Ingress Cluster Metrics"
              subtitle="Edge Node Group: us-east • Active Routing"
              badgeIcon="activity"
              status={{
                label: "Live Stream Active",
                variant: "primary",
              }}
              tags={["Dynamic Slots", "Schema Injected", "Zero Form Overhead"]}
            />
          ),
          telemetryMetricsSlot: () => (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-border bg-card/80 flex flex-col gap-1">
                <span className="text-xs text-muted-foreground font-medium">
                  Throughput
                </span>
                <span className="text-2xl font-bold text-foreground">
                  18.4k req/s
                </span>
                <span className="text-[11px] text-emerald-500 font-semibold flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> +12.4% vs last hr
                </span>
              </div>
              <div className="p-4 rounded-xl border border-border bg-card/80 flex flex-col gap-1">
                <span className="text-xs text-muted-foreground font-medium">
                  CPU Utilization
                </span>
                <span className="text-2xl font-bold text-foreground">
                  42.8%
                </span>
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mt-1">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: "42.8%" }}
                  />
                </div>
              </div>
              <div className="p-4 rounded-xl border border-border bg-card/80 flex flex-col gap-1">
                <span className="text-xs text-muted-foreground font-medium">
                  Error Rate
                </span>
                <span className="text-2xl font-bold text-emerald-500">
                  0.003%
                </span>
                <span className="text-[11px] text-muted-foreground">
                  Threshold: 0.1%
                </span>
              </div>
            </div>
          ),
          auditTimelineSlot: () => (
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-xs p-2.5 rounded-lg border border-border/50 bg-muted/20">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="font-mono text-muted-foreground">
                  14:32:01
                </span>
                <span className="font-medium text-foreground">
                  Node auto-scaler provisioned worker-pool-9c
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs p-2.5 rounded-lg border border-border/50 bg-muted/20">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="font-mono text-muted-foreground">
                  14:15:22
                </span>
                <span className="font-medium text-foreground">
                  TLS certificate re-evaluated and pinned
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs p-2.5 rounded-lg border border-border/50 bg-muted/20">
                <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                <span className="font-mono text-muted-foreground">
                  13:58:45
                </span>
                <span className="font-medium text-foreground">
                  Configuration push validated by deployment bot
                </span>
              </div>
            </div>
          ),
        }}
      />
    </div>
  ),
};

// ─────────────────────────────────────────────────────────────────────────────
// Story 4: InteractiveWidgetsWithoutForm
// ─────────────────────────────────────────────────────────────────────────────

const interactiveDefinition: DetailDefinition = {
  id: "quick-settings-panel",
  title: "Session & Live Environment Preferences",
  description:
    "Live interactive widgets operating cleanly without a <form> wrapper",
  fields: [
    {
      id: "darkMode",
      name: "darkMode",
      type: "switch",
      label: "Force Dark High-Contrast Theme",
    },
    {
      id: "notifications",
      name: "notifications",
      type: "checkbox",
      label: "Enable desktop audio chimes for critical alerts",
    },
    {
      id: "bandwidthThrottle",
      name: "bandwidthThrottle",
      type: "range",
      label: "Network Simulation Throttle (Mbps)",
      min: 10,
      max: 1000,
      step: 10,
    },
    {
      id: "activeCluster",
      name: "activeCluster",
      type: "radio",
      label: "Routing Gateway",
      options: [
        { label: "Direct Edge CDN", value: "cdn" },
        { label: "Internal VPC Peering", value: "vpc" },
        { label: "Mock Proxy Local", value: "mock" },
      ],
    },
  ],
};

export const InteractiveWidgetsWithoutForm: Story = {
  render: function InteractiveStory(args) {
    const [liveData, setLiveData] = useState({
      darkMode: true,
      notifications: false,
      bandwidthThrottle: 350,
      activeCluster: "cdn",
    });

    const [eventLog, setEventLog] = useState<string[]>([
      "DetailRenderer initialized in mode='interactive'",
      "Zero <form> tags present in DOM tree",
    ]);

    const handleChange = (fieldId: string, value: any) => {
      setLiveData((prev) => ({ ...prev, [fieldId]: value }));
      setEventLog((prev) => [
        `[${new Date().toLocaleTimeString()}] ${fieldId} ➔ ${JSON.stringify(value)}`,
        ...prev.slice(0, 4),
      ]);
      args.onChange?.(fieldId, value);
    };

    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <DetailRenderer
          {...args}
          definition={interactiveDefinition}
          data={liveData}
          mode="interactive"
          layoutStyle="cards"
          onChange={handleChange}
          slots={{
            headerSlot: (
              <DetailRenderers.Header
                title="Live Controls (Interactive Mode)"
                subtitle="Formless interactive widgets directly modifying application state"
                badgeIcon="sliders"
                status={{
                  label: "mode='interactive'",
                  variant: "warning",
                }}
                tags={[
                  "No <form> Element",
                  "Direct State Binding",
                  "Zero Validation Overhead",
                ]}
              />
            ),
          }}
        />

        {/* Live State Inspector */}
        <div className="p-4 rounded-xl border border-border/70 bg-card text-xs space-y-3 shadow-sm">
          <div className="flex items-center justify-between border-b border-border/50 pb-2">
            <span className="font-semibold text-foreground flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-primary" />
              Live State & Event Dispatcher
            </span>
            <span className="text-muted-foreground font-mono">
              DOM &lt;form&gt; count: 0
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-muted-foreground font-medium mb-1">
                State Record:
              </div>
              <pre className="p-2.5 rounded-lg bg-muted/40 font-mono text-[11px] overflow-auto">
                {JSON.stringify(liveData, null, 2)}
              </pre>
            </div>
            <div>
              <div className="text-muted-foreground font-medium mb-1">
                Recent Changes:
              </div>
              <div className="p-2.5 rounded-lg bg-muted/40 font-mono text-[11px] space-y-1">
                {eventLog.map((log, i) => (
                  <div key={i} className="text-muted-foreground leading-tight">
                    {log}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Story 5: FlatLayoutShowcase
// ─────────────────────────────────────────────────────────────────────────────

const flatDefinition: DetailDefinition = {
  id: "modal-preview-spec",
  title: "Account Security Profile",
  fields: [
    {
      id: "username",
      name: "username",
      type: "text",
      label: "Account Username",
    },
    {
      id: "email",
      name: "email",
      type: "text",
      label: "Registered Primary Email",
    },
    {
      id: "twoFactorEnabled",
      name: "twoFactorEnabled",
      type: "switch",
      label: "Hardware FIDO2 Security Key",
    },
    {
      id: "recoveryEmail",
      name: "recoveryEmail",
      type: "text",
      label: "Secondary Recovery Email",
    },
  ],
};

export const FlatLayoutShowcase: Story = {
  render: (args) => (
    <div className="max-w-2xl mx-auto p-6 rounded-2xl border border-border bg-card/50 shadow-sm space-y-4">
      <DetailRenderer
        {...args}
        definition={flatDefinition}
        data={{
          username: "zen_security_admin",
          email: "security@zenos.enterprise.io",
          twoFactorEnabled: true,
          recoveryEmail: "backup-admin@zenos.enterprise.io",
        }}
        layoutStyle="flat"
        density="comfortable"
        slots={{
          headerSlot: (
            <DetailRenderers.Header
              title="Security & Sign-in Credentials"
              subtitle="Overview of your verified authentication methods"
              badgeIcon="sparkles"
              status={{
                label: "Protected",
                variant: "success",
              }}
            />
          ),
          footerSlot: (
            <div className="pt-4 border-t border-border flex justify-end gap-2">
              <button
                type="button"
                className="px-3.5 py-1.5 text-xs font-medium rounded-lg border border-border bg-card hover:bg-muted text-foreground transition-colors"
              >
                Close Profile
              </button>
            </div>
          ),
        }}
      />
    </div>
  ),
};
