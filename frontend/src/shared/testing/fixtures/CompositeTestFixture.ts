import type { FormDefinition } from "@ui/form/types";

export const COMPOSITE_TEST_FORM: FormDefinition = {
  id: "composite-test-form",
  title: "Composite Test Form",
  sections: [
    {
      id: "billing_section",
      title: "Billing Details",
      layout: { type: "card" },
      fields: [
        {
          id: "billing_address",
          name: "billingAddress",
          type: "address-group" as any,
          label: "Billing Address",
          properties: { intent: "primary" },
        },
      ],
    },
    {
      id: "shipping_section",
      title: "Shipping Details",
      layout: { type: "card" },
      fields: [
        {
          id: "shipping_address",
          name: "shippingAddress",
          type: "address-group" as any,
          label: "Shipping Address",
          properties: { intent: "success" },
        },
      ],
    },
  ],
};
