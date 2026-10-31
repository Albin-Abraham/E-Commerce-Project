import React, { useState } from "react";
import {
  Activity,
  CheckCircle2,
  Cpu,
  Download,
  Edit,
  ExternalLink,
  Layers,
  Server,
  Share2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { DetailRenderer as FormDetailRenderer } from "@shared/ui/form/detail/DetailRenderer";
import { DetailRenderer as CoreDetailRenderer } from "@shared/ui/detail/DetailRenderer";
import type { DetailDefinition } from "@shared/ui/form/types";

interface SpecData {
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
  vendorPortalUrl: string;
  lastAudited: string;
}

const mockSpecData: SpecData = {
  id: "spec-900-ent",
  name: "ZenOS Enterprise Edge Gateway",
  sku: "ZOS-EDGE-9000-X",
  category: "enterprise_networking",
  tier: "enterprise",
  price: 1899.5,
  inStock: true,
  stockCount: 48,
  description:
    "Zero-trust micro-segmented network appliance featuring wire-speed encryption, real-time telemetry streaming, and automated failover.",
  tags: ["Zero-Trust", "PCI-DSS Compliant", "Edge Compute", "Redundant PSU"],
  vendorPortalUrl: "https://vendor.zenos.example.com/edge/zos-edge-9000-x",
  lastAudited: "2026-10-31T08:00:00Z",
};

const specDefinition: DetailDefinition<SpecData> = {
  id: "spec-detail-definition",
  title: "Hardware Specification & System Details",
  description: "Enterprise specification metadata and telemetry controls",
  fields: [
    {
      id: "general_section",
      name: "generalSection",
      type: "section",
      label: "General Specification",
      fields: [
        { id: "name", name: "name", type: "text", label: "Product Name" },
        { id: "sku", name: "sku", type: "text", label: "Global SKU" },
        {
          id: "category",
          name: "category",
          type: "select",
          label: "Hardware Category",
          options: [
            { label: "Enterprise Networking", value: "enterprise_networking" },
            { label: "Peripherals", value: "peripherals" },
          ],
        },
        {
          id: "tier",
          name: "tier",
          type: "radio",
          label: "Deployment Tier",
          options: [
            { label: "Standard", value: "standard" },
            { label: "Enterprise Tier", value: "enterprise" },
          ],
        },
      ],
    },
    {
      id: "commercial_section",
      name: "commercialSection",
      type: "section",
      label: "Commercial & Inventory",
      fields: [
        { id: "price", name: "price", type: "number", label: "Unit List Price ($)" },
        { id: "stockCount", name: "stockCount", type: "number", label: "Warehouse Reserved Units" },
        { id: "inStock", name: "inStock", type: "switch", label: "Active Availability Status" },
      ],
    },
  ],
};

const DetailShowcasePage: React.FC = () => {
  const [inStock, setInStock] = useState(mockSpecData.inStock);

  return (
    <div className="min-h-screen bg-background text-foreground py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Page Top Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/60">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                ZenOS UI Presentation Engine
              </span>
              <span className="text-xs text-muted-foreground">Definition-Driven Zero-Form Architecture</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-foreground mt-2">
              DetailRenderer System Showcase
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Inspection surfaces, elevated cards, action bars, links, definition-driven formless fields, and telemetries.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <a
              href="/login"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border border-border bg-surface hover:bg-muted text-foreground transition-all"
            >
              Back to Login Portal
            </a>
          </div>
        </div>

        {/* 1. Header Component Showcase */}
        <FormDetailRenderer.Header
          title={mockSpecData.name}
          subtitle={`SKU: ${mockSpecData.sku} • System Architecture: ARM64 NEON`}
          badgeIcon="sparkles"
          status={{
            label: "Production Certified",
            variant: "success",
          }}
          tags={mockSpecData.tags}
        >
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl border border-border bg-surface hover:bg-muted text-foreground transition-colors"
            >
              <Share2 className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Export Spec</span>
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Edit Attributes</span>
            </button>
          </div>
        </FormDetailRenderer.Header>

        {/* 2. Telemetry and KPI Strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <CoreDetailRenderer.KPI
            title="Mesh Latency"
            value="1.2 ms"
            trend="-0.4 ms vs SLA"
            trendDirection="up"
            subtitle="Real-time multi-region tunnel sync"
            icon={<Activity className="w-5 h-5" />}
          />
          <CoreDetailRenderer.KPI
            title="Throughput"
            value="38.4 Gbps"
            trend="+12% peak"
            trendDirection="up"
            subtitle="Wire-speed hardware offload"
            icon={<Cpu className="w-5 h-5" />}
          />
          <CoreDetailRenderer.KPI
            title="System Security"
            value="100% PASS"
            trend="SOC2 / PCI-DSS"
            trendDirection="neutral"
            subtitle="Verified continuous attestation"
            icon={<ShieldCheck className="w-5 h-5" />}
          />
        </div>

        {/* 3. Key Details Card & Value Display Components */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card A: Key Details Card with KeyValueRows */}
          <FormDetailRenderer.KeyDetailsCard
            title="System Parameters & Cryptography"
            subtitle="Hardware root of trust and crypto accelerators"
            action={
              <span className="text-2xs font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground">
                FIPS 140-3 L3
              </span>
            }
          >
            <div className="divide-y divide-border/40">
              <FormDetailRenderer.KeyValueRow
                label="Primary Hostname"
                value={<span className="font-mono text-xs font-semibold">gw-prod-eu-west1-01</span>}
                description="Canonical internal DNS endpoint"
              />
              <FormDetailRenderer.KeyValueRow
                label="Operational Status"
                value={
                  <FormDetailRenderer.ValueDisplay
                    value={inStock}
                    type="boolean"
                  />
                }
              />
              <FormDetailRenderer.KeyValueRow
                label="Procurement Unit Price"
                value={
                  <FormDetailRenderer.ValueDisplay
                    value={mockSpecData.price}
                    type="currency"
                    currency="USD"
                  />
                }
              />
              <FormDetailRenderer.KeyValueRow
                label="Deployment Tier"
                value={
                  <FormDetailRenderer.ValueDisplay
                    value={mockSpecData.tier}
                    type="select"
                    options={[
                      { label: "Standard", value: "standard" },
                      { label: "Enterprise Tier", value: "enterprise" },
                    ]}
                  />
                }
              />
              <FormDetailRenderer.KeyValueRow
                label="External Vendor Link"
                value={
                  <FormDetailRenderer.ValueDisplay
                    value={mockSpecData.vendorPortalUrl}
                    type="url"
                  />
                }
                description="Secure upstream portal"
              />
            </div>
          </FormDetailRenderer.KeyDetailsCard>

          {/* Card B: Semantic Key-Value Grid */}
          <div className="p-6 rounded-2xl border border-border/70 bg-surface/50 shadow-xs backdrop-blur-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-border/50">
                <div>
                  <h3 className="text-base font-semibold text-foreground tracking-tight">
                    Declarative DetailGrid Projection
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Fast HTML dl/dt/dd projection directly from schema
                  </p>
                </div>
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  Zero Form Overhead
                </span>
              </div>

              <CoreDetailRenderer.Grid
                columns={2}
                schema={{
                  id: "hardware-grid-schema",
                  fields: [
                    { id: "cores", label: "CPU Cores", value: () => "32 Cores @ 3.4GHz" },
                    { id: "ram", label: "System Memory", value: () => "128 GB ECC DDR5" },
                    { id: "nvme", label: "Local Cache", value: () => "2x 1.92TB NVMe Gen4" },
                    { id: "redundancy", label: "Dual PSU", value: () => "Hot-swappable (80+ Titanium)" },
                    {
                      id: "status",
                      label: "Audit Status",
                      value: () => "VERIFIED",
                      format: "badge",
                      badgeIntent: "success",
                    },
                    {
                      id: "uptime",
                      label: "Target SLA",
                      value: () => 0.9999,
                      format: "percent",
                    },
                  ],
                }}
                data={{}}
              />
            </div>

            <div className="mt-6 pt-4 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
              <span>Telemetry sync: Active (500ms heartbeat)</span>
              <span className="font-mono text-2xs">zenos-core-v2.4</span>
            </div>
          </div>
        </div>

        {/* 4. Full Definition-Driven DetailRenderer Engine */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-foreground">
                Definition-Driven Engine Projection
              </h2>
              <p className="text-xs text-muted-foreground">
                Pure schema to UI projection without synthetic validation loops or &lt;form&gt; wrappers.
              </p>
            </div>
          </div>

          <FormDetailRenderer
            definition={specDefinition}
            data={mockSpecData}
            layoutStyle="cards"
            density="comfortable"
          />
        </div>

        {/* 5. Bottom Actions Slot Showcase */}
        <FormDetailRenderer.BottomActions>
          <div className="flex items-center justify-between w-full">
            <span className="text-xs text-muted-foreground">
              Last synchronized: Today at 08:00 UTC
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-border bg-surface hover:bg-muted text-foreground transition-all"
              >
                Discard Changes
              </button>
              <button
                type="button"
                className="px-5 py-2 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-xs"
              >
                Commit System Audit
              </button>
            </div>
          </div>
        </FormDetailRenderer.BottomActions>
      </div>
    </div>
  );
};

export default DetailShowcasePage;
