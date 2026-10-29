import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { Form } from "../../Form";
import type { FormDefinition } from "../../types";

const groupDemoForm: FormDefinition = {
  id: "group-demo",
  title: "Grouped Fields Example",
  description: "Demonstrates semantic inline grouping of fields sharing a single label context.",
  sections: [
    {
      id: "personal-details",
      title: "Personal Information",
      fields: [
        {
          id: "full-name-group",
          name: "fullNameGroup",
          type: "group",
          label: "Full Legal Name",
          description: "Both first and last name are required on passport documents.",
          required: true,
          fields: [
            {
              id: "first-name",
              name: "firstName",
              type: "text",
              label: "First Name",
              layout: { placeholder: { en: "First Name" }, columnSpan: 6 },
            },
            {
              id: "last-name",
              name: "lastName",
              type: "text",
              label: "Last Name",
              layout: { placeholder: { en: "Last Name" }, columnSpan: 6 },
            },
          ],
        },
      ],
    },
  ],
};

const meta: Meta<typeof Form> = {
  title: "Form/Structure/GroupField",
  component: Form,
  tags: ["autodocs"],
  args: {
    definition: groupDemoForm,
  },
};

export default meta;
type Story = StoryObj<typeof Form>;

export const Default: Story = {};
