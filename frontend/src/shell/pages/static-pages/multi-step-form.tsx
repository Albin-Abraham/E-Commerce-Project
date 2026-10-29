import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useFetcher } from "react-router-dom";

import { Button } from "@heroui/react";
import { Form } from "@ui/form/Form";
import type { FormDefinition } from "@ui/form/types";
import { Modal } from "@ui/modal";

import {
  EmployeeOnboardingEvents,
  EmployeeOnboardingValidationRules,
} from "./validations/employee-onboarding";

const onboardingSchema: FormDefinition = {
  id: "onboarding-wizard",
  title: "onboarding.title",
  submitLabel: "Complete Onboarding",

  // === METASCHEMA LAYERS ===
  content: {
    id: "onboarding-wizard-entity",
    entityName: "EmployeeWizard",
    title: "Employee Onboarding Wizard",
    description: "Multi-step onboarding form with conditional validation",
  },
  surface: {
    // SurfaceDefinition is a record of surfaces, each with its own `target`
    // discriminant. `layout: { type: "wizard" }` had no home here — the wizard
    // is configured (and actually read) via `settings.wizard` below.
    ui: { target: "screen" },
    print: {
      target: "print",
      paper: "A4",
      orientation: "portrait",
      header: "Employee Onboarding Wizard Summary",
    },
  },
  behavior: {},
  presentation: {
    theme: "dark",
  },

  metadata: {
    events: {
      onSubmit: async () => {},
    },
  },
  settings: {
    layoutMode: "dashboard",
    density: "spacious",
    navigationGuard: true,
    wizard: {
      enabled: true,
      stepperType: "top",
      linear: true,
    },
  },
  sections: [
    {
      id: "personal-details",
      title: "Personal Details",
      description: "Basic identification and contact information.",
      layout: {
        type: "grid",
        columns: 12,
        gap: "lg",
        wrapOuter: false,
      },
      fields: [
        {
          id: "header_personal",
          type: "header",
          label: "Personal Profile",
          description: "Let's start with your basic information",
          properties: { alignment: "center" },
          meta: { ui: { variant: "h2" } },
        },
        {
          key: "first_name",
          type: "text",
          label: "First Name",
          required: true,
          layout: { columnSpan: 6 },
          properties: { placeholder: "e.g. John" },
          validation: EmployeeOnboardingValidationRules.firstName,
          meta: { ui: { icon: "user" } },
        },
        {
          key: "last_name",
          type: "text",
          label: "Last Name",
          required: true,
          layout: { columnSpan: 6 },
          properties: { placeholder: "e.g. Doe" },
          validation: EmployeeOnboardingValidationRules.lastName,
          meta: { ui: { icon: "user" } },
        },
        {
          key: "email",
          type: "email",
          label: "Email Address",
          required: true,
          layout: { columnSpan: 6 },
          properties: {
            placeholder: "john.doe@company.com",
            description: "We'll use this for your official account setup.",
          },
          meta: { ui: { icon: "mail" } },
        },
        {
          key: "phone",
          type: "phone",
          label: "Phone Number",
          layout: { columnSpan: 6 },
          validation: EmployeeOnboardingValidationRules.phone,
          meta: { ui: { icon: "phone" } },
        },
        {
          id: "id_check",
          type: "card",
          label: "Identity Check",
          headless: true,
          layout: { columnSpan: 12 },
          meta: {
            ui: {
              cardElevation: "sm",
            },
          },
          properties: {
            display: "grid",
            columns: 2,
            gap: 6,
          },
          fields: [
            {
              id: "id_check_header",
              type: "header",
              label: "Government ID",
              description: "Secure identity verification check",
              properties: { alignment: "center" },
              layout: { columnSpan: 2 },
            },
            {
              id: "id_type",
              name: "id_check.type",
              type: "select",
              label: "Document Type",
              options: [
                { label: "Passport", value: "passport" },
                { label: "Driver's License", value: "license" },
                { label: "National ID", value: "national_id" },
              ],
              layout: { columnSpan: 6 },
            },
            {
              id: "id_number",
              name: "id_check.number",
              type: "text",
              label: "ID Number",
              properties: { placeholder: "X-XXXX-XXXX" },
              layout: { columnSpan: 6 },
              meta: { events: EmployeeOnboardingEvents.id_number },
            },
          ],
        },
        {
          id: "martial_status_group",
          type: "card",
          label: "Status & Citizenship",
          headless: true,
          layout: { columnSpan: 12 },
          meta: {
            ui: {
              cardElevation: "sm",
            },
          },
          properties: {
            display: "grid",
            columns: 2,
            gap: 6,
          },
          fields: [
            {
              key: "marital_status",
              type: "select",
              label: "Marital Status",
              initialValue: "single",
              layout: { columnSpan: 6 },
              properties: { placeholder: "Select your status" },
              options: [
                { label: "Single", value: "single" },
                { label: "Married", value: "married" },
                { label: "Divorced", value: "divorced" },
              ],
              meta: { ui: { icon: "heart" } },
            },
            {
              key: "citizenship_status",
              type: "select",
              label: "Citizenship Status",
              required: true,
              layout: { columnSpan: 6 },
              properties: { placeholder: "Identity verification" },
              options: [
                { label: "Citizen", value: "citizen" },
                { label: "Permanent Resident", value: "pr" },
                { label: "Work Visa", value: "visa" },
              ],
              meta: { ui: { icon: "globe" } },
            },
          ],
        },
      ],
    },
    {
      id: "spouse-details",
      title: "Spouse Information",
      description: "Additional details required for married employees.",
      layout: {
        type: "grid",
        columns: 12,
        gap: "lg",
        wrapOuter: false,
      },
      visible: {
        expression: "{{marital_status}} == 'married'",
        dependsOn: ["marital_status"],
        returnType: "boolean",
      },
      fields: [
        {
          id: "header_spouse",
          type: "header",
          label: "Spouse Details",
          description: "Required for joint benefits and legal records",
          properties: { alignment: "center" },
          meta: { ui: { variant: "h2" } },
        },
        {
          key: "spouse_name",
          type: "text",
          label: "Spouse Full Name",
          required: true,
          layout: { columnSpan: 12 },
          meta: { ui: { icon: "user-plus" } },
        },
      ],
    },
    {
      id: "visa-details",
      title: "Visa & Legal",
      description: "Documentation for work authorization.",
      layout: {
        type: "grid",
        columns: 12,
        gap: "lg",
        wrapOuter: false,
      },
      visible: {
        expression: "{{citizenship_status}} == 'visa'",
        dependsOn: ["citizenship_status"],
        returnType: "boolean",
      },
      fields: [
        {
          id: "header_visa",
          type: "header",
          label: "Visa Information",
          description: "Provide your current work authorization details",
          properties: { alignment: "center" },
          meta: { ui: { variant: "h2" } },
        },
        {
          key: "visa_number",
          type: "text",
          label: "Visa Number",
          required: true,
          layout: { columnSpan: 6 },
          meta: {
            ui: { icon: "file-text" },
            events: EmployeeOnboardingEvents.visa_number,
          },
        },
        {
          key: "visa_expiry",
          type: "date",
          label: "Expiry Date",
          required: true,
          layout: { columnSpan: 6 },
          meta: { ui: { icon: "calendar" } },
        },
      ],
    },
    {
      key: "verification",
      title: "Final Verification",
      description: "Verify your identity and provide salary expectations.",
      layout: {
        type: "grid",
        columns: 12,
        gap: "lg",
        wrapOuter: false,
        reviewOnly: true,
      },
      fields: [
        {
          id: "header",
          type: "header",
          label: "Final Step",
          description:
            "Please complete your salary profile and enter the OTP sent to your phone.",
          properties: { alignment: "center" },
          meta: { ui: { variant: "h2" } },
        },
        {
          key: "salary_expectation",
          type: "number",
          label: "Salary Expectation (USD)",
          required: true,
          layout: { columnSpan: 12 },
          properties: { placeholder: "e.g. 120000" },
          meta: { ui: { icon: "dollar-sign" } },
        },
        {
          key: "verification_code",
          type: "code",
          label: "Verification Code (OTP)",
          required: true,
          layout: { columnSpan: 12 },
          properties: { length: 6 },
        },
      ],
    },
  ],
};

export default function TestMultiStepFormModel() {
  const { t } = useTranslation("screens/staticPages");
  const fetcher = useFetcher();
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("wizard");

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

  return (
    <div className="app-page-container min-h-screen bg-architectural-grid relative flex items-center justify-center p-4 lg:p-8 overflow-y-auto">
      {!isOpen && (
        <Button
          className="relative z-10"
          variant="primary"
          size="lg"
          onPress={() => setIsOpen(true)}
        >
          {t("multiStep.launchBtn")}
        </Button>
      )}

      <Modal
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        size="lg"
        className="h-[85vh]"
      >
        <Modal.Header className="border-none pb-2">
          {t("multiStep.portalTitle")}
        </Modal.Header>

        {/* Sticky Tabs Sub-Header */}
        <div className="flex-shrink-0 flex gap-6 w-full relative px-6 border-b border-border/50 bg-background/50 backdrop-blur-md z-10">
          <button
            onClick={() => setActiveTab("wizard")}
            className={`px-2 h-12 font-medium transition-colors relative ${
              activeTab === "wizard"
                ? "text-primary border-b-2 border-primary"
                : "text-foreground/60 hover:text-foreground/80"
            }`}
          >
            {t("multiStep.tabs.wizard")}
          </button>
          <button
            onClick={() => setActiveTab("instructions")}
            className={`px-2 h-12 font-medium transition-colors relative ${
              activeTab === "instructions"
                ? "text-primary border-b-2 border-primary"
                : "text-foreground/60 hover:text-foreground/80"
            }`}
          >
            {t("multiStep.tabs.instructions")}
          </button>
        </div>

        <Modal.Body className="p-0 bg-surface">
          <div className="relative">
            {activeTab === "wizard" && (
              <div className="p-6 pb-12 animate-in fade-in zoom-in-95 duration-200">
                <Form
                  definition={onboardingSchema}
                  actions={formActions}
                  debug={false}
                  onSubmit={() => alert("Onboarding Complete!")}
                />
              </div>
            )}

            {activeTab === "instructions" && (
              <div className="p-8 animate-in fade-in zoom-in-95 duration-200">
                <div className="prose max-w-none bg-surface-raised p-8 rounded-2xl shadow-sm border border-border text-foreground">
                  <h3 className="text-xl font-semibold mb-4 text-foreground">
                    {t("multiStep.welcomeTitle")}
                  </h3>
                  <p className="mb-4 text-foreground/80 leading-relaxed">
                    {t("multiStep.welcomeText")}
                  </p>
                  <ul className="list-disc pl-5 space-y-3 text-foreground/70">
                    <li>{t("multiStep.instructionsList.legalNames")}</li>
                    <li>{t("multiStep.instructionsList.visaRequired")}</li>
                    <li>{t("multiStep.instructionsList.continuousValidation")}</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer
          align="between"
          actions={[
            {
              label: t("multiStep.footer.cancel"),
              variant: "ghost",
              onPress: () => setIsOpen(false),
            },
            {
              label: t("multiStep.footer.needHelp"),
              variant: "outline",
              onPress: () => alert("Need Help? Contact support@zenos.infra"),
            },
          ]}
        />
      </Modal>
    </div>
  );
}
