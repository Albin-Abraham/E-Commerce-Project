import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { Form } from "../../Form";
import type { FormDefinition } from "../../types";

const fieldsetDemoForm: FormDefinition = {
  id: "fieldset-demo",
  title: "Delivery & Shipping Logistics",
  description: "Demonstrates native HTML5 fieldset and legend semantic grouping.",
  sections: [
    {
      id: "shipping-section",
      title: "Logistics",
      fields: [
        {
          id: "shipping-address-fieldset",
          name: "shippingAddress",
          type: "fieldset",
          label: "Physical Shipping Address",
          description: "Carrier parcels require standard street, city, and zip addresses.",
          fields: [
            {
              id: "street-address",
              name: "street",
              type: "text",
              label: "Street Address",
              initialValue: "742 Evergreen Terrace",
              layout: { columnSpan: 12 },
            },
            {
              id: "city-address",
              name: "city",
              type: "text",
              label: "City",
              initialValue: "Springfield",
              layout: { columnSpan: 6 },
            },
            {
              id: "postal-code",
              name: "postalCode",
              type: "text",
              label: "Postal Code",
              initialValue: "97477",
              layout: { columnSpan: 6 },
            },
          ],
        },
      ],
    },
  ],
};

const meta: Meta<typeof Form> = {
  title: "Form/Structure/FieldsetField",
  component: Form,
  tags: ["autodocs"],
  args: {
    definition: fieldsetDemoForm,
  },
};

export default meta;
type Story = StoryObj<typeof Form>;

export const Default: Story = {};
