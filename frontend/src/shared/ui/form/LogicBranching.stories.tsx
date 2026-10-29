import type { Meta, StoryObj } from "@storybook/react-vite";

import { Form } from "./Form";
import type { FormDefinition } from "@form-core/domain";

const meta: Meta<typeof Form> = {
  title: "Form/Orchestration/Logic Branching",
  component: Form,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof Form>;

/**
 * Membership Enrollment: Non-Linear Branching Flow
 *
 * Logic:
 * 1. Step 1 asks for Account Type.
 * 2. If 'Individual' -> Go to 'Personal Profile'
 * 3. If 'Organization' -> Go to 'Company Info' -> then 'Legal Rep'
 * 4. Both paths converge at 'Confirmation'
 */
const branchingDefinition: FormDefinition = {
  id: "membership-enrollment",
  title: "Membership Enrollment",
  description: "Join the enterprise network",
  settings: {
    layoutMode: "portal",
    density: "spacious",
    wizard: {
      enabled: true,
      stepperType: "top",
      linear: true,
    },
  },
  style: {
    classNames: {
      atmosphere: "opacity-40",
    },
  },
  sections: [
    {
      id: "sec-type",
      title: "Account Type",
      description: "Define your membership profile",
      // ✅ nextStep signature: (values) => string | null (matches FormSection type)
      nextStep: (values) =>
        values.accountType === "org" ? "sec-org" : "sec-indiv",
      fields: [
        {
          id: "type-id",
          name: "accountType",
          type: "select",
          label: "I am registering as an...",
          initialValue: "indiv",
          properties: {
            borderRadius: "large",
          },
          meta: { ui: { icon: "users" } },
          // ✅ options at top-level field property, not inside properties{}
          options: [
            { label: "Individual Professional", value: "indiv" },
            { label: "Organization / Company", value: "org" },
          ],
          layout: { columnSpan: 12 },
        },
      ],
    },
    {
      id: "sec-indiv",
      title: "Personal Profile",
      description: "Tell us about yourself",
      nextStep: "sec-confirm",
      fields: [
        {
          id: "fn-id",
          name: "firstName",
          type: "text",
          label: "First Name",
          properties: {
            borderRadius: "large",
          },
          meta: { ui: { icon: "user" } },
          layout: { columnSpan: 6 },
        },
        {
          id: "ln-id",
          name: "lastName",
          type: "text",
          label: "Last Name",
          properties: {
            borderRadius: "large",
          },
          meta: { ui: { icon: "user" } },
          layout: { columnSpan: 6 },
        },
      ],
    },
    {
      id: "sec-org",
      title: "Company Info",
      description: "Business identity details",
      nextStep: "sec-rep",
      fields: [
        {
          id: "cn-id",
          name: "companyName",
          type: "text",
          label: "Company Name",
          properties: {
            borderRadius: "large",
          },
          meta: { ui: { icon: "building-2" } },
          layout: { columnSpan: 12 },
        },
        {
          id: "tin-id",
          name: "taxId",
          type: "text",
          label: "Tax Identification Number",
          properties: {
            borderRadius: "large",
          },
          meta: { ui: { icon: "hash" } },
          layout: { columnSpan: 12 },
        },
      ],
    },
    {
      id: "sec-rep",
      title: "Legal Representative",
      description: "Authorized signatory",
      nextStep: "sec-confirm",
      fields: [
        {
          id: "rep-id",
          name: "repName",
          type: "text",
          label: "Full Name",
          layout: { columnSpan: 12 },
        },
      ],
    },
    {
      id: "sec-confirm",
      title: "Confirmation",
      description: "Review and submit your application",
      fields: [
        {
          id: "terms-id",
          name: "agree",
          type: "checkbox",
          label: "I agree to the terms and conditions",
          meta: { ui: { icon: "shield-check" } },
          layout: { columnSpan: 12 },
        },
      ],
    },
  ],
  submitLabel: "Complete Enrollment",
};

export const MembershipProvider: Story = {
  args: {
    definition: branchingDefinition,
    onSubmit: async (data) => {
      console.log("Submitted Data:", data);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
  },
};
