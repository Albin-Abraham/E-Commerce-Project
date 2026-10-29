import type { FormDefinition } from "../types";
import type { ContainerDefinition, ShellNode } from "../types/layout";

/**
 * generateDefaultSplitShell
 *
 * Synthesizes a responsive 12-column grid shell for split-layout forms
 * that define a split container instead of an explicit `definition.shell`.
 *
 * Layout fidelity:
 * - 40/60 maps to { base: 12, lg: 5 } and { base: 12, lg: 7 }
 * - 50/50 maps to { base: 12, lg: 6 } and { base: 12, lg: 6 }
 * - 30/70 maps to { base: 12, lg: 4 } and { base: 12, lg: 8 }
 */
export function generateDefaultSplitShell(
  definition: FormDefinition
): ShellNode[] {
  const splitContainer = definition.containers?.find(
    (c) => c.type === "split"
  ) as ContainerDefinition | undefined;

  if (!splitContainer) return [];

  const {
    splitRatio = "50/50",
    topContent,
    leftContent,
    rightContent,
  } = splitContainer.config || {};

  let leftSpan = { base: 12, lg: 6 };
  let rightSpan = { base: 12, lg: 6 };

  if (splitRatio === "40/60") {
    leftSpan = { base: 12, lg: 5 };
    rightSpan = { base: 12, lg: 7 };
  } else if (splitRatio === "30/70") {
    leftSpan = { base: 12, lg: 4 };
    rightSpan = { base: 12, lg: 8 };
  }

  const gridChildren: ShellNode[] = [];

  if (leftContent) {
    gridChildren.push({
      node: "surface",
      type: "card",
      colSpan: leftSpan,
      config: { "data-pane": "left" },
      className: "hidden sm:block relative h-full overflow-hidden",
      children: [
        {
          node: "content",
          ...(leftContent as any),
        },
      ],
    } as any);
  }

  if (rightContent) {
    gridChildren.push({
      node: "surface",
      type: "card",
      colSpan: rightSpan,
      config: { "data-pane": "right" },
      className:
        rightContent.className ||
        "relative h-full flex flex-col justify-center",
      children: [
        {
          node: "content",
          ...(rightContent as any),
        },
      ],
    } as any);
  }

  const shellNodes: ShellNode[] = [];

  if (topContent) {
    shellNodes.push({
      node: "layout",
      type: "box",
      className: "w-full border-b border-border",
      children: [
        {
          node: "content",
          ...(topContent as any),
        },
      ],
    } as any);
  }

  shellNodes.push({
    node: "layout",
    type: "grid",
    config: { columns: 12 },
    className: "w-full overflow-hidden",
    children: gridChildren,
  } as any);

  return shellNodes;
}
