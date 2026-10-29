import React, { useEffect, useState } from "react";

import { classNames } from "@ui/form/utils/field-utils";

import { Zenith } from "@shared/theme";

import { Form } from "../Form";
import {
  type HeaderMetaSchema,
  MetaSchemaBridge,
} from "../utils/MetaSchemaBridge";

// ── Application Metadata Schema ──
export const applicationMetadataSchema: HeaderMetaSchema = {
  id: "application-metadata-schema-form",
  title: "Application Metadata Schema Form",
  description:
    "Configure dynamic routing parameters, slot assignments, and metadata layouts from a dynamic server manifest.",
  fields: [
    {
      name: "routePath",
      type: "text",
      label: "Route Scope Path",
      required: true,
      gridCols: 6,
      defaultValue: "/products",
      placeholder: "e.g., /products",
    },
    {
      name: "pageTitle",
      type: "text",
      label: "Dynamic Page Title",
      required: true,
      gridCols: 6,
      defaultValue: "Zenith Real-Time Shop Catalog",
      placeholder: "e.g., Zenith Shop",
    },
    {
      name: "pageDescription",
      type: "textarea",
      label: "SEO Page Meta Description",
      required: false,
      gridCols: 12,
      defaultValue: "Server-driven dynamically configured product registry.",
      placeholder: "e.g., Detailed product list with pricing...",
    },
    {
      name: "activeLayout",
      type: "select",
      label: "Shell Layout Wrapper",
      required: true,
      gridCols: 6,
      options: [
        { label: "Default Root Shell", value: "default" },
        { label: "High-Performance Analytics Wrapper", value: "page-layout" },
      ],
      defaultValue: "default",
    },
    {
      name: "footerPriority",
      type: "number",
      label: "Footer Links Slot Priority",
      required: true,
      gridCols: 6,
      defaultValue: 25,
      placeholder: "e.g., 25",
    },
  ],
};

export type MetadataSchemaFormProps = React.HTMLAttributes<HTMLDivElement>;

export const MetadataSchemaForm: React.FC<MetadataSchemaFormProps> = ({
  className,
  ...props
}) => {
  const [formDef, setFormDef] = useState<any>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    // Compile using MetaSchemaBridge
    const compiled = MetaSchemaBridge.compileToFormDefinition(
      applicationMetadataSchema
    );
    // Add submit label
    compiled.submitLabel = "Update Layout Manifest";
    setFormDef(compiled);
  }, []);

  const handleSubmit = async (data: any) => {
    // Simulate updating the live server-driven platform manifest
    try {
      const manifestUpdate = {
        routes: [
          {
            path: data.routePath,
            meta: {
              title: `${data.pageTitle} (Server-Driven)`,
              description: data.pageDescription,
            },
          },
        ],
        slots: [
          {
            name: "footer-links",
            component: "dynamic-terms-footer",
            priority: Number(data.footerPriority),
          },
        ],
      };

      // In a real system, we'd make a POST /api/platform/manifest.
      // Here, we update the global window manifest state for live hot-swapping!
      (window as any).__platform_manifest__ = manifestUpdate;

      // If a callback or custom event is needed, dispatch it to trigger dynamic route rebuilds!
      window.dispatchEvent(
        new CustomEvent("platform-manifest-updated", { detail: manifestUpdate })
      );

      setSuccess(
        "Manifest schema updated successfully! Navigation titles will now load dynamically with new labels."
      );
      setTimeout(() => setSuccess(null), 6000);
    } catch (e) {
      console.error(e);
    }
  };

  if (!formDef) return <div>Loading metadata schema...</div>;

  return (
    <div
      className={classNames(
        "p-6 bg-surface/80 backdrop-blur-md border border-white/10 rounded-3xl max-w-4xl mx-auto shadow-premium",
        className
      )}
      {...props}
    >
      <div className="mb-6">
        <h2 className={Zenith.text("h2") + " text-white"}>
          Application Layout Schema
        </h2>
        <p className={Zenith.text("body") + " text-white/60"}>
          Manage server-driven layout schemas natively. Edits are compiled
          instantly using <strong>MetaSchemaBridge</strong> and loaded into the
          routing engine.
        </p>
      </div>

      {success && (
        <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl text-sm font-semibold animate-pulse">
          {success}
        </div>
      )}

      <Form definition={formDef} onSubmit={handleSubmit} />
    </div>
  );
};
