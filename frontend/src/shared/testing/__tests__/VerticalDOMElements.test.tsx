/**
 * VerticalDOMElements.test.tsx
 *
 * INTEGRATION TESTS — Accordion, Fieldset, Group, Tabs
 *
 * Tests the new vertical DOM structural field types by rendering a full <Form>
 * and interacting with the DOM via the FormDriver pattern.
 * Each test verifies: correct DOM element/role, correct ARIA attributes,
 * child field rendering, and user interaction behavior.
 */
import { fireEvent, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Form } from "@ui/form/Form";
import { describe, expect, it } from "vitest";

import { VERTICAL_DOM_FIXTURE } from "../fixtures/ProgrammaticControlsFixture";
import { renderWithProviders } from "../test-utils";

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

async function renderVerticalForm() {
  const user = userEvent.setup();
  const { container } = renderWithProviders(
    <Form definition={VERTICAL_DOM_FIXTURE} />
  );
  return { container, user };
}

/** Wait for a field with data-field-id to appear and not be loading */
async function waitForUnit(container: HTMLElement, id: string, unit: string) {
  await waitFor(
    () => {
      const el = container.querySelector(
        `[data-unit="${unit}"][data-field-id="${id}"]`
      );
      if (!el)
        throw new Error(
          `[data-unit="${unit}"][data-field-id="${id}"] not found`
        );
      if (el.querySelector(".animate-pulse"))
        throw new Error(`${id} is still loading`);
    },
    { timeout: 5000 }
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 1 — AccordionField
// ─────────────────────────────────────────────────────────────────────────────

describe("AccordionField — Collapsible Structural Container", () => {
  it("renders with correct data-unit and data-field-id", async () => {
    const { container } = await renderVerticalForm();
    await waitForUnit(container, "advanced_accordion", "accordion");

    const el = container.querySelector(
      '[data-unit="accordion"][data-field-id="advanced_accordion"]'
    );
    expect(el).toBeInTheDocument();
  });

  it("starts closed (defaultOpen: false in schema)", async () => {
    const { container } = await renderVerticalForm();
    await waitForUnit(container, "advanced_accordion", "accordion");

    const el = container.querySelector(
      '[data-unit="accordion"][data-field-id="advanced_accordion"]'
    );
    expect(el?.getAttribute("data-open")).toBe("false");
  });

  it("trigger button has aria-expanded=false when closed", async () => {
    const { container } = await renderVerticalForm();
    await waitForUnit(container, "advanced_accordion", "accordion");

    const accordion = container.querySelector(
      '[data-unit="accordion"][data-field-id="advanced_accordion"]'
    )!;
    const trigger = accordion.querySelector("button[aria-expanded]");
    expect(trigger?.getAttribute("aria-expanded")).toBe("false");
  });

  it("opens on trigger click and sets aria-expanded=true", async () => {
    const { container } = await renderVerticalForm();
    await waitForUnit(container, "advanced_accordion", "accordion");

    const accordion = container.querySelector(
      '[data-unit="accordion"][data-field-id="advanced_accordion"]'
    )!;
    const trigger = accordion.querySelector("button") as HTMLButtonElement;

    fireEvent.click(trigger);

    await waitFor(() => {
      expect(accordion.getAttribute("data-open")).toBe("true");
      expect(trigger.getAttribute("aria-expanded")).toBe("true");
    });
  });

  it("reveals child field (timeout) after opening", async () => {
    const { container } = await renderVerticalForm();
    await waitForUnit(container, "advanced_accordion", "accordion");

    const trigger = container.querySelector(
      '[data-unit="accordion"][data-field-id="advanced_accordion"] button'
    ) as HTMLButtonElement;
    fireEvent.click(trigger);

    await waitFor(() => {
      // The `timeout` field (key = id = name = "timeout") should be in the DOM
      const timeoutField = container.querySelector(
        '[data-field-id="timeout"], [data-field-name="timeout"]'
      );
      expect(timeoutField).toBeInTheDocument();
    });
  });

  it("closes again on second trigger click", async () => {
    const { container } = await renderVerticalForm();
    await waitForUnit(container, "advanced_accordion", "accordion");

    const trigger = container.querySelector(
      '[data-unit="accordion"][data-field-id="advanced_accordion"] button'
    ) as HTMLButtonElement;

    fireEvent.click(trigger); // open
    fireEvent.click(trigger); // close

    await waitFor(() => {
      expect(
        container
          .querySelector(
            '[data-unit="accordion"][data-field-id="advanced_accordion"]'
          )
          ?.getAttribute("data-open")
      ).toBe("false");
    });
  });

  it("displays the field label as the accordion trigger text", async () => {
    const { container } = await renderVerticalForm();
    await waitForUnit(container, "advanced_accordion", "accordion");

    const trigger = container.querySelector(
      '[data-unit="accordion"][data-field-id="advanced_accordion"] button'
    );
    expect(trigger?.textContent).toContain("Advanced Settings");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 2 — FieldsetField
// ─────────────────────────────────────────────────────────────────────────────

describe("FieldsetField — Semantic HTML Fieldset + Legend", () => {
  it("renders a native <fieldset> element", async () => {
    const { container } = await renderVerticalForm();
    await waitForUnit(container, "address_fieldset", "fieldset");

    const fieldset = container.querySelector(
      '[data-unit="fieldset"][data-field-id="address_fieldset"]'
    );
    expect(fieldset).toBeInTheDocument();
    expect(fieldset?.tagName).toBe("FIELDSET");
  });

  it("renders a <legend> with the field label", async () => {
    const { container } = await renderVerticalForm();
    await waitForUnit(container, "address_fieldset", "fieldset");

    const legend = container.querySelector(
      '[data-unit="fieldset"][data-field-id="address_fieldset"] legend'
    );
    expect(legend).toBeInTheDocument();
    expect(legend?.textContent?.trim()).toBe("Shipping Address");
  });

  it("renders child fields (street, city) inside the fieldset", async () => {
    const { container } = await renderVerticalForm();
    await waitForUnit(container, "address_fieldset", "fieldset");

    await waitFor(() => {
      const street = container.querySelector(
        '[data-field-id="street"], [data-field-name="street"]'
      );
      const city = container.querySelector(
        '[data-field-id="city"],   [data-field-name="city"]'
      );
      expect(street).toBeInTheDocument();
      expect(city).toBeInTheDocument();
    });
  });

  it("renders description text below the legend", async () => {
    const { container } = await renderVerticalForm();
    await waitForUnit(container, "address_fieldset", "fieldset");

    const wrapper = container.querySelector(
      '[data-unit="fieldset"][data-field-id="address_fieldset"]'
    )!;
    expect(
      within(wrapper as HTMLElement).queryByText("Where should we deliver?")
    ).toBeInTheDocument();
  });

  it("child inputs are semantically associated via fieldset grouping", async () => {
    const { container } = await renderVerticalForm();
    await waitForUnit(container, "address_fieldset", "fieldset");

    // All inputs inside the fieldset should be descendants of the <fieldset> element
    const fieldset = container.querySelector(
      '[data-unit="fieldset"][data-field-id="address_fieldset"]'
    )!;
    await waitFor(() => {
      const inputs = fieldset.querySelectorAll("input, textarea");
      expect(inputs.length).toBeGreaterThan(0);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 3 — GroupField
// ─────────────────────────────────────────────────────────────────────────────

describe("GroupField — Inline Horizontal Row with Shared Label", () => {
  it("renders with role=group for accessibility", async () => {
    const { container } = await renderVerticalForm();
    await waitForUnit(container, "full_name_group", "group");

    const group = container.querySelector(
      '[data-unit="group"][data-field-id="full_name_group"]'
    );
    expect(group?.getAttribute("role")).toBe("group");
  });

  it("renders the group label in a labelled span", async () => {
    const { container } = await renderVerticalForm();
    await waitForUnit(container, "full_name_group", "group");

    const group = container.querySelector('[data-field-id="full_name_group"]')!;
    expect(
      within(group as HTMLElement).queryByText("Full Name")
    ).toBeInTheDocument();
  });

  it("shows required marker (*) for required group", async () => {
    const { container } = await renderVerticalForm();
    await waitForUnit(container, "full_name_group", "group");

    const group = container.querySelector('[data-field-id="full_name_group"]')!;
    // Required asterisk should be present (aria-hidden="true")
    const asterisk = group.querySelector('[aria-hidden="true"]');
    expect(asterisk?.textContent).toContain("*");
  });

  it("renders child fields (first_name, last_name) in a flex row", async () => {
    const { container } = await renderVerticalForm();
    await waitForUnit(container, "full_name_group", "group");

    await waitFor(() => {
      const firstName = container.querySelector(
        '[data-field-id="first_name"], [data-field-name="first_name"]'
      );
      const lastName = container.querySelector(
        '[data-field-id="last_name"],  [data-field-name="last_name"]'
      );
      expect(firstName).toBeInTheDocument();
      expect(lastName).toBeInTheDocument();
    });
  });

  it("group row container has flex layout", async () => {
    const { container } = await renderVerticalForm();
    await waitForUnit(container, "full_name_group", "group");

    const row = container.querySelector('[data-layout="group-row"]');
    expect(row).toBeInTheDocument();
    expect(row?.className).toContain("flex");
  });

  it("aria-labelledby on group points to the group label element", async () => {
    const { container } = await renderVerticalForm();
    await waitForUnit(container, "full_name_group", "group");

    const group = container.querySelector(
      '[data-field-id="full_name_group"][role="group"]'
    )!;
    const labelledById = group.getAttribute("aria-labelledby");
    expect(labelledById).toBeTruthy();

    const labelEl = container.querySelector(`#${labelledById}`);
    expect(labelEl?.textContent).toContain("Full Name");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 4 — TabsField
// ─────────────────────────────────────────────────────────────────────────────

describe("TabsField — ARIA Tab Panel Renderer", () => {
  it("renders a tablist with the correct number of tabs", async () => {
    const { container } = await renderVerticalForm();

    await waitFor(
      () => {
        const tablist = container.querySelector('[role="tablist"]');
        if (!tablist) throw new Error("tablist not found");
      },
      { timeout: 5000 }
    );

    const tablist = container.querySelector('[role="tablist"]')!;
    const tabs = tablist.querySelectorAll('[role="tab"]');
    // Fixture has 2 tabs: General + Security
    expect(tabs.length).toBe(2);
  });

  it("first tab is active by default (aria-selected=true)", async () => {
    const { container } = await renderVerticalForm();
    await waitFor(() => container.querySelector('[role="tablist"]'), {
      timeout: 5000,
    });

    const firstTab = container.querySelector('[role="tab"]');
    expect(firstTab?.getAttribute("aria-selected")).toBe("true");
  });

  it("tab labels match the schema section labels", async () => {
    const { container } = await renderVerticalForm();
    await waitFor(() => container.querySelector('[role="tablist"]'), {
      timeout: 5000,
    });

    const tabs = container.querySelectorAll('[role="tab"]');
    const labels = Array.from(tabs).map((t) => t.textContent?.trim());
    expect(labels).toContain("General");
    expect(labels).toContain("Security");
  });

  it("clicking a tab activates it (aria-selected switches)", async () => {
    const { container } = await renderVerticalForm();
    await waitFor(() => container.querySelector('[role="tablist"]'), {
      timeout: 5000,
    });

    const tabs = container.querySelectorAll('[role="tab"]');
    const securityTab = tabs[1] as HTMLButtonElement;

    fireEvent.click(securityTab);

    await waitFor(() => {
      expect(securityTab.getAttribute("aria-selected")).toBe("true");
      expect(tabs[0].getAttribute("aria-selected")).toBe("false");
    });
  });

  it("tab panel renders its child fields", async () => {
    const { container } = await renderVerticalForm();
    await waitFor(() => container.querySelector('[role="tabpanel"]'), {
      timeout: 5000,
    });

    // First panel (General) should have display_name field
    await waitFor(() => {
      const field = container.querySelector(
        '[data-field-id="display_name"], [data-field-name="display_name"]'
      );
      expect(field).toBeInTheDocument();
    });
  });

  it("switching tabs renders the new panel's fields", async () => {
    const { container } = await renderVerticalForm();
    await waitFor(() => container.querySelector('[role="tablist"]'), {
      timeout: 5000,
    });

    const tabs = container.querySelectorAll('[role="tab"]');
    fireEvent.click(tabs[1]); // Security tab

    await waitFor(() => {
      const passwordField = container.querySelector(
        '[data-field-id="current_password"], [data-field-name="current_password"]'
      );
      expect(passwordField).toBeInTheDocument();
    });
  });

  it("keyboard ArrowRight moves focus to next tab", async () => {
    const { container } = await renderVerticalForm();
    await waitFor(() => container.querySelector('[role="tablist"]'), {
      timeout: 5000,
    });

    const firstTab = container.querySelector(
      '[role="tab"]'
    ) as HTMLButtonElement;
    firstTab.focus();

    fireEvent.keyDown(firstTab, { key: "ArrowRight" });

    await waitFor(() => {
      const tabs = container.querySelectorAll('[role="tab"]');
      expect(tabs[1].getAttribute("aria-selected")).toBe("true");
    });
  });

  it("tabpanel has correct aria-labelledby pointing to its tab", async () => {
    const { container } = await renderVerticalForm();
    await waitFor(() => container.querySelector('[role="tabpanel"]'), {
      timeout: 5000,
    });

    const panel = container.querySelector('[role="tabpanel"]')!;
    const labelledBy = panel.getAttribute("aria-labelledby")!;
    const tab = container.querySelector(`#${labelledBy}`);
    expect(tab?.getAttribute("role")).toBe("tab");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 5 — DividerField with Label (divider-label)
// ─────────────────────────────────────────────────────────────────────────────

describe("DividerField — Labeled Divider", () => {
  it("renders a labeled divider when field.label is set", async () => {
    const { container } = renderWithProviders(
      <Form
        definition={{
          id: "divider-test",
          title: "Divider Test",
          sections: [
            {
              id: "s1",
              title: "Divider Section",
              fields: [
                {
                  key: "divider_1",
                  type: "divider",
                  label: "Personal Info",
                },
                {
                  key: "name_field",
                  type: "text",
                  label: "Name",
                },
              ],
            },
          ],
        }}
      />
    );

    await waitFor(
      () => {
        const dividerText = container.querySelector(
          ".relative.flex.justify-center span"
        );
        expect(dividerText?.textContent?.trim()).toBe("Personal Info");
      },
      { timeout: 3000 }
    );
  });

  it("renders a plain <hr> when no label is set", async () => {
    const { container } = renderWithProviders(
      <Form
        definition={{
          id: "plain-divider-test",
          title: "Plain Divider",
          sections: [
            {
              id: "s1",
              title: "Section",
              fields: [{ key: "plain_divider", type: "divider", label: "" }],
            },
          ],
        }}
      />
    );

    await waitFor(
      () => {
        const hr = container.querySelector("hr");
        expect(hr).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });
});
