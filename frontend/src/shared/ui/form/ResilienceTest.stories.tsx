import type { Meta, StoryObj } from "@storybook/react-vite";

import { Form } from "./Form";
import type { FormDefinition } from "@form-core/domain";

const meta: Meta<typeof Form> = {
  title: "Form/Layouts/Resilience & Smart Span Logic",
  component: Form,
  tags: ["autodocs"],
};

export default meta;

/**
 * SMART LAYOUT & RESILIENCE TEST
 *
 * Verifies:
 * 1. Heuristic Span Engine (Smart Recommendations)
 * 2. Relaxed Compact Density
 * 3. Min-Width Protection (Prevent field collapse in dense grids)
 * 4. Style Tracing (via DevTools Styles Tab)
 */
export const AdaptiveControls: StoryObj<typeof Form> = {
  args: {
    debug: true,
    definition: {
      id: "resilience-test",
      version: "2.0",
      settings: {
        density: "compact",
      },
      style: {
        classNames: {
          root: "max-w-5xl mx-auto p-4",
        },
      },
      sections: [
        {
          id: "heuristics",
          title: "1. Adaptive Span Logic",
          description:
            "These fields have NO explicit columnSpan defined. The engine infers appropriate width based on ID and type.",
          layout: { type: "grid", columns: 12 },
          fields: [
            {
              id: "org_name",
              type: "text",
              label: "Organization Name (Full Width Inference)",
            },
            {
              id: "bio_description",
              type: "textarea",
              label: "Biography (TextArea Inference)",
            },
            {
              id: "user_email",
              type: "email",
              label: "Email (Half Width Inference)",
            },
            {
              id: "user_phone",
              type: "phone",
              label: "Phone (Half Width Inference)",
            },
            { id: "zip_code", type: "text", label: "Zip (Quarter Inference)" },
            { id: "user_id", type: "number", label: "ID (Quarter Inference)" },
            {
              id: "amount_owed",
              type: "number",
              label: "Amount (Quarter Inference)",
            },
            {
              id: "random_field",
              type: "text",
              label: "Default (3-column fallback)",
            },
          ],
        },
        {
          id: "stress",
          title: "2. Min-Width Protection",
          description:
            "Testing collapse prevention. Each field is forced to col-span-1 in a 12-col grid. They should wrap or hold minimum usable width instead of disappearing.",
          layout: { type: "grid", columns: 12 },
          fields: Array.from({ length: 12 }).map((_, i) => ({
            id: `stress_col_${i}`,
            name: `col_${i}`,
            type: "text",
            label: `Field ${i}`,
            layout: { columnSpan: 1 },
          })),
        },
      ],
    } as any,
  },
};
