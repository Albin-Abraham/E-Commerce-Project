import React, { useRef, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { Form, type FormHandle } from "../Form";
import type { FormDefinition } from "@form-core/domain";

const validationDefinition: FormDefinition = {
  id: "canonical-validation-demo",
  title: "Validation Rules Matrix",
  description: "Declarative validation rules evaluated with accessible DOM error mapping.",
  submitLabel: "Validate & Submit",
  settings: {
    showValidationOnTouch: true,
  },
  sections: [
    {
      id: "validation_sec",
      title: "Input Validation Constraints",
      fields: [
        {
          id: "username",
          name: "username",
          type: "text",
          label: "Username",
          required: true,
          placeholder: "lowercase alphanumeric",
          validation: {
            rules: [
              {
                type: "minLength",
                value: 4,
                message: "Username must be at least 4 characters long.",
              },
              {
                type: "pattern",
                value: "^[a-z0-9_]+$",
                message: "Username can only contain lowercase letters, numbers, and underscores.",
              },
            ],
          },
        },
        {
          id: "email",
          name: "email",
          type: "email",
          label: "Business Email",
          required: true,
          placeholder: "alex@company.com",
          validation: {
            rules: [
              {
                type: "email",
                message: "Please enter a valid RFC-compliant email address.",
              },
            ],
          },
        },
        {
          id: "age",
          name: "age",
          type: "number",
          label: "Applicant Age",
          required: true,
          validation: {
            rules: [
              {
                type: "min",
                value: 18,
                message: "Applicant must be at least 18 years of age.",
              },
              {
                type: "max",
                value: 120,
                message: "Please enter a valid age under 120.",
              },
            ],
          },
        },
      ],
    },
  ],
};

const CanonicalValidationDemo: React.FC = () => {
  const formRef = useRef<FormHandle>(null);
  const [submissionFeedback, setSubmissionFeedback] = useState<string | null>(null);

  const handleSimulateServerError = () => {
    if (formRef.current) {
      formRef.current.setErrors({
        username: [{ code: "taken", message: "Username 'admin' is already reserved by the system." }],
        email: [{ code: "domain_blacklisted", message: "Free webmail domains are not accepted for enterprise accounts." }],
      });
      setSubmissionFeedback("Simulated API 422: Injected server-side errors into form fields.");
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto w-full space-y-6">
      <div className="border-b border-border/60 pb-4">
        <span className="text-xs font-black uppercase tracking-wider text-primary">
          Validation Engine
        </span>
        <h1 className="text-2xl font-black tracking-tight mt-1">
          Declarative Validation Matrix
        </h1>
        <p className="text-sm text-foreground/60 mt-1">
          Demonstrates client-side constraint evaluation on touch/blur, accessible <code>aria-invalid</code> states, and programmatic server error injection.
        </p>
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={handleSimulateServerError}
          className="px-4 py-2 text-xs font-bold rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 transition-all"
        >
          Inject Server 422 Errors
        </button>
      </div>

      <Form
        ref={formRef}
        definition={validationDefinition}
        onSubmit={(values) => {
          setSubmissionFeedback(`Validation Succeeded! Payload: ${JSON.stringify(values)}`);
        }}
      />

      {submissionFeedback && (
        <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 text-xs font-mono text-primary">
          {submissionFeedback}
        </div>
      )}
    </div>
  );
};

const meta: Meta<typeof CanonicalValidationDemo> = {
  title: "Form/Canonical/Declarative Validation Matrix",
  component: CanonicalValidationDemo,
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof CanonicalValidationDemo>;

export const Default: Story = {};
