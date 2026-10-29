import { renderWithProviders } from "@shared/testing/test-utils";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Form } from "../Form";
import type { FormDefinition } from "../types";
import { resolveTranslation } from "../utils/i18n.utils";

const testSchema: FormDefinition = {
  id: "test-nav-form",
  title: "Warehouse Inventory",
  sections: [
    {
      id: "sec-1",
      title: "General",
      fields: [
        {
          key: "sku",
          type: "text",
          label: "SKU",
        },
      ],
    },
  ],
};

describe("FormNavigationGuard & Dynamic TranslatedText Interpolation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("resolveTranslation with parameters", () => {
    it("interpolates {{domain_name}} in raw strings", () => {
      const result = resolveTranslation(
        "You have unsaved changes in {{domain_name}}!",
        "features/forms",
        { domain_name: "Asset Registry" }
      );
      expect(result).toBe("You have unsaved changes in Asset Registry!");
    });

    it("interpolates {{domain_name}} in TranslatedText objects", () => {
      const result = resolveTranslation(
        {
          en: "Changes in {{domain_name}} will be lost",
          es: "Se perderán los cambios en {{domain_name}}",
        },
        "features/forms",
        { domain_name: "Catalog" }
      );
      expect(result).toBe("Changes in Catalog will be lost");
    });

    it("interpolates {{domain_name}} using i18n keys with parameter tokens", () => {
      const result = resolveTranslation(
        "features/forms:navigationGuard.title",
        "features/forms",
        { domain_name: "Employee Portal" }
      );
      expect(result).toContain("Employee Portal");
    });
  });

  describe("Form Component Guard Configuration", () => {
    it("renders without activating navigationGuard by default", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();

      renderWithProviders(
        <Form
          definition={testSchema}
          onSubmit={async (data) => {
            onSubmit(data);
          }}
        />
      );

      const input = screen.getByRole("textbox");
      await user.type(input, "SKU-9901");

      const submitBtn = screen.getByRole("button", { name: /Submit/i });
      await user.click(submitBtn);

      expect(onSubmit).toHaveBeenCalled();
    });

    it("accepts custom NavigationGuardConfig with TranslatedText and domainName override", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();

      renderWithProviders(
        <Form
          definition={testSchema}
          navigationGuard={{
            enabled: true,
            domainName: { en: "Custom Warehouse" },
            message: { en: "Discard changes in {{domain_name}}?" },
          }}
          onSubmit={async (data) => {
            onSubmit(data);
          }}
        />
      );

      const input = screen.getByRole("textbox");
      await user.type(input, "SKU-8822");

      const submitBtn = screen.getByRole("button", { name: /Submit/i });
      await user.click(submitBtn);

      expect(onSubmit).toHaveBeenCalled();
    });

    it("accepts custom NavigationGuardConfig with confirm/cancel aliases without explicit enabled flag", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();

      renderWithProviders(
        <Form
          definition={testSchema}
          navigationGuard={{
            title: "Unsaved Changes in {{domain_name}}",
            message: "You have unsaved changes in {{domain_name}}. Leaving this page will discard all modifications.",
            confirm: "Discard & Leave",
            cancel: "Stay on Page",
            toastTitle: "Navigation Resumed",
            toastDescription: "Unsaved changes in {{domain_name}} were discarded.",
          }}
          onSubmit={async (data) => {
            onSubmit(data);
          }}
        />
      );

      const input = screen.getByRole("textbox");
      await user.type(input, "SKU-8823");

      const submitBtn = screen.getByRole("button", { name: /Submit/i });
      await user.click(submitBtn);

      expect(onSubmit).toHaveBeenCalled();
    });
  });
});
