import type { FormDefinition } from "../domain";
import { beforeEach, describe, expect, it } from "vitest";

import { FormCore } from "../engine";

describe("FormCore Repeater Logic", () => {
  const repeaterDef: FormDefinition = {
    id: "repeater-test",
    title: "Repeater Test",
    sections: [
      {
        id: "section1",
        title: "Main Section",
        fields: [
          {
            id: "repeater1",
            name: "items",
            type: "repeater",
            label: "Items",
            fields: [
              {
                id: "item_name",
                name: "itemName",
                type: "text",
                label: "Item Name",
                required: true,
              },
            ],
          },
        ],
      },
    ],
    // fields: {}, // Removed obsolete property
  };

  let form: FormCore;

  beforeEach(() => {
    form = new FormCore(
      repeaterDef,
      {},
      { validationMode: "onChange", validationDebounceMs: 0 }
    );
  });

  it("should resolve static fields", () => {
    const field = form.resolveField("repeater1");
    expect(field).toBeDefined();
    expect(field?.id).toBe("repeater1");
  });

  it("should resolve dynamic repeater fields", () => {
    // Test resolution of items[0].itemName
    const dynamicId = "items[0].itemName";
    const field = form.resolveField(dynamicId);

    expect(field).toBeDefined();
    expect(field?.id).toBe(dynamicId);
    expect(field?.name).toBe(dynamicId); // Logic sets name to ID for dynamic fields to match path
    expect(field?.type).toBe("text");
    expect(field?.label).toBe("Item Name");
  });

  it("should handle setting values for dynamic fields", async () => {
    const dynamicPath = "items[0].itemName";

    await form.setValue(dynamicPath, "Test Item");

    expect(form.values.items[0].itemName).toBe("Test Item");
    expect(form.state.vitality[dynamicPath].dirty).toBe(true);
  });

  it("should validate dynamic fields", async () => {
    const dynamicPath = "items[0].itemName";

    // 1. Set Invalid (Empty Required)
    await form.setValue(dynamicPath, "");
    // Note: Engine auto-validates on setValue now

    const validity = form.state.validity[dynamicPath];
    expect(validity).toBeDefined();
    expect(validity.valid).toBe(false);
    expect(validity.errors?.[0].code).toBe("required");

    // 2. Set Valid
    await form.setValue(dynamicPath, "Valid");
    expect(form.state.validity[dynamicPath].valid).toBe(true);
  });
});
