import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { Form } from "../Form";
import type { FormDefinition } from "@form-core/domain";

const conditionsDefinition: FormDefinition = {
  id: "canonical-conditions-demo",
  title: "Dynamic Condition Engine Demo",
  description: "Declarative condition rules evaluated reactively against form values.",
  sections: [
    {
      id: "conditions_sec",
      title: "Interactive Trigger Configuration",
      fields: [
        {
          id: "accountType",
          name: "accountType",
          type: "radio",
          label: "Account Classification",
          required: true,
          options: [
            { value: "personal", label: "Individual / Personal" },
            { value: "business", label: "Corporate Entity" },
            { value: "non_profit", label: "Non-Profit Organization" },
          ],
        },
        {
          id: "companyName",
          name: "companyName",
          type: "text",
          label: "Registered Business Name",
          required: true,
          placeholder: "e.g. Global Tech Enterprises Inc.",
          conditions: {
            groups: [
              {
                action: "show",
                rules: [
                  {
                    field: "accountType",
                    operator: "equals",
                    value: "business",
                  },
                ],
              },
            ],
          },
        },
        {
          id: "taxId",
          name: "taxId",
          type: "text",
          label: "Tax ID (EIN / VAT Number)",
          required: true,
          placeholder: "e.g. 12-3456789",
          conditions: {
            groups: [
              {
                action: "show",
                rules: [
                  {
                    field: "accountType",
                    operator: "equals",
                    value: "business",
                  },
                ],
              },
            ],
          },
        },
        {
          id: "exemptionNumber",
          name: "exemptionNumber",
          type: "text",
          label: "501(c)(3) Tax Exemption Number",
          required: true,
          placeholder: "e.g. EX-90210",
          conditions: {
            groups: [
              {
                action: "show",
                rules: [
                  {
                    field: "accountType",
                    operator: "equals",
                    value: "non_profit",
                  },
                ],
              },
            ],
          },
        },
        {
          id: "hasCustomDomain",
          name: "hasCustomDomain",
          type: "switch",
          label: "Configure Custom Corporate Subdomain",
          properties: {
            description: "Enables dedicated tenant routing for your workspace.",
          },
        },
        {
          id: "subdomain",
          name: "subdomain",
          type: "text",
          label: "Requested Subdomain Prefix",
          placeholder: "acme",
          meta: { ui: { icon: "globe" } },
          conditions: {
            groups: [
              {
                action: "show",
                rules: [
                  {
                    field: "hasCustomDomain",
                    operator: "equals",
                    value: true,
                  },
                ],
              },
            ],
          },
        },
      ],
    },
  ],
};

const CanonicalConditionsDemo: React.FC = () => {
  const [formData, setFormData] = useState<Record<string, any>>({});

  return (
    <div className="p-8 max-w-3xl mx-auto w-full space-y-6">
      <div className="border-b border-border/60 pb-4">
        <span className="text-xs font-black uppercase tracking-wider text-primary">
          Declarative Engine
        </span>
        <h1 className="text-2xl font-black tracking-tight mt-1">
          Canonical Dynamic Conditions
        </h1>
        <p className="text-sm text-foreground/60 mt-1">
          Fields dynamically mount and unmount based on <code>field.conditions</code> rules evaluated by FormCore.
        </p>
      </div>

      <Form
        definition={conditionsDefinition}
        initialData={{ accountType: "personal", hasCustomDomain: false }}
        onChange={(values) => setFormData(values)}
        onSubmit={(values) => alert(`Submitted: ${JSON.stringify(values, null, 2)}`)}
      />

      <div className="p-4 rounded-xl border border-border/60 bg-muted/30">
        <span className="text-xs font-bold text-foreground/60 uppercase tracking-wider">
          Active Values State (Reactively Updated):
        </span>
        <pre className="text-xs font-mono mt-2 text-foreground">
          {JSON.stringify(formData, null, 2)}
        </pre>
      </div>
    </div>
  );
};

const meta: Meta<typeof CanonicalConditionsDemo> = {
  title: "Form/Canonical/Conditional Visibility Engine",
  component: CanonicalConditionsDemo,
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof CanonicalConditionsDemo>;

export const Default: Story = {};
