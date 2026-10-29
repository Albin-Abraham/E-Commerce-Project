import { describe, it, expect } from "vitest";
import {
  formatCurrencyValue,
  formatDateValue,
  formatNumberValue,
  formatBooleanValue,
  resolveOptionLabel,
} from "../domain/formatters";
import { synthesizeFormField } from "../domain/field-adapter";
import { hasConditionalRules } from "../modules/visibility";

describe("DomainFormatters (pure framework-agnostic formatting)", () => {
  describe("formatCurrencyValue", () => {
    it("returns '-' for null, undefined, or empty values", () => {
      expect(formatCurrencyValue(null)).toBe("-");
      expect(formatCurrencyValue(undefined)).toBe("-");
      expect(formatCurrencyValue("")).toBe("-");
    });

    it("formats standard numbers with default USD currency", () => {
      const result = formatCurrencyValue(1250.5);
      expect(result).toMatch(/\$1,250\.50/);
    });

    it("supports multi-currency codes (EUR, JPY, GBP)", () => {
      const eur = formatCurrencyValue(100, "EUR", "en-US");
      expect(eur).toContain("€");
      expect(eur).toContain("100.00");

      const jpy = formatCurrencyValue(5000, "JPY", "ja-JP");
      expect(jpy).toContain("5,000");
    });

    it("handles numeric strings gracefully", () => {
      expect(formatCurrencyValue("42.99", "USD", "en-US")).toMatch(/\$42\.99/);
    });

    it("falls back safely for invalid currency codes without throwing", () => {
      const fallback = formatCurrencyValue(100, "INVALID_CODE", "en-US");
      expect(fallback).toBe("INVALID_CODE 100.00");
    });

    it("returns raw value for non-numeric strings", () => {
      expect(formatCurrencyValue("not-a-number")).toBe("not-a-number");
    });
  });

  describe("formatDateValue", () => {
    it("returns '-' for null, undefined, or empty values", () => {
      expect(formatDateValue(null)).toBe("-");
      expect(formatDateValue(undefined)).toBe("-");
      expect(formatDateValue("")).toBe("-");
    });

    it("formats Date instances, timestamps, and ISO strings", () => {
      const testDate = new Date("2025-01-15T10:30:00Z");
      expect(formatDateValue(testDate)).toBeTruthy();
      expect(formatDateValue(testDate.getTime())).toBeTruthy();
      expect(formatDateValue("2025-01-15T10:30:00Z")).toBeTruthy();
    });

    it("supports different format types (date, datetime, time)", () => {
      const dateStr = "2025-06-15T12:00:00Z";
      const dateOnly = formatDateValue(dateStr, "date", "en-US");
      const dateTime = formatDateValue(dateStr, "datetime", "en-US");
      const timeOnly = formatDateValue(dateStr, "time", "en-US");

      expect(dateOnly).toBeTruthy();
      expect(dateTime.length).toBeGreaterThan(dateOnly.length);
      expect(timeOnly).toBeTruthy();
    });

    it("returns raw string if value cannot be parsed into a date", () => {
      expect(formatDateValue("unparseable-date")).toBe("unparseable-date");
    });
  });

  describe("formatNumberValue", () => {
    it("returns '-' for null, undefined, or empty values", () => {
      expect(formatNumberValue(null)).toBe("-");
      expect(formatNumberValue(undefined)).toBe("-");
      expect(formatNumberValue("")).toBe("-");
    });

    it("formats numbers with Intl options", () => {
      const formatted = formatNumberValue(1234567.89, {
        maximumFractionDigits: 1,
      }, "en-US");
      expect(formatted).toBe("1,234,567.9");
    });

    it("returns string as-is if non-numeric", () => {
      expect(formatNumberValue("abc")).toBe("abc");
    });
  });

  describe("formatBooleanValue", () => {
    it("handles truthy values (boolean true, 'true', 1, '1', 'yes')", () => {
      expect(formatBooleanValue(true).isTrue).toBe(true);
      expect(formatBooleanValue(true).label).toBe("Yes");

      expect(formatBooleanValue("true").isTrue).toBe(true);
      expect(formatBooleanValue(1).isTrue).toBe(true);
      expect(formatBooleanValue("1").isTrue).toBe(true);
      expect(formatBooleanValue("yes").isTrue).toBe(true);
    });

    it("handles falsy values (boolean false, 'false', 0, null, undefined)", () => {
      expect(formatBooleanValue(false).isTrue).toBe(false);
      expect(formatBooleanValue(false).label).toBe("No");

      expect(formatBooleanValue("false").isTrue).toBe(false);
      expect(formatBooleanValue(0).isTrue).toBe(false);
      expect(formatBooleanValue(null).isTrue).toBe(false);
      expect(formatBooleanValue(undefined).isTrue).toBe(false);
    });

    it("supports custom true and false labels", () => {
      const custom = formatBooleanValue(true, {
        trueLabel: "Approved",
        falseLabel: "Rejected",
      });
      expect(custom.label).toBe("Approved");

      const rejected = formatBooleanValue(false, {
        trueLabel: "Approved",
        falseLabel: "Rejected",
      });
      expect(rejected.label).toBe("Rejected");
    });
  });

  describe("resolveOptionLabel", () => {
    const options = [
      { value: "pending", label: "Pending Approval" },
      { value: "active", label: { en: "Active Status", fr: "Actif" } },
      { value: 10, label: "Tier 10" },
    ];

    it("resolves direct string labels", () => {
      expect(resolveOptionLabel("pending", options)).toBe("Pending Approval");
    });

    it("resolves localized object labels", () => {
      expect(resolveOptionLabel("active", options)).toBe("Active Status");
    });

    it("handles numeric values and string coercion", () => {
      expect(resolveOptionLabel(10, options)).toBe("Tier 10");
      expect(resolveOptionLabel("10", options)).toBe("Tier 10");
    });

    it("returns undefined for non-matching or missing values", () => {
      expect(resolveOptionLabel("unknown", options)).toBeUndefined();
      expect(resolveOptionLabel(null, options)).toBeUndefined();
      expect(resolveOptionLabel("pending", [])).toBeUndefined();
      expect(resolveOptionLabel("pending", undefined)).toBeUndefined();
    });
  });
});

describe("DomainFieldAdapter (synthesizeFormField)", () => {
  it("synthesizes a complete FormField from minimal direct props", () => {
    const field = synthesizeFormField({
      name: "email",
      label: "Work Email",
      placeholder: "name@company.com",
      required: true,
      disabled: false,
    });

    expect(field.id).toBe("email");
    expect(field.name).toBe("email");
    expect(field.type).toBe("text");
    expect(field.label).toBe("Work Email");
    expect(field.placeholder).toBe("name@company.com");
    expect(field.required).toBe(true);
    expect(field.disabled).toBe(false);
    expect(field.properties).toEqual({});
  });

  it("enhances an existing schema field definition without losing underlying properties", () => {
    const existing = {
      id: "age",
      name: "age",
      type: "number" as const,
      label: "Age",
      properties: { min: 18, max: 100 },
      meta: { ui: { colSpan: 6 } },
    };

    const enhanced = synthesizeFormField(
      { label: "Client Age", disabled: true },
      existing
    );

    expect(enhanced.id).toBe("age");
    expect(enhanced.label).toBe("Client Age");
    expect(enhanced.disabled).toBe(true);
    expect(enhanced.properties).toEqual({ min: 18, max: 100 });
    expect(enhanced.meta).toEqual({ ui: { colSpan: 6 } });
  });

  it("returns existing field unchanged when no overriding direct props are supplied", () => {
    const existing = {
      id: "username",
      name: "username",
      type: "text" as const,
      label: "Username",
    };

    const same = synthesizeFormField({}, existing);
    expect(same).toBe(existing);
  });
});

describe("FormVisibility (hasConditionalRules)", () => {
  it("returns false for empty or non-array inputs", () => {
    expect(hasConditionalRules([])).toBe(false);
    expect(hasConditionalRules(null as any)).toBe(false);
    expect(hasConditionalRules(undefined as any)).toBe(false);
  });

  it("returns false for static fields with no conditions or visible flags", () => {
    const fields = [
      { id: "firstName", name: "firstName", type: "text" },
      { id: "lastName", name: "lastName", type: "text" },
    ];
    expect(hasConditionalRules(fields)).toBe(false);
  });

  it("returns true when top-level field has conditions", () => {
    const fields = [
      { id: "firstName", name: "firstName", type: "text" },
      {
        id: "taxId",
        name: "taxId",
        type: "text",
        conditions: [{ when: "isCorporate", is: true, then: "show" }],
      },
    ];
    expect(hasConditionalRules(fields)).toBe(true);
  });

  it("returns true when top-level field has meta.conditions", () => {
    const fields = [
      {
        id: "taxId",
        name: "taxId",
        type: "text",
        meta: { conditions: [{ when: "isCorporate", is: true, then: "show" }] },
      },
    ];
    expect(hasConditionalRules(fields)).toBe(true);
  });

  it("returns true when field has explicit visible flag", () => {
    const fields = [
      { id: "taxId", name: "taxId", type: "text", visible: false },
    ];
    expect(hasConditionalRules(fields)).toBe(true);
  });

  it("recursively detects conditions inside nested fields or children", () => {
    const section = [
      {
        id: "sec1",
        fields: [
          {
            id: "childField",
            name: "childField",
            type: "text",
            conditions: [{ when: "foo", is: "bar", then: "show" }],
          },
        ],
      },
    ];
    expect(hasConditionalRules(section)).toBe(true);
  });
});
