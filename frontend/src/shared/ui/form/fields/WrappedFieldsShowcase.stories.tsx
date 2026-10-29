import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { FormThemeProvider } from "../context/FormThemeContext";
import { FormOrchestratorProvider } from "../context/FormOrchestratorContext";
import { manifestRegistry } from "@form-core/ManifestRegistry";
import { defaultRegistry } from "./lazy-registry-builder";
import {
  FormTextField,
  FormTextareaField,
  FormSelectField,
  FormMultiSelectField,
  FormAutocompleteField,
  FormNumberInputField,
  FormRadioField,
  FormCheckboxField,
  FormSwitchField,
  FormRangeField,
  FormPhoneField,
  FormCodeInputField,
  FormFileField,
  FormSearchInputField,
  FormButtonField,
} from "./wrapped-fields";

const WrappedFieldsGalleryComponent: React.FC<{
  initialDensity?: "compact" | "comfortable" | "spacious";
  showErrors?: boolean;
  disabled?: boolean;
}> = ({
  initialDensity = "comfortable",
  showErrors = false,
  disabled = false,
}) => {
  const [density, setDensity] = useState(initialDensity);
  const [isError, setIsError] = useState(showErrors);
  const [isDisabled, setIsDisabled] = useState(disabled);

  return (
    <FormThemeProvider>
      <FormOrchestratorProvider
        value={{
          mode: "edit",
          density,
          registry: {
            registry: defaultRegistry,
            form: null as any,
            debug: false,
          },
          manifest: { manifestRegistry },
        }}
      >
        <div
          className="p-8 max-w-5xl mx-auto w-full transition-all bg-background text-foreground space-y-8"
          data-density={density}
        >
          {/* Header & Controls Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-border/60 gap-4">
            <div>
              <h1 className="text-2xl font-black tracking-tight">
                Design System: 15 Official Wrapped Fields
              </h1>
              <p className="text-sm text-foreground/60 mt-1">
                Pre-composed with the <code>withAtom</code> HOC (Wrapper Trinity: OuterWrapper + InputWrapper + Density Box)
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Density Segmented Control */}
              <div className="flex bg-muted p-1 rounded-xl border border-border/40 text-xs font-semibold">
                {(["compact", "comfortable", "spacious"] as const).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDensity(d)}
                    className={`px-3 py-1.5 rounded-lg capitalize transition-all ${
                      density === d
                        ? "bg-primary text-primary-foreground font-bold shadow-sm"
                        : "text-foreground/60 hover:text-foreground"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>

              {/* Error Toggle */}
              <button
                type="button"
                onClick={() => setIsError(!isError)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                  isError
                    ? "bg-red-500/10 text-red-500 border-red-500/30"
                    : "bg-surface text-foreground/60 border-border hover:text-foreground"
                }`}
              >
                {isError ? "Errors: Active" : "Errors: Off"}
              </button>

              {/* Disabled Toggle */}
              <button
                type="button"
                onClick={() => setIsDisabled(!isDisabled)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                  isDisabled
                    ? "bg-amber-500/10 text-amber-500 border-amber-500/30"
                    : "bg-surface text-foreground/60 border-border hover:text-foreground"
                }`}
              >
                {isDisabled ? "Disabled: On" : "Disabled: Off"}
              </button>
            </div>
          </div>

          {/* 15 Wrapped Fields Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 1. FormTextField */}
            <div className="p-5 rounded-2xl border border-border/40 bg-surface/40 backdrop-blur-sm space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-primary">1. Text Input</span>
              <FormTextField
                field={{
                  id: "wf_text",
                  name: "wfText",
                  type: "text",
                  label: "Corporate Legal Entity",
                  required: true,
                  meta: { ui: { icon: "building" } },
                }}
                layout={{ placeholder: "e.g. Acme Corporation", disabled: isDisabled }}
                value="Acme Corporation Ltd."
                error={isError}
                errorMessage={isError ? "Entity name is required and must match legal filings." : undefined}
              />
            </div>

            {/* 2. FormTextareaField */}
            <div className="p-5 rounded-2xl border border-border/40 bg-surface/40 backdrop-blur-sm space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-primary">2. Textarea</span>
              <FormTextareaField
                field={{
                  id: "wf_textarea",
                  name: "wfTextarea",
                  type: "textarea",
                  label: "Business Activity Summary",
                  required: true,
                }}
                layout={{ placeholder: "Summarize corporate activities...", rows: 3, disabled: isDisabled }}
                value="Multi-tenant cloud infrastructure solutions."
                error={isError}
                errorMessage={isError ? "Summary must exceed 20 characters." : undefined}
              />
            </div>

            {/* 3. FormSelectField */}
            <div className="p-5 rounded-2xl border border-border/40 bg-surface/40 backdrop-blur-sm space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-primary">3. Single Select</span>
              <FormSelectField
                field={{
                  id: "wf_select",
                  name: "wfSelect",
                  type: "select",
                  label: "Industry Sector",
                  required: true,
                  options: [
                    { value: "tech", label: "Technology & Software" },
                    { value: "fintech", label: "FinTech & Banking" },
                    { value: "health", label: "Healthcare & Biotech" },
                  ],
                }}
                layout={{ placeholder: "Select an industry...", disabled: isDisabled }}
                value="tech"
                error={isError}
                errorMessage={isError ? "Please select a valid sector." : undefined}
              />
            </div>

            {/* 4. FormMultiSelectField */}
            <div className="p-5 rounded-2xl border border-border/40 bg-surface/40 backdrop-blur-sm space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-primary">4. Multi-Select</span>
              <FormMultiSelectField
                field={{
                  id: "wf_multiselect",
                  name: "wfMultiSelect",
                  type: "multiselect",
                  label: "Compliance Frameworks",
                  options: [
                    { value: "soc2", label: "SOC 2 Type II" },
                    { value: "iso27001", label: "ISO 27001" },
                    { value: "hipaa", label: "HIPAA Compliant" },
                    { value: "gdpr", label: "GDPR Certified" },
                  ],
                }}
                value={["soc2", "gdpr"]}
                disabled={isDisabled}
                error={isError}
                errorMessage={isError ? "At least two compliance frameworks must be selected." : undefined}
              />
            </div>

            {/* 5. FormAutocompleteField */}
            <div className="p-5 rounded-2xl border border-border/40 bg-surface/40 backdrop-blur-sm space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-primary">5. Autocomplete Combobox</span>
              <FormAutocompleteField
                field={{
                  id: "wf_autocomplete",
                  name: "wfAutocomplete",
                  type: "autocomplete",
                  label: "Primary Jurisdiction",
                  options: [
                    { value: "us", label: "United States" },
                    { value: "de", label: "Germany" },
                    { value: "in", label: "India" },
                    { value: "sg", label: "Singapore" },
                  ],
                }}
                layout={{ placeholder: "Search jurisdiction...", disabled: isDisabled }}
                value="de"
                error={isError}
                errorMessage={isError ? "Country code invalid." : undefined}
              />
            </div>

            {/* 6. FormNumberInputField */}
            <div className="p-5 rounded-2xl border border-border/40 bg-surface/40 backdrop-blur-sm space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-primary">6. Number Stepper</span>
              <FormNumberInputField
                field={{
                  id: "wf_number",
                  name: "wfNumber",
                  type: "number",
                  label: "Maximum User Seats",
                  required: true,
                  properties: { min: 1, max: 1000, step: 5 },
                }}
                layout={{ min: 1, max: 1000, step: 5, disabled: isDisabled }}
                value={25}
                error={isError}
                errorMessage={isError ? "Seat count exceeds plan allocation." : undefined}
              />
            </div>

            {/* 7. FormRadioField */}
            <div className="p-5 rounded-2xl border border-border/40 bg-surface/40 backdrop-blur-sm space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-primary">7. Radio Group</span>
              <FormRadioField
                field={{
                  id: "wf_radio",
                  name: "wfRadio",
                  type: "radio",
                  label: "Support SLA Tier",
                  required: true,
                  options: [
                    { value: "standard", label: "Standard 24h Response" },
                    { value: "priority", label: "Priority 4h Response" },
                    { value: "mission_critical", label: "Mission Critical 15m Response" },
                  ],
                }}
                disabled={isDisabled}
                value="priority"
                error={isError}
                errorMessage={isError ? "Please select a required SLA." : undefined}
              />
            </div>

            {/* 8. FormCheckboxField */}
            <div className="p-5 rounded-2xl border border-border/40 bg-surface/40 backdrop-blur-sm space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-primary">8. Checkbox</span>
              <FormCheckboxField
                field={{
                  id: "wf_checkbox",
                  name: "wfCheckbox",
                  type: "checkbox",
                  label: "Enforce Multi-Factor Authentication (MFA) across all members",
                  required: true,
                }}
                disabled={isDisabled}
                value={true}
                error={isError}
                errorMessage={isError ? "MFA enforcement is required for enterprise security." : undefined}
              />
            </div>

            {/* 9. FormSwitchField */}
            <div className="p-5 rounded-2xl border border-border/40 bg-surface/40 backdrop-blur-sm space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-primary">9. Switch Toggle</span>
              <FormSwitchField
                field={{
                  id: "wf_switch",
                  name: "wfSwitch",
                  type: "switch",
                  label: "Automated Nightly Database Snapshots",
                  properties: { description: "Replicates encrypted snapshots to disaster recovery region." },
                }}
                disabled={isDisabled}
                value={true}
                error={isError}
                errorMessage={isError ? "Backup policy violation detected." : undefined}
              />
            </div>

            {/* 10. FormRangeField */}
            <div className="p-5 rounded-2xl border border-border/40 bg-surface/40 backdrop-blur-sm space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-primary">10. Range Slider</span>
              <FormRangeField
                field={{
                  id: "wf_range",
                  name: "wfRange",
                  type: "range",
                  label: "CPU Utilization Alert Threshold (%)",
                  properties: { min: 50, max: 95, step: 5 },
                }}
                layout={{ min: 50, max: 95, step: 5, disabled: isDisabled }}
                value={80}
              />
            </div>

            {/* 11. FormPhoneField */}
            <div className="p-5 rounded-2xl border border-border/40 bg-surface/40 backdrop-blur-sm space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-primary">11. Phone Input</span>
              <FormPhoneField
                field={{
                  id: "wf_phone",
                  name: "wfPhone",
                  type: "phone",
                  label: "Incident Commander Hotline",
                  required: true,
                  meta: { ui: { icon: "phone" } },
                }}
                layout={{ disabled: isDisabled }}
                value="+1 650 555 0182"
                error={isError}
                errorMessage={isError ? "Valid phone number required." : undefined}
              />
            </div>

            {/* 12. FormCodeInputField */}
            <div className="p-5 rounded-2xl border border-border/40 bg-surface/40 backdrop-blur-sm space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-primary">12. Verification Code Input</span>
              <FormCodeInputField
                field={{
                  id: "wf_code",
                  name: "wfCode",
                  type: "code-input",
                  label: "Hardware Token PIN",
                  required: true,
                  properties: { length: 6 },
                }}
                layout={{ disabled: isDisabled }}
                value="940218"
                error={isError}
                errorMessage={isError ? "Code must be exactly 6 digits." : undefined}
              />
            </div>

            {/* 13. FormFileField */}
            <div className="p-5 rounded-2xl border border-border/40 bg-surface/40 backdrop-blur-sm space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-primary">13. File Upload</span>
              <FormFileField
                field={{
                  id: "wf_file",
                  name: "wfFile",
                  type: "file",
                  label: "X.509 TLS Certificate Bundle",
                  properties: { accept: ".crt,.pem" },
                }}
                layout={{ disabled: isDisabled }}
                error={isError}
                errorMessage={isError ? "Certificate file is corrupted or untrusted." : undefined}
              />
            </div>

            {/* 14. FormSearchInputField */}
            <div className="p-5 rounded-2xl border border-border/40 bg-surface/40 backdrop-blur-sm space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-primary">14. Search Input</span>
              <FormSearchInputField
                field={{
                  id: "wf_search",
                  name: "wfSearch",
                  type: "search",
                  label: "Global Resource Filter",
                }}
                layout={{ placeholder: "Search clusters, nodes, services...", disabled: isDisabled }}
                value="prod-cluster-01"
              />
            </div>

            {/* 15. FormButtonField */}
            <div className="p-5 rounded-2xl border border-border/40 bg-surface/40 backdrop-blur-sm space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-primary">15. Action Button</span>
              <div className="flex gap-3 pt-3">
                <FormButtonField
                  field={{
                    id: "wf_btn_primary",
                    name: "wfBtnPrimary",
                    type: "button",
                    label: "Deploy Pipeline",
                    properties: { color: "primary", variant: "solid" },
                  }}
                  layout={{ disabled: isDisabled }}
                  value="Deploy Pipeline"
                />
                <FormButtonField
                  field={{
                    id: "wf_btn_secondary",
                    name: "wfBtnSecondary",
                    type: "button",
                    label: "Rollback",
                    properties: { color: "danger", variant: "bordered" },
                  }}
                  layout={{ disabled: isDisabled }}
                  value="Rollback"
                />
              </div>
            </div>
          </div>
        </div>
      </FormOrchestratorProvider>
    </FormThemeProvider>
  );
};

const meta: Meta<typeof WrappedFieldsGalleryComponent> = {
  title: "Form/Wrapped Fields/Overview Showcase",
  component: WrappedFieldsGalleryComponent,
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof WrappedFieldsGalleryComponent>;

export const Default: Story = {
  args: {
    initialDensity: "comfortable",
    showErrors: false,
    disabled: false,
  },
};

export const CompactDensity: Story = {
  args: {
    initialDensity: "compact",
    showErrors: false,
    disabled: false,
  },
};

export const SpaciousDensity: Story = {
  args: {
    initialDensity: "spacious",
    showErrors: false,
    disabled: false,
  },
};

export const ValidationErrorsState: Story = {
  args: {
    initialDensity: "comfortable",
    showErrors: true,
    disabled: false,
  },
};

export const DisabledState: Story = {
  args: {
    initialDensity: "comfortable",
    showErrors: false,
    disabled: true,
  },
};

export const DynamicComponentMappingShowcase: Story = {
  render: () => {
    return (
      <FormThemeProvider>
        <FormOrchestratorProvider
          value={{
            mode: "edit",
            density: "comfortable",
            registry: {
              registry: defaultRegistry,
              form: null as any,
              debug: false,
            },
            manifest: { manifestRegistry },
          }}
        >
          <div className="p-8 max-w-4xl mx-auto space-y-8 bg-background text-foreground">
            <div>
              <h2 className="text-xl font-bold">Canonical Form Definition Trinity & Component Mapping</h2>
              <p className="text-sm text-foreground/60 mt-1">
                Demonstrating semantic decoupling: <code>name</code> (data binding), <code>type</code> (data contract), and <code>component</code> (visual widget).
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-2xl border border-border/60 bg-surface/30">
              {/* Field 1: string data mapped to standard single-line text input */}
              <FormTextField
                name="userHandle"
                type="text"
                component="TextField"
                id="userHandle"
                label="User Handle (type: text, component: TextField)"
                placeholder="@username"
                value="@dev_zenith"
              />

              {/* Field 2: string data mapped to multiline textarea */}
              <FormTextareaField
                name="developerBio"
                type="textarea"
                component="TextareaField"
                id="developerBio"
                label="Developer Bio (type: textarea, component: TextareaField)"
                placeholder="Brief summary..."
                value="Lead Form Architect working on clean DDD-lite form systems."
              />

              {/* Field 3: number data with stepper component */}
              <FormNumberInputField
                name="retriesCount"
                type="number"
                component="NumberInputField"
                id="retriesCount"
                label="Max Retries (type: number, component: NumberInputField)"
                min={1}
                max={10}
                value={3}
              />

              {/* Field 4: boolean data mapped to switch component */}
              <FormSwitchField
                name="autoScaling"
                type="switch"
                component="SwitchField"
                id="autoScaling"
                label="Automatic Autoscaling"
                description="Scale compute capacity dynamically"
                value={true}
              />
            </div>
          </div>
        </FormOrchestratorProvider>
      </FormThemeProvider>
    );
  },
};

