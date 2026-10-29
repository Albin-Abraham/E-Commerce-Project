import i18n from "@core/i18n/i18n";
import type { FormDefinition } from "@ui/form/types";
import { compileEntityToFormDef } from "@ui/form/utils/mdap-compiler";

import type { WorkspaceFormData, WorkspaceOptions } from "./workspace-logical";
import { buildWorkspaceEntity } from "./workspace-logical";

/**
 * buildWorkspaceSchema
 *
 * Compiles a FormDefinition for the workspace session picker.
 * Called on every render so dynamic options (companies / BUs / branches)
 * are always fresh — identical to how AuthPortalPage rebuilds its schema
 * when the mode toggle changes.
 */
export function buildWorkspaceSchema(
  opts: WorkspaceOptions = {}
): FormDefinition<WorkspaceFormData> {
  const submitLabel = i18n.t("actions.launch", {
    ns: "screens/workspace",
  });

  return compileEntityToFormDef(
    buildWorkspaceEntity(opts),
    "workspace-session-form",
    submitLabel
  );
}
