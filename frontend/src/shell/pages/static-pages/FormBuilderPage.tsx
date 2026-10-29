import { useState } from "react";
import { useTranslation } from "react-i18next";

import { FormBuilder } from "@ui/form/builder";
import { MetadataSchemaForm } from "@ui/form/shell/MetadataSchemaForm";

const FormBuilderPage = () => {
  const { t } = useTranslation("screens/staticPages");
  const [activeTab, setActiveTab] = useState<"schema" | "canvas">("schema");

  return (
    <div className="min-h-[calc(100vh-64px)] w-full bg-slate-950 p-6 flex flex-col gap-6">
      <div className="max-w-4xl mx-auto w-full flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            {t("formBuilder.title")}
          </h1>
          <p className="text-xs text-white/50 font-medium">
            {t("formBuilder.subtitle")}
          </p>
        </div>
        <div className="flex gap-2 bg-white/5 border border-white/10 p-1.5 rounded-2xl">
          <button
            onClick={() => setActiveTab("schema")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "schema"
                ? "bg-primary text-white shadow-glow"
                : "text-white/60 hover:text-white hover:bg-white/5"
            }`}
          >
            {t("formBuilder.tabs.schema")}
          </button>
          <button
            onClick={() => setActiveTab("canvas")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "canvas"
                ? "bg-primary text-white shadow-glow"
                : "text-white/60 hover:text-white hover:bg-white/5"
            }`}
          >
            {t("formBuilder.tabs.canvas")}
          </button>
        </div>
      </div>

      <div className="flex-1 w-full relative">
        {activeTab === "schema" ? (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <MetadataSchemaForm />
          </div>
        ) : (
          <div className="h-[calc(100vh-180px)] w-full bg-slate-900 border border-white/10 rounded-[32px] overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
            <FormBuilder />
          </div>
        )}
      </div>
    </div>
  );
};

export default FormBuilderPage;
