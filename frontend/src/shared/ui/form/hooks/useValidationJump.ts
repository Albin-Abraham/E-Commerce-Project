import { useCallback } from "react";

import { useFormRegistry } from "../context/FormRegistryContext";
import { useLayoutManager } from "../context/LayoutManagerContext";

/**
 * Hook to automatically expand Tabs and Accordions when a validation error occurs.
 * Works by looking up the first invalid field in FormCore, then walking up its
 * ancestor chain to find any parent layout nodes, and imperatively opening them.
 */
export const useValidationJump = () => {
  const layoutManager = useLayoutManager();
  const { form, registry } = useFormRegistry();

  const jumpToFirstError = useCallback(() => {
    // 1. Find the first invalid field ID — guard against missing form/validity (e.g. preview / defaultRegistry fallback)
    if (!form?.validity) return;
    const validity = form.validity;
    const invalidFieldId = Object.keys(validity).find(
      (id) => !validity[id]?.valid
    );

    if (!invalidFieldId) return;

    // 2. Find the field node in the flat registry
    // `useFormRegistry().registry` is the component RegistryStore (no definition), the
    // normalized definition lives on `form.registry` (FieldRegistry). Use that first.
    const registryDef =
      (form as any)?.registry?.definition ??
      (registry as any)?.definition ??
      (form as any)?.definition;
    if (!registryDef?.fields) return;
    const fieldNode = registryDef.fields[invalidFieldId];
    if (!fieldNode) return;

    // 3. Walk up the parent chain
    let currentId: string | undefined =
      fieldNode.parentId || fieldNode.sectionId;

    while (currentId) {
      const parentNode =
        registryDef.fields[currentId] || registryDef.sections[currentId];

      if (!parentNode) break;

      // 4. If parent is a layout node, expand it
      if (parentNode.type === "accordion") {
        layoutManager?.accordion?.setOpen?.(parentNode.id, true);
      } else if (
        parentNode.type === "section" &&
        parentNode.layout?.type === "tabs"
      ) {
        // For tabs, the direct child of the tabs section is the tab pane itself.
        // We need to figure out which tab pane we are inside.
        const tabChildren = parentNode.fields || [];
        const activeTabChild = tabChildren.find((child: any) => {
          const childId = child.id || child.key;
          // Pass the resolved definition wrapper so helper can find ancestors
          return isAncestorOrSelf(
            { definition: registryDef } as any,
            childId,
            invalidFieldId
          );
        });

        if (activeTabChild) {
          layoutManager?.tabs?.setActiveTab?.(
            parentNode.id,
            activeTabChild.id || activeTabChild.key
          );
        }
      }

      currentId = parentNode.parentId || parentNode.sectionId;
    }

    window.setTimeout(() => {
      const root =
        document.querySelector("[data-overlay-body]") || document.body;
      const invalid = root.querySelector<HTMLElement>(
        '[data-error="true"], [aria-invalid="true"]'
      );
      invalid?.scrollIntoView({ behavior: "smooth", block: "center" });
      const input = invalid?.querySelector<HTMLElement>(
        'input, select, textarea, [tabindex="0"], [role="combobox"]'
      );
      input?.focus({ preventScroll: true });
    }, 280);
  }, [form, registry, layoutManager]);

  return jumpToFirstError;
};

/**
 * Helper to determine if `nodeId` is an ancestor of (or equals) `targetId`.
 */
function isAncestorOrSelf(
  registry: any,
  nodeId: string,
  targetId: string
): boolean {
  if (!nodeId || !targetId) return false;
  if (nodeId === targetId) return true;

  let currentId: string | undefined = targetId;
  while (currentId) {
    if (currentId === nodeId) return true;
    const registryDef = registry?.definition;
    if (!registryDef?.fields || !registryDef?.sections) break;
    const node:
      | { parentId?: string; sectionId?: string }
      | undefined =
      registryDef.fields[currentId] || registryDef.sections[currentId];
    if (!node) break;
    currentId = (node as any).parentId || (node as any).sectionId;
  }

  return false;
}
