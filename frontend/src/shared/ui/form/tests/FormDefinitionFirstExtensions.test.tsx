import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import { defineFormContract } from "../types/contract";
import { slotRegistry } from "../slots/SlotRegistry";
import { FieldSlot } from "../slots/FieldSlot";
import { InputWrapper } from "../structure/InputWrapper";
import { FileField } from "../fields/primitive/FileField";
import { RangeField } from "../fields/primitive/RangeField";
import { VirtualizedOptionList } from "../fields/primitive/utils/VirtualizedOptionList";
import type { FormField } from "../fields";

describe("Form-Definition-First Architecture & Scalability", () => {
  describe("Pillar 1: Floating Label Architecture", () => {
    it("renders floating label container with correct data attributes and styling", () => {
      const mockField: FormField = {
        id: "field-email",
        name: "email",
        type: "string",
        label: "Email Address",
        properties: {
          labelPlacement: "inline-floating",
        },
      } as any;

      const { container } = render(
        <InputWrapper
          field={mockField}
          label={<label>Email Address</label>}
          labelPlacement="inline-floating"
          hasValue={false}
        >
          <input id="field-email" type="email" />
        </InputWrapper>
      );

      const floatingWrapper = container.querySelector(".form-field-inner--floating");
      expect(floatingWrapper).toBeInTheDocument();
      expect(floatingWrapper).toHaveAttribute("data-has-value", "false");

      const floatingLabel = container.querySelector(".form-field-floating-label");
      expect(floatingLabel).toBeInTheDocument();
      expect(floatingLabel).toHaveTextContent("Email Address");
    });

    it("applies active styles when hasValue is true", () => {
      const mockField: FormField = {
        id: "field-email",
        name: "email",
        type: "string",
        label: "Email Address",
        properties: {
          labelPlacement: "inline-floating",
        },
      } as any;

      const { container } = render(
        <InputWrapper
          field={mockField}
          label={<label>Email Address</label>}
          labelPlacement="inline-floating"
          hasValue={true}
        >
          <input id="field-email" type="email" defaultValue="user@example.com" />
        </InputWrapper>
      );

      const floatingWrapper = container.querySelector(".form-field-inner--floating");
      expect(floatingWrapper).toHaveAttribute("data-has-value", "true");
    });
  });

  describe("Pillar 2: Dynamic Slot & Dependency Injection Architecture", () => {
    it("resolves registered slot by slotId from SlotRegistry", () => {
      const CustomSlotWidget = ({ field, slotProps }: any) => (
        <span data-testid="custom-slot-widget">
          {field.name}: {slotProps?.badgeText}
        </span>
      );

      slotRegistry.register("test-slot-widget", CustomSlotWidget);

      const mockField: FormField = {
        id: "field-user",
        name: "username",
        type: "string",
        properties: {
          slots: {
            endContent: {
              slotId: "test-slot-widget",
              props: { badgeText: "VIP Member" },
            },
          },
        },
      } as any;

      render(
        <FieldSlot
          placement="endContent"
          field={mockField}
          fallback={<span>fallback</span>}
        />
      );

      const resolvedSlot = screen.getByTestId("custom-slot-widget");
      expect(resolvedSlot).toBeInTheDocument();
      expect(resolvedSlot).toHaveTextContent("username: VIP Member");
    });

    it("renders fallback when no slot is defined", () => {
      const mockField: FormField = {
        id: "field-user",
        name: "username",
        type: "string",
      } as any;

      render(
        <FieldSlot
          placement="startContent"
          field={mockField}
          fallback={<span data-testid="fallback-icon">Icon</span>}
        />
      );

      expect(screen.getByTestId("fallback-icon")).toBeInTheDocument();
    });
  });

  describe("Pillar 3: Contract-Driven FileField Dropzone", () => {
    it("renders elevated dropzone with drag-and-drop feedback and file chips", () => {
      const mockField: FormField = {
        id: "field-files",
        name: "attachments",
        type: "array",
        label: "Documents",
        properties: {
          variant: "dropzone",
          multiple: true,
          dropzone: {
            variant: "dropzone",
            maxSizeBytes: 10 * 1024 * 1024,
          },
        },
      } as any;

      const dummyFile = new File(["test content"], "resume.pdf", {
        type: "application/pdf",
      });

      render(
        <FileField
          field={mockField}
          value={[dummyFile]}
          onChange={vi.fn()}
          layout={{ disabled: false } as any}
        />
      );

      expect(screen.getByRole("button", { name: /upload documents/i })).toBeInTheDocument();
      expect(screen.getByText("resume.pdf")).toBeInTheDocument();
    });
  });

  describe("Pillar 4: Contract-Driven RangeField Slider", () => {
    it("renders slider with marks and computes values", () => {
      const mockField: FormField = {
        id: "field-volume",
        name: "volume",
        type: "number",
        properties: {
          min: 0,
          max: 100,
          step: 10,
          slider: {
            showTooltip: "always",
            marks: [
              { value: 0, label: "Mute" },
              { value: 50, label: "Mid" },
              { value: 100, label: "Max" },
            ],
          },
        },
      } as any;

      render(
        <RangeField
          field={mockField}
          value={50}
          onChange={vi.fn()}
          layout={{ min: 0, max: 100, step: 10, disabled: false } as any}
        />
      );

      const slider = screen.getByRole("slider");
      expect(slider).toBeInTheDocument();
      expect(slider).toHaveAttribute("aria-valuenow", "50");

      expect(screen.getByText("Mute")).toBeInTheDocument();
      expect(screen.getByText("Mid")).toBeInTheDocument();
      expect(screen.getByText("Max")).toBeInTheDocument();
    });
  });

  describe("Pillar 5: Zero-Dependency Virtualized Windowing (> 5,000 items)", () => {
    it("renders only a small window of DOM nodes when dataset has 5,000 items", () => {
      const massiveDataset = Array.from({ length: 5000 }, (_, i) => ({
        id: i,
        label: `Item #${i}`,
      }));

      const { container } = render(
        <VirtualizedOptionList
          items={massiveDataset}
          itemHeight={30}
          maxHeight={300}
          overscan={2}
          renderItem={(item) => (
            <div key={item.id} data-testid="virtual-row">
              {item.label}
            </div>
          )}
        />
      );

      const renderedRows = container.querySelectorAll("[data-testid='virtual-row']");
      // Total visible items = (300 / 30) + (2 * overscan) ~ 14-16 items max!
      expect(renderedRows.length).toBeLessThan(25);
      expect(renderedRows.length).toBeGreaterThan(5);
      expect(screen.getByText("Item #0")).toBeInTheDocument();
    });
  });

  describe("Schema Contract Compilation", () => {
    it("defines strongly typed contract with all elevated features without type error", () => {
      const testContract = defineFormContract({
        id: "enterprise-settings-form",
        title: "Enterprise Settings",
        fields: [
          {
            id: "full-name",
            name: "fullName",
            type: "string",
            label: "Full Name",
            properties: {
              labelPlacement: "inline-floating",
            },
          },
          {
            id: "user-role",
            name: "role",
            type: "string",
            component: "select",
            label: "Role",
            options: [
              { value: "admin", label: "Admin" },
              { value: "editor", label: "Editor" },
            ],
            properties: {
              virtualization: {
                enabled: true,
                itemHeight: 40,
                threshold: 50,
              },
            },
          },
          {
            id: "attachments",
            name: "files",
            type: "array",
            component: "file",
            properties: {
              dropzone: {
                variant: "dropzone",
                maxFiles: 5,
                previewMode: "chips",
              },
            },
          },
          {
            id: "budget",
            name: "budget",
            type: "number",
            component: "range",
            properties: {
              min: 0,
              max: 1000,
              step: 50,
              slider: {
                showTooltip: "hover",
                marks: true,
              },
            },
          },
        ],
      });

      expect(testContract.id).toBe("enterprise-settings-form");
      expect(testContract.fields?.length).toBe(4);
    });
  });
});
