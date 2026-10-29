import type { FormDefinition } from "../domain";
import { describe, expect, it } from "vitest";

import { FormCore } from "../engine";

describe("FormCore Visibility Logic (Cascading)", () => {
  // Schema with nested container
  const nestedSchema: FormDefinition = {
    id: "nested-test",
    title: "Nested Test",

    fields: {
      // Trigger field to control visibility
      trigger: {
        id: "trigger",
        name: "trigger",
        type: "text",
        initialValue: "hide",
      },

      // Parent Container (Hidden by default, shown if trigger == 'show')
      parent_container: {
        id: "parent_container",
        name: "parent_container",
        type: "container",
        meta: {
          conditions: {
            groups: [
              {
                action: "show",
                rules: [
                  { field: "trigger", operator: "equals", value: "show" },
                ],
              },
            ],
          },
        },
        fields: [], // Populated by normalization usually, but definition structure implies we just need to list fields in root too
      },

      // Child Field (Inside Parent)
      child_field: {
        id: "child_field",
        name: "child_field",
        type: "text",
        required: true,
        // parentId is derived during normalization usually.
        // Since we are unit testing FormCore which calls normalization,
        // we need to structure the input as FormDefinition expects (nested fields in fields array or sections)
      },
    },
    sections: [
      {
        id: "main",
        title: "Main",
        fields: [
          { id: "trigger", name: "trigger", type: "text", label: "Trigger" },
          {
            id: "parent_container",
            name: "parent_container",
            type: "container",
            label: "Parent",
            meta: {
              conditions: {
                groups: [
                  {
                    action: "show",
                    rules: [
                      { field: "trigger", operator: "equals", value: "show" },
                    ],
                  },
                ],
              },
            },
            fields: [
              {
                id: "child_field",
                name: "child_field",
                type: "text",
                label: "Child",
                required: true,
              },
            ],
          },
        ],
      },
    ],
  } as any;

  it("should hide child when parent container is hidden", () => {
    const form = new FormCore(nestedSchema);

    // Initial State: Trigger is 'hide' (default null/undefined or set)
    form.setValue("trigger", "hide");

    // Parent should be hidden
    expect(form.visibility["parent_container"]).toBe(false);

    // Child should be hidden (Cascading)
    expect(form.visibility["child_field"]).toBe(false);
  });

  it("should show child when parent container is shown", async () => {
    const form = new FormCore(nestedSchema);

    // Set Trigger to 'show'
    await form.setValue("trigger", "show");

    // Parent should be visible
    expect(form.visibility["parent_container"]).toBe(true);

    // Child should be visible
    expect(form.visibility["child_field"]).toBe(true);
  });

  it("should skip validation for hidden nested children", async () => {
    const form = new FormCore(nestedSchema);

    // Hidden State
    form.setValue("trigger", "hide");

    // Validate child (required field)
    await form.validateFields(["child_field"]);

    // Should be valid because it's hidden
    expect(form.validity["child_field"].valid).toBe(true);
  });

  it("should enforce validation for visible nested children", async () => {
    const form = new FormCore(nestedSchema);

    // Visible State
    await form.setValue("trigger", "show");

    // Validate child (required field, empty)
    await form.validateFields(["child_field"]);

    // Should be INVALID
    expect(form.validity["child_field"].valid).toBe(false);
  });
});
