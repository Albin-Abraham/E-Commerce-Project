import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderWithProviders } from "../../../testing/test-utils";
import { Form } from "../Form";
import {
  defineFormContract,
  compileContractToFormDefinition,
  type InferFormValues,
} from "../types/contract";

describe("MPDA / MDAP Type-Safe Form Contract API", () => {
  it("infers static TypeScript types correctly and compiles to an executable FormDefinition", async () => {
    const registrationContract = defineFormContract({
      id: "user-registration",
      title: "User Registration",
      submitLabel: "Register Now",
      sections: [
        {
          id: "credentials-sec",
          title: "Account Credentials",
          fields: [
            {
              id: "field-username",
              name: "username",
              type: "string",
              component: "text",
              label: "Username",
              required: true,
              properties: {
                placeholder: "johndoe",
                icon: "user",
                ariaKeyShortcuts: "Alt+U",
              },
            },
            {
              id: "field-role",
              name: "role",
              type: "string",
              component: "select",
              label: "Assigned Role",
              options: [
                { value: "developer", label: "Software Developer" },
                { value: "manager", label: "Product Manager" },
              ],
              properties: {
                ariaKeyShortcuts: "Alt+R",
              },
            },
            {
              id: "field-skills",
              name: "skills",
              type: "array",
              component: "multiselect",
              label: "Tech Stack",
              options: [
                { value: "react", label: "React" },
                { value: "typescript", label: "TypeScript" },
              ],
              properties: {
                ariaKeyShortcuts: "Alt+S",
              },
            },
            {
              id: "field-tier",
              name: "tier",
              type: "string",
              component: "radio",
              label: "Subscription Tier",
              options: [
                { value: "free", label: "Free Tier" },
                { value: "enterprise", label: "Enterprise Tier" },
              ],
              properties: {
                direction: "row",
                ariaKeyShortcuts: "Alt+T",
              },
            },
            {
              id: "field-experience",
              name: "yearsOfExperience",
              type: "number",
              label: "Experience (Years)",
              properties: {
                min: 0,
                max: 40,
                step: 1,
              },
            },
            {
              id: "field-newsletter",
              name: "newsletter",
              type: "boolean",
              component: "switch",
              label: "Subscribe to Newsletter",
            },
            {
              id: "btn-action",
              name: "actionButton",
              type: "button",
              label: "Verify Identity",
            },
          ],
        },
      ],
    });

    // Compile to Zenith executable FormDefinition
    const formDef = compileContractToFormDefinition(registrationContract);

    // Verify TypeScript type extraction at compile time
    type ExtractedValues = InferFormValues<typeof registrationContract>;

    // Type checking assertion: This block will fail compilation if types don't match
    const testData: ExtractedValues = {
      username: "alice",
      role: "developer",
      skills: ["react", "typescript"],
      tier: "enterprise",
      yearsOfExperience: 5,
      newsletter: true,
    };
    expect(testData.username).toBe("alice");
    expect(testData.skills).toHaveLength(2);

    // Render in React DOM
    renderWithProviders(<Form definition={formDef} />);

    // Verify all fields are present with correct ARIA shortcuts
    const usernameInput = await screen.findByPlaceholderText("johndoe");
    expect(usernameInput).toBeInTheDocument();
    expect(usernameInput).toHaveAttribute("aria-keyshortcuts", "Alt+U");

    const roleCombobox = await screen.findByRole("combobox");
    expect(roleCombobox).toBeInTheDocument();
    expect(roleCombobox).toHaveAttribute("aria-keyshortcuts", "Alt+R");

    const skillsListbox = await screen.findByRole("listbox");
    expect(skillsListbox).toBeInTheDocument();
    expect(skillsListbox).toHaveAttribute("aria-keyshortcuts", "Alt+S");

    const tierRadiogroup = await screen.findByRole("radiogroup");
    expect(tierRadiogroup).toBeInTheDocument();
    expect(tierRadiogroup).toHaveAttribute("aria-keyshortcuts", "Alt+T");

    // Print rendered DOM for diagnostics
    // screen.debug(undefined, 20000);

    expect(screen.getByRole("button", { name: /register/i })).toBeInTheDocument();
  });

  it("supports dynamic slot elements and prefix/suffix in typed contracts", async () => {
    const slotContract = defineFormContract({
      id: "slot-form",
      title: "Slot Form",
      fields: [
        {
          id: "field-price",
          name: "price",
          type: "number",
          label: "Product Price",
          properties: {
            prefix: <span data-testid="currency-symbol">$</span>,
            suffix: <span data-testid="currency-code">USD</span>,
            ariaKeyShortcuts: "Alt+P",
          },
        },
      ],
    });

    const formDef = compileContractToFormDefinition(slotContract);
    type ExtractedValues = InferFormValues<typeof slotContract>;

    const data: ExtractedValues = { price: 99.99 };
    expect(data.price).toBe(99.99);

    renderWithProviders(<Form definition={formDef} />);

    expect(screen.getByTestId("currency-symbol")).toBeInTheDocument();
    expect(screen.getByTestId("currency-code")).toBeInTheDocument();
    expect(screen.getByRole("spinbutton")).toHaveAttribute("aria-keyshortcuts", "Alt+P");
  });
});

