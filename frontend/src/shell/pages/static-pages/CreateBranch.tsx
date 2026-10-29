import React from "react";
import { useTranslation } from "react-i18next";

import { Form } from "@ui/form/Form";
import { useDynamicForm } from "@ui/form/hooks/useDynamicForm";

import "./configs/branch-schema";

// Ensure the schema registers itself

/**
 * ── PAGE COMPONENT ──────────────────────────────────────────────────────────
 * A pure view layer. All complex schema fusion, hydration, and state
 * management has been extracted to the centralized SchemaRegistry and Dynamic Hook.
 */
export default function CreateBranch() {
  const { t } = useTranslation("screens/staticPages");
  const formRef = React.useRef<any>(null);

  // Notice how perfectly scalable this is! We no longer need bespoke controllers.
  const {
    schema,
    isLoading,
    handleFieldChange,
    submitAction,
  } = useDynamicForm("create-branch", { sync: true });

  if (isLoading || !schema) {
    return (
      <div className="p-8 text-center text-muted">{t("createBranch.loading")}</div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col p-4 sm:p-10 bg-architectural-grid overflow-y-auto relative">
      {/* Background Glow Accent */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      <div className="m-auto w-full max-w-4xl relative z-10">
        {/* Page Hero Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 mb-3 shadow-inner">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              {t("createBranch.badge")}
            </div>
            <h1 className="text-3xl font-black text-foreground tracking-tight">
              {t("createBranch.title")}
            </h1>
            <p className="text-sm font-medium text-foreground/60 mt-1">
              {t("createBranch.subtitle")}
            </p>
          </div>
        </div>

        {/* Form Engine Render */}
        <Form
          ref={formRef}
          definition={schema}
          onChange={handleFieldChange}
          onSubmit={submitAction}
          className="animate-in fade-in zoom-in-95 duration-500"
        />
      </div>
    </div>
  );
}
