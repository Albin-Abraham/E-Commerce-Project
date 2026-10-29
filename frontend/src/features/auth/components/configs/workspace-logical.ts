import i18n from "@core/i18n/i18n";
import type { FieldOption } from "@ui/form/fields";
import type {
  ContentDefinition,
  EntityDefinition,
} from "@ui/form/types/application";

import {
  buildWorkspacePresentation,
  buildWorkspaceSurface,
} from "./workspace-surface";

export interface WorkspaceFormData extends Record<string, any> {
  company_id: string;
  business_unit_id: string;
  branch_id?: string;
}

export interface WorkspaceOptions {
  companies?: FieldOption[];
  businessUnits?: FieldOption[];
  branches?: FieldOption[];
  loadingBUs?: boolean;
  loadingBranches?: boolean;
  onReset?: () => void;
}

/**
 * buildWorkspaceContent
 *
 * Produces the ContentDefinition for the Workspace session form.
 * Options are injected dynamically from query results so that the
 * form schema rebuilds whenever the user changes company / BU.
 */
export function buildWorkspaceContent(
  _opts: WorkspaceOptions = {}
): ContentDefinition<WorkspaceFormData> {
  const t = (key: string) => i18n.t(key, { ns: "screens/workspace" });

  const title = t("title");
  const subtitle = t("subtitle");
  const readyText = t("alerts.ready");

  return {
    id: "workspace-content",
    title: title || "Workspace Configuration",
    sections: [
      {
        id: "workspace-fields",
        title: "",
        fields: [
          {
            id: "workspace-header",
            type: "html",
            label: title,
            layout: { columnSpan: 12 },
            customData: {
              content: `
                <div class="flex items-center gap-4 mb-6">
                  <div class="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                      <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                  </div>
                  <div>
                    <h3 class="text-lg font-semibold text-foreground m-0">${title}</h3>
                    <p class="text-sm text-foreground/60 m-0 mt-1">${subtitle}</p>
                  </div>
                </div>
              `,
            },
          },
          {
            id: "company_id",
            name: "company_id",
            type: "string", // Logical domain type (Foreign Key UUID)
            label: `${t("fields.company.label")} *`,
            required: true,
            placeholder: t("fields.company.placeholder"),
            layout: { columnSpan: 12 },
            remoteOptions: {
              url: "/api/v1/sessions/user/companies/",
              mapping: {
                labelPath: "name",
                valuePath: "id",
                descriptionPath: "code",
                iconPath: "icon",
              },
            },
            meta: {
              ui: {
                component: "select", // Presentation layer binding
                classNames: { base: "mb-4" },
                listAction: {
                  position: "top",
                  label: t("fields.company.createAction"),
                  onClick: () => {
                    // Future extension point
                  },
                },
              },
            },
          },
          {
            id: "business_unit_id",
            name: "business_unit_id",
            type: "string", // Logical domain type (Foreign Key UUID)
            label: `${t("fields.businessUnit.label")} *`,
            required: true,
            placeholder: t("fields.businessUnit.placeholder"),
            layout: { columnSpan: 12 },
            remoteOptions: {
              url: "/api/v1/sessions/user/business-units/",
              params: { company_id: "{company_id}" },
              watch: ["company_id"],
              mapping: {
                labelPath: "name",
                valuePath: "id",
                descriptionPath: "code",
                iconPath: "icon",
              },
            },
            enabled: (values: WorkspaceFormData) => !!values.company_id,
            meta: {
              ui: {
                component: "select", // Presentation layer binding
                classNames: { base: "mb-4" },
              },
            },
          },
          {
            id: "ready_alert",
            type: "html",
            label: "Ready Alert",
            layout: { columnSpan: 12 },
            visible: (values: any) =>
              Boolean(values?.company_id && values?.business_unit_id),
            customData: {
              content: `
                <div class="flex items-center gap-2 p-3 bg-success/10 text-success rounded-lg border border-success/20 text-sm font-medium mt-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                  ${readyText}
                </div>
              `,
            },
          },
        ],
      },
    ],
  };
}

export const buildWorkspaceEntity = (
  opts: WorkspaceOptions = {}
): EntityDefinition<WorkspaceFormData> => ({
  id: "entity-workspace",
  name: "Workspace Form",
  content: buildWorkspaceContent(opts),
  behavior: {
    pipeline: {
      middleware: [],
    },
  },
  surface: buildWorkspaceSurface(),
  presentation: buildWorkspacePresentation(),
});
