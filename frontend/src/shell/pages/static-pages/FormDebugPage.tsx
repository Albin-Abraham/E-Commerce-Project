import React from "react";
import { useTranslation } from "react-i18next";

import { FormComposer } from "@ui/form/FormComposer";
import { useForm } from "@ui/form/hooks/useForm";
import { FormDevTools } from "@ui/form/tools/FormDevTools";
import type { FormDefinition } from "@ui/form/types";
import { getFormLayoutTree } from "@ui/form/utils/form-layout-utils";

// Comprehensive Debug Schema
const debugSchema: FormDefinition = {
  id: "debug-form",
  title: { en: "Form System Debugger", fr: "Débogueur de Système" },
  sections: [
    {
      id: "basic-controls",
      title: "Basic Controls",
      layout: { type: "grid", columns: 2 },
      fields: [
        {
          id: "txt-input",
          name: "username",
          type: "text",
          label: "Text Input",
          required: true,
          description: "Must be unique",
          validation: {
            rules: [{ type: "min", value: 3, message: "Too short" }],
          },
        },
        {
          id: "num-input",
          name: "age",
          type: "number",
          label: "Number Input",
          validation: {
            rules: [
              { type: "min", value: 18 },
              { type: "max", value: 99 },
            ],
          },
        },
        {
          id: "email-input",
          name: "email",
          type: "email",
          label: "Email Address",
          validation: { rules: [{ type: "email" }] },
        },
        {
          id: "select-input",
          name: "role",
          type: "select",
          label: "User Role",
          options: [
            { value: "admin", label: "Administrator" },
            { value: "user", label: "Standard User" },
            { value: "guest", label: "Guest" },
          ],
        },
      ],
    },
    {
      id: "layout-tests",
      title: "Layout & Formatting",
      layout: { type: "tabs" },
      fields: [],
      subSections: [
        {
          id: "tab-1",
          title: "Switches & Checks",
          fields: [
            {
              id: "chk-1",
              name: "terms",
              type: "checkbox",
              label: "Accept Terms",
              required: true,
            },
            {
              id: "sw-1",
              name: "notifications",
              type: "switch",
              label: "Enable Notifications",
            },
          ],
        },
        {
          id: "tab-2",
          title: "Dependents",
          fields: [
            {
              id: "dep-text",
              name: "reason",
              type: "textarea",
              label: "Reason for joining",
              description: "Tell us why!",
            },
          ],
        },
      ],
    },
  ],
};

export default function FormDebugPage() {
  const { t } = useTranslation("screens/staticPages");
  const { form, getComponentProps, visibility, submit } =
    useForm(debugSchema);
  const tree = getFormLayoutTree(debugSchema);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submit();
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8 border-b pb-6 dark:border-slate-800">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            🛠️ {t("debug.title")}
          </h1>
          <p className="text-slate-500 mt-2">
            {t("debug.description")}
          </p>
        </header>

        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border dark:border-slate-800 p-6">
          <form onSubmit={handleSubmit} noValidate>
            <FormComposer
              fields={tree}
              getComponentProps={getComponentProps}
              visibility={visibility}
            />

            <div className="mt-8 pt-6 border-t dark:border-slate-800 flex justify-end gap-3">
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-900"
              >
                {t("debug.submit")}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* The Star of the Show */}
      <FormDevTools form={form.engine} />
    </div>
  );
}
