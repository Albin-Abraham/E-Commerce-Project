import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { within } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";

import { Form } from "../../Form";
import type { FormDefinition } from "../../types";

const repeaterDemoForm: FormDefinition = {
  id: "repeater-demo",
  title: "Project Allocation & Staffing",
  description: "Dynamic virtualized array managing team assignments and billing.",
  sections: [
    {
      id: "staffing-section",
      title: "Team Staffing",
      fields: [
        {
          id: "team-members",
          name: "members",
          type: "repeater",
          label: "Team Members",
          description: "Add multiple engineering resources to this deployment plan.",
          initialValue: [
            { memberName: "Alex Mercer", role: "Staff Architect", hours: 40 },
            { memberName: "Elena Rostova", role: "Senior Backend Engineer", hours: 35 },
            { memberName: "Devin Vance", role: "Security Auditor", hours: 20 },
          ],
          fields: [
            {
              id: "member-name",
              name: "memberName",
              type: "text",
              label: "Member Name",
              layout: { columnSpan: 5 },
            },
            {
              id: "member-role",
              name: "role",
              type: "text",
              label: "Project Role",
              layout: { columnSpan: 4 },
            },
            {
              id: "member-hours",
              name: "hours",
              type: "number",
              label: "Weekly Hours",
              layout: { columnSpan: 3 },
            },
          ],
        },
      ],
    },
  ],
};

const meta: Meta<typeof Form> = {
  title: "Form/Structure/RepeaterField",
  component: Form,
  tags: ["autodocs"],
  args: {
    definition: repeaterDemoForm,
  },
};

export default meta;
type Story = StoryObj<typeof Form>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const user = userEvent.setup();
    const canvas = within(canvasElement);

    // Find and click the Add Row button
    const addButton = canvas.getByRole("button", { name: /Add Item|Add/i });
    if (addButton) {
      await user.click(addButton);
    }
  },
};

export const LargeDatasetVirtualized: Story = {
  args: {
    definition: {
      ...repeaterDemoForm,
      sections: [
        {
          id: "staffing-section",
          title: "High-Volume Data List (50+ Rows)",
          fields: [
            {
              ...repeaterDemoForm.sections[0].fields[0],
              initialValue: Array.from({ length: 50 }, (_, i) => ({
                memberName: `Engineer #${i + 1}`,
                role: i % 2 === 0 ? "Backend Core" : "Frontend Systems",
                hours: 40,
              })),
            },
          ],
        },
      ],
    },
  },
};
