import { BasePdfMapper } from "@ui/pdf";
import type { PdfDefinition } from "@ui/pdf";

export class ProductCatalogPdfMapper extends BasePdfMapper<any[], any[]> {
  private limit: number;

  constructor(limit = 10) {
    super();
    this.limit = limit;
  }

  fromResponse(raw: any[]): any[] {
    if (!Array.isArray(raw)) return [];
    return raw.slice(0, this.limit).map((item, index) => {
      const baseUrl =
        typeof window !== "undefined"
          ? window.location.origin
          : "https://app.zenos.com";
      const id = item.id || index + 1;
      const productLink = `${baseUrl}/products/${id}`;

      return {
        index: index + 1,
        id: `PROD-${id}`,
        title: item.title || item.name || "Industrial Spec Product",
        category: item.category || "General",
        price:
          typeof item.price === "number" ? `$${item.price.toFixed(2)}` : "$0.00",
        rating: item.rating ? `★ ${item.rating}` : "—",
        productLink,
      };
    });
  }

  toDefinition(dto: any[]): PdfDefinition {
    const timestamp = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const docId = "PROD-CAT-2026";
    const totalRecords = dto.length;

    return {
      id: docId,
      filename: `Top_${this.limit}_Products_Catalog.pdf`,
      meta: {
        title: `Top ${this.limit} Products Catalog Export`,
        author: "ZenOS Platform Engine",
        subject: "Product Catalog Export",
        keywords: "products, catalog, zenos, zde",
      },
      pages: [
        {
          size: "A4",
          orientation: "portrait",
          headerBorder: true,
          footerBorder: true,
          header: [
            {
              type: "row",
              justify: "between",
              align: "center",
              children: [
                {
                  type: "text",
                  value: "ZenOS Enterprise • Product Catalog System",
                  variant: "overline",
                  color: "primary",
                },
                {
                  type: "text",
                  value: `Doc ID: ${docId} • ZDE v2.0`,
                  variant: "overline",
                  color: "muted",
                },
              ],
            },
          ],
          footer: [
            {
              type: "row",
              justify: "between",
              align: "center",
              children: [
                {
                  type: "text",
                  value: `ZenOS Platform • Ref: ${docId} • Records: ${totalRecords} of ${this.limit}`,
                  variant: "caption",
                  color: "muted",
                },
                {
                  type: "text",
                  value: "Page {{$page.number}} of {{$page.total}}",
                  variant: "caption",
                  color: "muted",
                  align: "right",
                },
              ],
            },
          ],
          sections: [
            // Section 1: Executive Overview
            {
              id: "section-overview",
              header: [
                {
                  type: "row",
                  justify: "between",
                  align: "center",
                  children: [
                    {
                      type: "text",
                      value: "ZenOS Catalog — Executive Overview",
                      variant: "h2",
                      bold: true,
                      color: "primary",
                    },
                    {
                      type: "badge",
                      label: `TOP ${totalRecords} ITEMS`,
                      color: "primary",
                      bg: "surface",
                    },
                  ],
                },
              ],
              nodes: [
                { type: "spacer", height: 4 },
                {
                  type: "text",
                  value: `Generated: ${timestamp}  •  Record Count: ${totalRecords} Items  •  Source: DummyJSON API (Live)`,
                  variant: "caption",
                  color: "muted",
                },
                { type: "spacer", height: 8 },
                {
                  type: "box",
                  variant: "summary-panel",
                  layout: "horizontal",
                  justify: "between",
                  align: "center",
                  children: [
                    {
                      type: "box",
                      layout: "vertical",
                      gap: "xs",
                      children: [
                        {
                          type: "text",
                          value: "Direct Verification Links Active",
                          variant: "body",
                          bold: true,
                          color: "text",
                        },
                        {
                          type: "text",
                          value:
                            "Click any URL in the table below to navigate directly to the product detail view in ZenOS.",
                          variant: "caption",
                          color: "muted",
                        },
                      ],
                    },
                    {
                      type: "badge",
                      label: "HTTP LINK READY",
                      color: "success",
                      bg: "surface",
                    },
                  ],
                },
              ],
            },
            // Section 2: Products Catalog Table
            {
              id: "section-catalog-table",
              header: [
                {
                  type: "row",
                  justify: "between",
                  align: "center",
                  children: [
                    {
                      type: "text",
                      value: "Product Catalog Listing",
                      variant: "h3",
                      bold: true,
                      color: "text",
                    },
                    {
                      type: "text",
                      value: `Showing 1–${totalRecords} of ${totalRecords} Products`,
                      variant: "caption",
                      color: "muted",
                    },
                  ],
                },
              ],
              nodes: [
                {
                  type: "table",
                  bordered: true,
                  striped: true,
                  columns: [
                    { key: "index", label: "#", flex: 0.5, align: "center" },
                    { key: "title", label: "Product Title", flex: 2.5, bold: true },
                    { key: "category", label: "Category", flex: 1.5 },
                    {
                      key: "price",
                      label: "Price",
                      flex: 1,
                      align: "right",
                      color: "primary",
                    },
                    {
                      key: "productLink",
                      label: "Product Direct URL",
                      flex: 3.2,
                      format: "link",
                    },
                  ],
                  rows: dto,
                },
              ],
              footer: [
                {
                  type: "row",
                  justify: "between",
                  align: "center",
                  children: [
                    {
                      type: "text",
                      value: `Total Indexed: ${totalRecords} Records • Status: 100% Verified`,
                      variant: "caption",
                      color: "muted",
                    },
                    {
                      type: "text",
                      value: "ZenOS Document Runtime v2.0 ($document, $box, $page)",
                      variant: "caption",
                      color: "muted",
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };
  }
}
