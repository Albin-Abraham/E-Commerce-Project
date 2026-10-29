import { useMemo } from "react";

import { useFormActionManager } from "@ui/form/context/ActionContext";
import { useFormOrchestrator } from "@ui/form/context/FormOrchestratorContext";
import { useFormRegistry } from "@ui/form/context/FormRegistryContext";
import { useFormShell } from "@ui/form/context/FormShellContext";
import { useLayoutManager } from "@ui/form/context/LayoutManagerContext";
import type { FormSurfaceShellProps } from "@ui/form/shell/surface-shell";
import { resolveTranslation } from "@ui/form/utils/i18n.utils";
import { Modal } from "@ui/overlay/Modal";
import type { OverlayNavStatus } from "@ui/overlay/OverlayNav";

export type {
  FormSurfaceShell,
  FormSurfaceShellProps,
} from "@ui/form/shell/surface-shell";

function scrollOverlaySection(id: string) {
  const root = document.querySelector("[data-overlay-body]");
  const target = root?.querySelector(`[data-field-id="${id}"]`);
  target?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function sectionStatus(
  sectionId: string,
  form: {
    validity?: Record<string, { valid?: boolean }>;
    vitality?: Record<string, { touched?: boolean }>;
  },
  registry: { definition?: { fields?: Record<string, { sectionId?: string }> } }
): OverlayNavStatus | undefined {
  const fields = registry.definition?.fields || {};
  const fieldIds = Object.entries(fields)
    .filter(([id, field]) => id === sectionId || field.sectionId === sectionId)
    .map(([id]) => id);

  const hasError = fieldIds.some((id) => {
    const invalid = form.validity?.[id]?.valid === false;
    const touched = form.vitality?.[id]?.touched;
    return invalid && touched;
  });

  return hasError ? "error" : undefined;
}

/**
 * Form surface adapter: maps FormShell regions onto the src-1 Overlay composite.
 * Host must open headless so ModalProvider only supplies backdrop + dialog;
 * Modal.Header / Nav / Body / Footer own the chrome inside that frame.
 */
export function ModalShell({ body, footer }: FormSurfaceShellProps) {
  const { definition } = useFormShell();
  const { executeAction } = useFormActionManager();
  const layoutManager = useLayoutManager();
  const orchestrator = useFormOrchestrator();
  const mode = orchestrator?.mode || "edit";
  const { form, registry } = useFormRegistry();
  const title = resolveTranslation(definition.title);
  const description = definition.description
    ? resolveTranslation(definition.description)
    : undefined;

  const navItems = useMemo(
    () =>
      (definition.sections || [])
        .filter((section) => section.id && section.title)
        .map((section) => {
          const id = section.id as string;
          return {
            id,
            label: resolveTranslation(section.title),
            status: sectionStatus(id, form as any, registry as any),
          };
        }),
    [definition.sections, form, registry]
  );

  return (
    <Modal
      close={() => {
        void executeAction("cancel");
      }}
    >
      <Modal.Header
        title={title}
        description={description}
        requiredHint={mode !== "view"}
      />
      <Modal.Nav
        items={navItems}
        onNavigate={(id) => {
          layoutManager.accordion.setOpen(id, true);
          window.setTimeout(() => scrollOverlaySection(id), 80);
        }}
      />
      <Modal.Body>{body}</Modal.Body>
      {footer ? <Modal.Footer>{footer}</Modal.Footer> : null}
    </Modal>
  );
}
