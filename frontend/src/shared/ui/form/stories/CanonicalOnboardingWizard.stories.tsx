import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { Form } from "../Form";
import { COMPREHENSIVE_FORM_FIXTURE } from "@/shared/testing/fixtures/ComprehensiveFormFixture";
import type { SubmissionPayload } from "@form-core/domain";

const CanonicalWizardDemo: React.FC = () => {
  const [submittedData, setSubmittedData] = useState<Record<string, any> | null>(null);

  const handleSubmit = (data: SubmissionPayload) => {
    setSubmittedData(data);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto w-full space-y-6">
      <div className="border-b border-border/60 pb-4">
        <span className="text-xs font-black uppercase tracking-wider text-primary">
          Canonical Form Contract Showcase
        </span>
        <h1 className="text-2xl font-black tracking-tight mt-1">
          Enterprise Onboarding Multi-Step Wizard
        </h1>
        <p className="text-sm text-foreground/60 mt-1">
          Demonstrates canonical schema-driven wizard with sequential flow, validation gating per step, and reactive condition engine.
        </p>
      </div>

      <Form
        definition={COMPREHENSIVE_FORM_FIXTURE}
        initialData={{ accountType: "individual" }}
        onSubmit={handleSubmit}
      />

      {submittedData && (
        <div className="p-6 rounded-2xl border border-primary/30 bg-primary/5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-primary uppercase tracking-wide">
              Canonical Submission Payload Received
            </h3>
            <button
              type="button"
              onClick={() => setSubmittedData(null)}
              className="text-xs text-foreground/60 hover:text-foreground underline"
            >
              Clear
            </button>
          </div>
          <pre className="text-xs bg-surface/80 p-4 rounded-xl border border-border/60 overflow-x-auto text-foreground font-mono">
            {JSON.stringify(submittedData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

const meta: Meta<typeof CanonicalWizardDemo> = {
  title: "Form/Canonical/Onboarding Wizard",
  component: CanonicalWizardDemo,
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof CanonicalWizardDemo>;

export const Default: Story = {};
