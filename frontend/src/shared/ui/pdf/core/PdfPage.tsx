/**
 * PdfPage — Single page with fixed header / multi-page dynamic body / fixed footer slots
 *
 * SOLID — Single Responsibility: page geometry + slot layout + section orchestration.
 * GoF   — Template Method: fixed header → dynamic body flow → fixed footer structure.
 *         Composite: renders arrays of PdfNode via PdfNodeRenderer.
 */
import React from "react";

import { Page, View } from "@react-pdf/renderer";

import { PdfPageProvider } from "../core/PdfPageContext";
import { usePdfTheme } from "../core/PdfThemeContext";
import { PdfNodeRenderer } from "../parser/PdfNodeRenderer";
import type { PdfPageDefinition, PdfSectionDefinition } from "../parser/pdf.schema.types";

interface PdfPageProps {
  config: PdfPageDefinition;
}

/**
 * Maps our design-token page names onto the identifiers @react-pdf expects.
 * The library only recognises upper-cased standard sizes (`LETTER`, `LEGAL`),
 * so passing the token key through verbatim would produce an invalid page size.
 */
const REACT_PDF_PAGE_SIZE = {
  A4: "A4",
  Letter: "LETTER",
  Legal: "LEGAL",
} as const;

export const PdfPage: React.FC<PdfPageProps> = ({ config }) => {
  const theme = usePdfTheme();
  // Token key for our own page context, plus the library-facing identifier.
  const size = config.size ?? "A4";
  const reactPdfSize = REACT_PDF_PAGE_SIZE[size];
  const orientation = config.orientation ?? "portrait";
  const headerBorder = config.headerBorder ?? true;
  const footerBorder = config.footerBorder ?? true;
  const headerHeight = config.headerHeight ?? (config.header ? 36 : 0);
  const footerHeight = config.footerHeight ?? (config.footer ? 30 : 0);

  return (
    <PdfPageProvider
      size={size}
      orientation={orientation}
      margin={config.margin ?? "md"}
      headerHeight={headerHeight}
      footerHeight={footerHeight}
    >
      <Page
        size={reactPdfSize}
        orientation={orientation}
        style={{
          backgroundColor: theme.colors.background,
          fontFamily: theme.fonts.body,
          fontSize: theme.fontSize.md,
          color: theme.colors.text,
          paddingTop: theme.spacing.md + (config.header ? headerHeight + 10 : 0),
          paddingBottom: theme.spacing.md + (config.footer ? footerHeight + 10 : 0),
          paddingLeft: theme.spacing.md,
          paddingRight: theme.spacing.md,
        }}
      >
        {/* 1. Fixed HeaderContent — Pinned at top of EVERY physical page */}
        {config.header && (
          <View
            fixed
            style={{
              position: "absolute",
              top: theme.spacing.sm,
              left: theme.spacing.md,
              right: theme.spacing.md,
              height: headerHeight,
              borderBottomWidth: headerBorder ? 1 : 0,
              borderBottomColor: "#D1D5DB",
              paddingBottom: 4,
              justifyContent: "center",
            }}
          >
            {config.header.map((node, i) => (
              <PdfNodeRenderer key={i} node={node} />
            ))}
          </View>
        )}

        {/* 2. BodyContent — Unconstrained dynamic flow across multiple pages */}
        <View style={{ flexGrow: 1, width: "100%" }}>
          {config.sections.map((section: PdfSectionDefinition, si: number) => {
            const sectionStyle: any = {
              width: "100%",
              marginBottom: theme.spacing.md,
            };

            if (section.bordered) {
              sectionStyle.borderWidth = 1;
              sectionStyle.borderColor = "#E5E7EB";
              sectionStyle.borderRadius = theme.radius.md;
              sectionStyle.padding = theme.spacing.md;
            }

            return (
              <View
                key={section.id ?? `section-${si}`}
                wrap={!section.keepTogether}
                break={section.breakBefore}
                style={sectionStyle}
              >
                {/* Section Header (with BorderLine) */}
                {section.header && section.header.length > 0 && (
                  <View
                    style={{
                      borderBottomWidth: 1,
                      borderBottomColor: "#E5E7EB",
                      paddingBottom: 6,
                      marginBottom: 8,
                    }}
                  >
                    {section.header.map((node, hi) => (
                      <PdfNodeRenderer key={`sh-${hi}`} node={node} />
                    ))}
                  </View>
                )}

                {/* Section Body Nodes */}
                {section.nodes.map((node, ni) => (
                  <PdfNodeRenderer key={`sn-${ni}`} node={node} />
                ))}

                {/* Section Footer (with BorderLine) */}
                {section.footer && section.footer.length > 0 && (
                  <View
                    style={{
                      borderTopWidth: 1,
                      borderTopColor: "#E5E7EB",
                      paddingTop: 6,
                      marginTop: 8,
                    }}
                  >
                    {section.footer.map((node, fi) => (
                      <PdfNodeRenderer key={`sf-${fi}`} node={node} />
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* 3. Fixed FooterContent — Pinned at bottom of EVERY physical page */}
        {config.footer && (
          <View
            fixed
            style={{
              position: "absolute",
              bottom: theme.spacing.sm,
              left: theme.spacing.md,
              right: theme.spacing.md,
              height: footerHeight,
              borderTopWidth: footerBorder ? 1 : 0,
              borderTopColor: "#D1D5DB",
              paddingTop: 4,
              justifyContent: "center",
            }}
          >
            {config.footer.map((node, i) => (
              <PdfNodeRenderer key={i} node={node} />
            ))}
          </View>
        )}
      </Page>
    </PdfPageProvider>
  );
};
