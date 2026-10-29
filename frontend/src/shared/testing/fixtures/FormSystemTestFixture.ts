import type { FormDefinition } from "@ui/form/types";

export const TEST_FORM_DEFINITION: FormDefinition = {
  id: "system-test-form",
  title: "System Test Form",
  sections: [
    {
      id: "layout_section",
      title: "Layout Test",
      layout: { type: "grid", columns: 12, gap: 4 },
      fields: [
        {
          id: "col_6_left",
          name: "col6Left",
          type: "text",
          label: "Col 6 Left",
          layout: { columnSpan: 6 },
        },
        {
          id: "col_6_right",
          name: "col6Right",
          type: "text",
          label: "Col 6 Right",
          layout: { columnSpan: 6 },
        },
      ],
    },
    {
      id: "primitives_section",
      title: "Primitives Test",
      layout: { type: "card" },
      fields: [
        {
          id: "test_text",
          name: "testText",
          type: "text",
          label: "Text Field",
          required: true,
        },
        {
          id: "test_select",
          name: "testSelect",
          type: "select",
          label: "Select Field",
          options: [
            { label: "Opt 1", value: "1" },
            { label: "Opt 2", value: "2" },
          ],
        },
        {
          id: "test_checkbox",
          name: "testCheckbox",
          type: "checkbox",
          label: "Checkbox Field",
        },
        {
          id: "test_radio",
          name: "testRadio",
          type: "radio",
          label: "Radio Field",
          options: [
            { label: "Yes", value: "yes" },
            { label: "No", value: "no" },
          ],
        },
        {
          id: "test_textarea",
          name: "testTextarea",
          type: "textarea",
          label: "Textarea Field",
        },
      ],
    },
    {
      id: "repeater_section",
      title: "Repeater Test",
      fields: [
        {
          id: "test_repeater",
          name: "testRepeater",
          type: "repeater",
          label: "Items",
          fields: [
            {
              id: "item_name",
              name: "itemName",
              type: "text",
              label: "Item Name",
            },
          ],
        },
      ],
    },
  ],
};
