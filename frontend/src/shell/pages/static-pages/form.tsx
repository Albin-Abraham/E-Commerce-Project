import React from "react";
import { useTranslation } from "react-i18next";
import { useFetcher } from "react-router-dom";

import { Form } from "@ui/form/Form";
import { useFormContext, useWatchFields } from "@ui/form/hooks";
import type { FormDefinition } from "@ui/form/types";
import { fuseSchema } from "@ui/form/utils/schema-fusion";

import { EmployeeUIConfig } from "@pages/static-pages/configs/employee-ui";
import { EmployeeValidationRules } from "@pages/static-pages/validations/employee-rules";

export interface EmployeeOnboardingData {
  fullName: string;
  email: string;
  phone: string;
  department: string;
  citizenship: string;
  permitNumber?: string;
  expiryDate?: string;
}

// ── Programmatic Hook Demonstration ──────────────────────────────────────────
const LivePreview = () => {
  const form = useFormContext();
  const { fullName, department } = useWatchFields<{
    fullName: string;
    department: string;
  }>(["fullName", "department"]);
  const { t } = useTranslation("features/forms");

  return (
    <div className="mt-8 p-6 bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 shadow-glow rounded-[32px] flex flex-col gap-4 transition-all duration-500 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-black text-xl shadow-inner">
          {fullName ? fullName.charAt(0).toUpperCase() : "?"}
        </div>
        <div>
          <h3 className="text-base font-bold text-foreground tracking-tight">
            {fullName || t("onboarding.previewCard.awaitingName")}
          </h3>
          <p className="text-xs text-foreground/50 font-medium mt-1">
            {department === "eng"
              ? t("onboarding.previewCard.engDivision")
              : department === "hr"
                ? t("onboarding.previewCard.hrDivision")
                : t("onboarding.previewCard.selectDepartment")}
          </p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-[10px] uppercase tracking-widest font-black text-primary/60 mb-1">
            {t("onboarding.previewCard.engineState")}
          </p>
          <div
            className={`px-3 py-1 rounded-full text-[10px] font-bold ${form.isValid ? "bg-green-500/10 text-green-500" : "bg-amber-500/10 text-amber-500"}`}
          >
            {form.isValid
              ? t("onboarding.previewCard.validPayload")
              : t("onboarding.previewCard.pendingInput")}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Language Toggle ─────────────────────────────────────────────────────────
const LanguageToggle = ({ i18n }: { i18n: any }) => (
  <div className="flex gap-2">
    {["en", "es"].map((lang) => (
      <button
        key={lang}
        onClick={() => i18n.changeLanguage(lang)}
        className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
          i18n.language === lang
            ? "bg-primary text-white shadow-glow"
            : "bg-white/5 border border-white/10 text-white/60 hover:bg-white/10"
        }`}
      >
        {lang.toUpperCase()}
      </button>
    ))}
  </div>
);

// ── Industrialized Schema ──────────────────────────────────────────────────
const onboardingSchema: FormDefinition<EmployeeOnboardingData> = {
  id: "onboarding-industrial",
  title: "onboarding.title",
  description: "onboarding.description",
  submitLabel: "onboarding.submit",

  // === METASCHEMA LAYERS ===
  content: {
    id: "employee-onboarding-entity",
    entityName: "Employee",
    title: "Employee Onboarding",
    description: "New hire onboarding entity",
  },
  surface: {
    // `layout: { type: "tabs" }` has no home on SurfaceDefinition; the
    // container layout is declared by `content.sections[].layout` below.
    ui: { target: "screen" },
    print: {
      target: "print",
      paper: "A4",
      orientation: "portrait",
      header: "Zenith Employee Onboarding Document",
    },
  },
  behavior: {},
  presentation: {
    theme: "dark",
  },

  metadata: {
    events: {
      onSubmit: async () => {
        // Intent mapped to formActions below
      },
    },
  },
  settings: {
    layoutMode: "dashboard",
    width: "centered",
    density: "comfortable",
    hideHeader: true,
    navigationGuard: true,
  },

  // Showcase structural DOM elements (Tabs)
  layout: { type: "tabs" },
  sections: [
    {
      key: "tab_personal",
      title: "onboarding.sections.personal.title",
      fields: [
        {
          key: "identity_group",
          type: "group",
          label: "onboarding.sections.personal.description",
          layout: { columnSpan: 12 },
          fields: [
            {
              key: "fullName",
              type: "text",
              label: "onboarding.fields.fullName",
              required: true,
              validation: EmployeeValidationRules.validations.fullName,
              layout: { columnSpan: 12 },
            },
            {
              key: "email",
              type: "email",
              label: "onboarding.fields.email",
              required: true,
              validation: EmployeeValidationRules.validations.email,
              layout: { columnSpan: 6 },
            },
            {
              key: "phone",
              type: "phone",
              label: "onboarding.fields.phone",
              required: true,
              validation: EmployeeValidationRules.validations.phone,
              layout: { columnSpan: 6 },
            },
          ],
        },
      ],
    },
    {
      key: "tab_employment",
      title: "onboarding.sections.employment.title",
      fields: [
        {
          key: "department",
          type: "select",
          label: "onboarding.fields.department.label",
          required: true,
          options: [
            { label: "onboarding.fields.department.options.eng", value: "eng" },
            { label: "onboarding.fields.department.options.hr", value: "hr" },
          ],
          layout: { columnSpan: 6 },
        },
        {
          key: "citizenship",
          type: "select",
          label: "onboarding.fields.citizenship.label",
          required: true,
          options: [
            {
              label: "onboarding.fields.citizenship.options.citizen",
              value: "citizen",
            },
            { label: "onboarding.fields.citizenship.options.pr", value: "pr" },
            {
              label: "onboarding.fields.citizenship.options.permit",
              value: "permit",
            },
          ],
          layout: { columnSpan: 6 },
        },
        // Showcase structural conditional fieldsets
        {
          key: "permit_details",
          type: "fieldset",
          label: "onboarding.fields.permitDetails",
          description: "onboarding.fields.permitDetailsDesc",
          layout: { columnSpan: 12 },
          visible: false,
          conditions: {
            groups: [
              {
                rules: [
                  { field: "citizenship", operator: "eq", value: "permit" },
                ],
                action: "show",
              },
            ],
          },
          fields: [
            {
              key: "permitNumber",
              type: "text",
              label: "onboarding.fields.permitNumber",
              required: true,
              layout: { columnSpan: 6 },
            },
            {
              key: "expiryDate",
              type: "text",
              label: "onboarding.fields.expiryDate",
              required: true,
              layout: { columnSpan: 6 },
            },
          ],
        },
      ],
    },
  ],

  // Custom slots appended to the end of the form
  fields: [
    {
      key: "live_preview",
      type: "slot",
      label: "onboarding.fields.preview",
      meta: { ui: { component: LivePreview } },
      layout: { columnSpan: 12 },
    },
  ],
};

export default function TestFormModel() {
  const { i18n } = useTranslation();
  const formRef = React.useRef<any>(null);
  const fetcher = useFetcher();

  const formActions = {
    "dispatch:SUBMIT_ONBOARDING": async (payload: any) => {
      fetcher.submit(
        {
          intent: "SUBMIT_ONBOARDING",
          data: JSON.stringify(payload.form.getValues()),
        },
        { method: "post" }
      );
    },
  };

  // Fuse logical schema with UI config (DCS pattern)
  const fusedSchema = React.useMemo(
    () => fuseSchema(onboardingSchema, EmployeeUIConfig),
    []
  );

  return (
    <div className="app-page-container min-h-screen p-4 sm:p-8 lg:p-12 bg-architectural-grid/30 flex flex-col items-center justify-start relative overflow-y-auto">
      {/* Background Radial Ambient Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-5xl relative z-10 my-4 sm:my-8">
        <div className="mb-6 flex justify-between items-center w-full">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 mb-3 shadow-inner">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              {i18n.t("onboarding.badge", { ns: "features/forms" })}
            </div>
            <h1 className="text-3xl font-black text-foreground tracking-tight">
              {i18n.t("onboarding.title", { ns: "features/forms" })}
            </h1>
            <p className="text-sm font-medium text-foreground/60 mt-1">
              {i18n.t("onboarding.description", { ns: "features/forms" })}
            </p>
          </div>
          <LanguageToggle i18n={i18n} />
        </div>

        {/* Error handling delegated to fetcher state */}
        {fetcher.data?.error && (
          <div className="mb-6 p-4 bg-danger/10 border border-danger/30 rounded-2xl text-danger text-sm font-semibold animate-in fade-in">
            {fetcher.data.error}
          </div>
        )}

        <div className="bg-surface/90 backdrop-blur-xl border border-border/80 rounded-[28px] p-6 sm:p-10 shadow-2xl transition-all duration-500 hover:border-primary/40">
          <Form<EmployeeOnboardingData>
            ref={formRef}
            definition={fusedSchema}
            actions={formActions}
            i18nNamespace="features/forms"
            className="w-full animate-in fade-in zoom-in-95 duration-1000"
          />
        </div>
      </div>
    </div>
  );
}
