import React from "react";

import type { ContentDefinition } from "../types/content";
import type { PrintSurface } from "../types/surface";

export interface PrintDocumentRendererProps {
  content: ContentDefinition;
  data: Record<string, any>;
  printConfig?: PrintSurface;
}

/**
 * PrintDocumentRenderer
 * Renders a clean printable document (HTML / A4 format) directly from ContentDefinition
 * and form data, completely independent of interactive React UI form components.
 */
export const PrintDocumentRenderer: React.FC<PrintDocumentRendererProps> = ({
  content,
  data,
  printConfig,
}) => {
  const paperSize = printConfig?.paper || "A4";
  const orientation = printConfig?.orientation || "portrait";
  const hideFields = new Set(printConfig?.hideFields || []);

  return (
    <div
      className={`print-document-container paper-${paperSize.toLowerCase()} orientation-${orientation}`}
      style={{
        padding: "32px",
        backgroundColor: "var(--color-surface, #ffffff)",
        color: "var(--color-foreground, #111827)",
        fontFamily: "var(--font-sans, Inter, Roboto, sans-serif)",
        maxWidth: orientation === "portrait" ? "210mm" : "297mm",
        margin: "0 auto",
      }}
    >
      {/* Printable Header */}
      {printConfig?.header && (
        <div
          style={{
            borderBottom: "2px solid var(--color-border, #e5e7eb)",
            paddingBottom: "16px",
            marginBottom: "24px",
          }}
        >
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>
            {printConfig.header}
          </h2>
        </div>
      )}

      {/* Document Title & Entity Info */}
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 800, margin: "0 0 8px 0" }}>
          {typeof content.title === "string"
            ? content.title
            : content.title?.text || content.id}
        </h1>
        {content.description && (
          <p style={{ color: "var(--color-muted, #6b7280)", margin: 0 }}>
            {typeof content.description === "string"
              ? content.description
              : content.description?.text}
          </p>
        )}
      </div>

      {/* Sections and Data Grid */}
      {content.sections ? (
        content.sections.map((section) => (
          <div key={section.id} style={{ marginBottom: "24px" }}>
            <h3
              style={{
                fontSize: "1.125rem",
                fontWeight: 600,
                borderBottom: "1px solid var(--color-border-soft, #f3f4f6)",
                paddingBottom: "8px",
                marginBottom: "12px",
              }}
            >
              {typeof section.title === "string"
                ? section.title
                : (section as any).title?.text}
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: "12px",
              }}
            >
              {(section as any).fields?.map((field: any) => {
                if (hideFields.has(field.id || field.name)) return null;
                const rawVal = data[field.name || field.id];
                const displayVal =
                  rawVal !== undefined && rawVal !== null
                    ? String(rawVal)
                    : "-";

                return (
                  <div
                    key={field.id || field.name}
                    style={{ padding: "8px 0" }}
                  >
                    <div
                      style={{
                        fontSize: "0.75rem",
                        textTransform: "uppercase",
                        color: "var(--color-muted, #6b7280)",
                        fontWeight: 600,
                      }}
                    >
                      {typeof field.label === "string"
                        ? field.label
                        : field.label?.text || field.name}
                    </div>
                    <div
                      style={{
                        fontSize: "0.95rem",
                        fontWeight: 500,
                        marginTop: "4px",
                      }}
                    >
                      {displayVal}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "12px",
          }}
        >
          {content.fields?.map((field) => {
            if (hideFields.has(field.id || (field as any).name)) return null;
            const fieldName = (field as any).name || field.id;
            const rawVal = data[fieldName];
            const displayVal =
              rawVal !== undefined && rawVal !== null ? String(rawVal) : "-";

            return (
              <div key={field.id || fieldName} style={{ padding: "8px 0" }}>
                <div
                  style={{
                    fontSize: "0.75rem",
                    textTransform: "uppercase",
                    color: "var(--color-muted, #6b7280)",
                    fontWeight: 600,
                  }}
                >
                  {typeof field.label === "string"
                    ? field.label
                    : (field as any).label?.text || fieldName}
                </div>
                <div
                  style={{
                    fontSize: "0.95rem",
                    fontWeight: 500,
                    marginTop: "4px",
                  }}
                >
                  {displayVal}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Printable Footer */}
      {printConfig?.footer && (
        <div
          style={{
            marginTop: "32px",
            borderTop: "1px solid var(--color-border, #e5e7eb)",
            paddingTop: "16px",
            fontSize: "0.85rem",
            color: "var(--color-muted, #9ca3af)",
            textAlign: "center",
          }}
        >
          {printConfig.footer}
        </div>
      )}
    </div>
  );
};
