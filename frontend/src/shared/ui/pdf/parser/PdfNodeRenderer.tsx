/**
 * PdfNodeRenderer — Dispatches PdfNode → React PDF primitive
 *
 * SOLID — Open/Closed: add new node types by registering in NODE_REGISTRY.
 *         Liskov: every renderer function satisfies NodeRenderer<PdfNode>.
 * GoF   — Chain of Responsibility: resolves renderer from registry.
 *         Decorator: wraps rendered elements to inject `break` and `wrap` attributes.
 *         Visitor: this renderer "visits" each node in the Composite tree.
 */
import React from "react";

import { Text, View } from "@react-pdf/renderer";

import { PdfBadge, PdfDivider, PdfSpacer } from "../primitives/PdfAtoms";
import { PdfBox } from "../primitives/PdfBox";
import { PdfGrid } from "../primitives/PdfGrid";
import { PdfImage } from "../primitives/PdfImage";
import { PdfCol, PdfRow } from "../primitives/PdfRow";
import { PdfTable } from "../primitives/PdfTable";
import { PdfText } from "../primitives/PdfText";
import type { PdfNode } from "./pdf.schema.types";

// ── Renderer type ─────────────────────────────────────────────────────────

type NodeRenderer<T extends PdfNode = PdfNode> = (
  node: T
) => React.ReactElement | null;

// ── Registry (Open/Closed extension point) ────────────────────────────────

/**
 * Keyed by node type so each entry's `node` is narrowed to that variant.
 * `NodeRenderer<any>` erased it to `any`, which made every `node.children.map`
 * callback parameter implicitly any.
 */
type NodeRegistry = {
  [K in PdfNode["type"]]?: NodeRenderer<Extract<PdfNode, { type: K }>>;
};

const NODE_REGISTRY: NodeRegistry = {
  box: (node) => (
    <PdfBox
      id={node.id}
      variant={node.variant}
      layout={node.layout}
      gap={node.gap}
      align={node.align}
      justify={node.justify}
      padding={node.padding}
      margin_bottom={node.margin_bottom}
      bg={node.bg}
      border_color={node.border_color}
      radius={node.radius}
      flex={node.flex}
      width={node.width}
      keep_together={node.keep_together}
      break_before={node.break_before}
      break_after={node.break_after}
    >
      {node.children.map((child: PdfNode, i: number) => (
        <PdfNodeRenderer key={i} node={child} />
      ))}
    </PdfBox>
  ),
  text: (node) => {
    const raw = String(node.value);
    // Handle {{page}}, {{pages}}, {{$page.number}}, {{$page.total}} tokens (used in footers/headers)
    if (
      raw.includes("{{page}}") ||
      raw.includes("{{pages}}") ||
      raw.includes("{{$page.number}}") ||
      raw.includes("{{$page.total}}")
    ) {
      return (
        <Text
          render={({ pageNumber, totalPages }) =>
            raw
              .replace(/\{\{(page|\$page\.number)\}\}/g, String(pageNumber))
              .replace(/\{\{(pages|\$page\.total)\}\}/g, String(totalPages))
          }
          style={{
            flex: node.flex,
            fontSize: 9,
            color: node.color ? undefined : "#6b7280",
            textAlign: node.align ?? "left",
          }}
          fixed
        />
      );
    }
    return (
      <PdfText
        variant={node.variant}
        bold={node.bold}
        italic={node.italic}
        color={node.color}
        align={node.align}
        lineHeight={node.lineHeight}
        transform={node.transform}
        letterSpacing={node.letterSpacing}
        numberOfLines={node.numberOfLines}
        flex={node.flex}
      >
        {raw}
      </PdfText>
    );
  },

  image: (node) => (
    <PdfImage
      src={node.src}
      width={node.width}
      height={node.height}
      fit={node.fit}
      radius={node.radius}
    />
  ),

  divider: (node) => (
    <PdfDivider color={node.color} thickness={node.thickness} my={node.my} />
  ),

  spacer: (node) => <PdfSpacer height={node.height} flex={node.flex} />,

  badge: (node) => (
    <PdfBadge label={node.label} color={node.color} bg={node.bg} />
  ),

  table: (node) => (
    <PdfTable
      columns={node.columns}
      rows={node.rows}
      striped={node.striped}
      bordered={node.bordered}
    />
  ),

  "page-break": () => <View break style={{ height: 0 }} />,

  row: (node) => (
    <PdfRow
      gap={node.gap}
      align={node.align}
      justify={node.justify}
      wrap={node.wrap}
      flex={node.flex}
    >
      {node.children.map((child, i) => (
        <PdfNodeRenderer key={i} node={child} />
      ))}
    </PdfRow>
  ),

  col: (node) => (
    <PdfCol gap={node.gap} align={node.align} flex={node.flex} span={node.span}>
      {node.children.map((child, i) => (
        <PdfNodeRenderer key={i} node={child} />
      ))}
    </PdfCol>
  ),

  grid: (node) => (
    <PdfGrid columns={node.columns} gap={node.gap}>
      {node.children.map((child, i) => (
        <PdfNodeRenderer key={i} node={child} />
      ))}
    </PdfGrid>
  ),
};

// ── Renderer component ─────────────────────────────────────────────────────

interface PdfNodeRendererProps {
  node: PdfNode;
}

export const PdfNodeRenderer: React.FC<PdfNodeRendererProps> = ({ node }) => {
  const renderer = NODE_REGISTRY[node.type] as NodeRenderer | undefined;
  if (!renderer) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[PdfNodeRenderer] Unregistered node type: "${node.type}"`);
    }
    return null;
  }

  const element = renderer(node);
  if (!element) return null;

  // Decorator pattern: Wrap element in a View container to inject break and wrap options safely, avoiding cloneElement crashes
  if (
    ("break" in node && node.break !== undefined) ||
    ("wrap" in node && node.wrap === false)
  ) {
    return (
      <View
        break={(node as any).break}
        wrap={(node as any).wrap}
        style={{ width: "100%" }}
      >
        {element}
      </View>
    );
  }

  return element;
};

// ── Extension API — register custom node types at runtime ─────────────────

export function registerPdfNodeRenderer<T extends PdfNode>(
  type: T["type"],
  renderer: NodeRenderer<T>
): void {
  (NODE_REGISTRY as any)[type] = renderer;
}
