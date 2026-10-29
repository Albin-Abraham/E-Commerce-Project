import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AutocompleteField } from "../AutocompleteField";

describe("AutocompleteField", () => {
  const options = [
    { value: "react", label: "React" },
    { value: "vue", label: "Vue" },
    { value: "angular", label: "Angular" },
  ];

  it("renders without crashing and displays placeholder", () => {
    render(
      <AutocompleteField
        field={{
          id: "test-autocomplete",
          name: "test",
          type: "autocomplete",
          label: "Framework",
          options,
        }}
        layout={{ placeholder: { en: "Pick a framework..." } }}
        value=""
        onChange={vi.fn()}
      />
    );

    const input = screen.getByRole("combobox");
    expect(input).toBeDefined();
    expect(input.getAttribute("placeholder")).toBe("Pick a framework...");
  });

  it("allows searching and selecting an option", async () => {
    const handleChange = vi.fn();
    render(
      <AutocompleteField
        field={{
          id: "test-autocomplete",
          name: "test",
          type: "autocomplete",
          label: "Framework",
          options,
        }}
        value=""
        onChange={handleChange}
      />
    );

    const input = screen.getByRole("combobox");
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "Re" } });

    // Option React should be in the document
    const option = await screen.findByText("React");
    expect(option).toBeDefined();

    fireEvent.click(option);
    expect(handleChange).toHaveBeenCalledWith("react");
  });

  describe("Multi-Select Multiple Values Display", () => {
    const multiOptions = [
      { value: "react", label: "React" },
      { value: "vue", label: "Vue" },
      { value: "angular", label: "Angular" },
      { value: "svelte", label: "Svelte" },
    ];

    it("renders inline tags with remove button and triggers removal", () => {
      const handleChange = vi.fn();
      render(
        <AutocompleteField
          field={{
            id: "tech-stack",
            name: "tech",
            type: "autocomplete",
            label: "Tech Stack",
            options: multiOptions,
          }}
          multiple
          value={["react", "vue"]}
          onChange={handleChange}
        />
      );

      const tags = screen.getAllByTestId ? screen.queryAllByRole("button") : [];
      // Tag remove buttons
      const removeReactBtn = screen.getByRole("button", { name: "Remove React" });
      const removeVueBtn = screen.getByRole("button", { name: "Remove Vue" });

      expect(removeReactBtn).toBeDefined();
      expect(removeVueBtn).toBeDefined();

      fireEvent.click(removeReactBtn);
      expect(handleChange).toHaveBeenCalledWith(["vue"]);
    });

    it("renders overflow +N badge and opens popover with remaining chips", async () => {
      const handleChange = vi.fn();
      const { container } = render(
        <AutocompleteField
          field={{
            id: "tech-stack",
            name: "tech",
            type: "autocomplete",
            label: "Tech Stack",
            options: multiOptions,
          }}
          multiple
          maxVisibleTags={2}
          value={["react", "vue", "angular", "svelte"]}
          onChange={handleChange}
        />
      );

      const overflowBadge = container.querySelector("[data-unit='selected-overflow-badge']");
      expect(overflowBadge).not.toBeNull();
      expect(overflowBadge?.textContent).toBe("+2");
      // Crude native OS title tooltip is killed
      expect(overflowBadge?.getAttribute("title")).toBeNull();

      // Click to open interactive popover
      fireEvent.click(overflowBadge!);

      const removeAngularBtn = await screen.findByRole("button", { name: "Remove Angular" });
      expect(removeAngularBtn).toBeDefined();

      fireEvent.click(removeAngularBtn);
      expect(handleChange).toHaveBeenCalledWith(["react", "vue", "svelte"]);
    });


    it("removes the last selected option when Backspace is pressed on empty query", () => {
      const handleChange = vi.fn();
      render(
        <AutocompleteField
          field={{
            id: "tech-stack",
            name: "tech",
            type: "autocomplete",
            label: "Tech Stack",
            options: multiOptions,
          }}
          multiple
          value={["react", "vue"]}
          onChange={handleChange}
        />
      );

      const input = screen.getByRole("combobox");
      fireEvent.keyDown(input, { key: "Backspace" });

      expect(handleChange).toHaveBeenCalledWith(["react"]);
    });

    it("renders selected values in a dedicated area when multipleDisplay is 'area'", () => {
      const handleChange = vi.fn();
      const { container } = render(
        <AutocompleteField
          field={{
            id: "tech-stack",
            name: "tech",
            type: "autocomplete",
            label: "Tech Stack",
            options: multiOptions,
          }}
          multiple
          multipleDisplay="area"
          value={["react", "vue"]}
          onChange={handleChange}
        />
      );

      const area = container.querySelector("[data-unit='selected-values-area']");
      expect(area).not.toBeNull();

      const areaTags = area?.querySelectorAll("[data-unit='selected-area-tag']");
      expect(areaTags?.length).toBe(2);

      const clearAllBtn = screen.getByRole("button", { name: "Clear all" });
      expect(clearAllBtn).toBeDefined();

      fireEvent.click(clearAllBtn);
      expect(handleChange).toHaveBeenCalledWith([]);
    });

    it("renders concise summary text when multipleDisplay is 'summary'", () => {
      const { container } = render(
        <AutocompleteField
          field={{
            id: "tech-stack",
            name: "tech",
            type: "autocomplete",
            label: "Tech Stack",
            options: multiOptions,
          }}
          multiple
          multipleDisplay="summary"
          maxVisibleTags={2}
          value={["react", "vue", "angular"]}
          onChange={vi.fn()}
        />
      );

      const summaryText = container.querySelector("[data-unit='selected-summary-text']");
      expect(summaryText).not.toBeNull();
      expect(summaryText?.textContent).toBe("React, Vue +1");
    });

    it("applies 100% custom badge styling (margin, padding, className, radius, intent) from field.properties.badge", () => {
      const { container } = render(
        <AutocompleteField
          field={{
            id: "custom-badges",
            name: "tech",
            type: "autocomplete",
            label: "Tech Stack",
            options: multiOptions,
            properties: {
              badge: {
                intent: "success",
                radius: "full",
                padding: "px-4 py-1.5",
                margin: "my-1",
                className: "custom-special-tag",
                overflowClassName: "custom-overflow-pill",
              },
            },
          }}
          multiple
          maxVisibleTags={1}
          value={["react", "vue"]}
          onChange={vi.fn()}
        />
      );

      const tag = container.querySelector("[data-unit='selected-tag']");
      expect(tag).not.toBeNull();
      expect(tag?.className).toContain("px-4 py-1.5");
      expect(tag?.className).toContain("my-1");
      expect(tag?.className).toContain("rounded-full");
      expect(tag?.className).toContain("bg-success/10");
      expect(tag?.className).toContain("custom-special-tag");

      const overflowBadge = container.querySelector("[data-unit='selected-overflow-badge']");
      expect(overflowBadge).not.toBeNull();
      expect(overflowBadge?.className).toContain("custom-overflow-pill");
    });

    it("applies custom tag classes from DCS slots (styles / meta.ui.classNames)", () => {
      const { container } = render(
        <AutocompleteField
          field={{
            id: "slot-badges",
            name: "tech",
            type: "autocomplete",
            label: "Tech Stack",
            options: multiOptions,
            meta: {
              ui: {
                classNames: {
                  tag: "theme-slot-tag-class",
                },
              },
            },
          }}
          multiple
          value={["react"]}
          onChange={vi.fn()}
        />
      );

      const tag = container.querySelector("[data-unit='selected-tag']");
      expect(tag).not.toBeNull();
      expect(tag?.className).toContain("theme-slot-tag-class");
    });
  });
});

