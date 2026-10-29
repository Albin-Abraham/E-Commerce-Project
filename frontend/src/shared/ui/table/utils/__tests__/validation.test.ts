import { describe, expect, it } from "vitest";

import {
  type ExportValidationRule,
  type ImportFileValidationRules,
  validateCSVHeaders,
  validateExportData,
  validateImportFile,
} from "../validation";

describe("validateExportData", () => {
  it("passes valid data", () => {
    const rows = [{ name: "John", email: "john@test.com", age: "30" }];
    const rules: ExportValidationRule[] = [
      { column: "name", required: true },
      { column: "email", required: true, type: "email" },
      { column: "age", type: "number" },
    ];

    const result = validateExportData(rows, rules);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("catches required field", () => {
    const rows = [{ name: "", email: "john@test.com" }];
    const rules: ExportValidationRule[] = [{ column: "name", required: true }];

    const result = validateExportData(rows, rules);

    expect(result.valid).toBe(false);
    expect(result.errors[0].message).toContain("required");
  });

  it("catches invalid email", () => {
    const rows = [{ email: "not-an-email" }];
    const rules: ExportValidationRule[] = [{ column: "email", type: "email" }];

    const result = validateExportData(rows, rules);

    expect(result.valid).toBe(false);
    expect(result.errors[0].message).toContain("email");
  });

  it("catches invalid number", () => {
    const rows = [{ age: "abc" }];
    const rules: ExportValidationRule[] = [{ column: "age", type: "number" }];

    const result = validateExportData(rows, rules);

    expect(result.valid).toBe(false);
    expect(result.errors[0].message).toContain("number");
  });

  it("catches invalid date", () => {
    const rows = [{ date: "not-a-date" }];
    const rules: ExportValidationRule[] = [{ column: "date", type: "date" }];

    const result = validateExportData(rows, rules);

    expect(result.valid).toBe(false);
  });

  it("catches min length", () => {
    const rows = [{ code: "AB" }];
    const rules: ExportValidationRule[] = [{ column: "code", minLength: 3 }];

    const result = validateExportData(rows, rules);

    expect(result.valid).toBe(false);
    expect(result.errors[0].message).toContain("Minimum");
  });

  it("catches max length", () => {
    const rows = [{ name: "VeryLongName" }];
    const rules: ExportValidationRule[] = [{ column: "name", maxLength: 5 }];

    const result = validateExportData(rows, rules);

    expect(result.valid).toBe(false);
    expect(result.errors[0].message).toContain("Maximum");
  });

  it("catches pattern mismatch", () => {
    const rows = [{ code: "XYZ" }];
    const rules: ExportValidationRule[] = [
      { column: "code", pattern: /^[A-Z]{2}$/ },
    ];

    const result = validateExportData(rows, rules);

    expect(result.valid).toBe(false);
    expect(result.errors[0].message).toContain("pattern");
  });

  it("calls custom validator", () => {
    const rows = [{ value: "bad" }];
    const rules: ExportValidationRule[] = [
      {
        column: "value",
        validate: (v) => (v === "bad" ? "Value is bad" : null),
      },
    ];

    const result = validateExportData(rows, rules);

    expect(result.valid).toBe(false);
    expect(result.errors[0].message).toBe("Value is bad");
  });

  it("skips empty values when not required", () => {
    const rows = [{ name: "" }];
    const rules: ExportValidationRule[] = [{ column: "name", type: "email" }];

    const result = validateExportData(rows, rules);

    expect(result.valid).toBe(true);
  });

  it("respects maxErrors limit", () => {
    const rows = Array.from({ length: 200 }, () => ({ name: "" }));
    const rules: ExportValidationRule[] = [{ column: "name", required: true }];

    const result = validateExportData(rows, rules, 50);

    expect(result.errors).toHaveLength(50);
  });
});

describe("validateImportFile", () => {
  it("validates correct file", () => {
    const file = new File(["data"], "data.csv", { type: "text/csv" });
    const rules: ImportFileValidationRules = {
      allowedExtensions: [".csv"],
      maxFileSize: 1024,
    };

    const result = validateImportFile(file, rules);

    expect(result.valid).toBe(true);
  });

  it("rejects invalid extension", () => {
    const file = new File(["data"], "data.pdf", { type: "application/pdf" });
    const rules: ImportFileValidationRules = {
      allowedExtensions: [".csv", ".xlsx"],
    };

    const result = validateImportFile(file, rules);

    expect(result.valid).toBe(false);
    expect(result.errors[0].code).toBe("INVALID_EXTENSION");
  });

  it("rejects file exceeding max size", () => {
    const bigContent = "x".repeat(2000);
    const file = new File([bigContent], "data.csv", { type: "text/csv" });
    const rules: ImportFileValidationRules = {
      maxFileSize: 100,
    };

    const result = validateImportFile(file, rules);

    expect(result.valid).toBe(false);
    expect(result.errors[0].code).toBe("FILE_TOO_LARGE");
  });

  it("rejects empty file", () => {
    const file = new File([], "empty.csv", { type: "text/csv" });
    const rules: ImportFileValidationRules = {
      minFileSize: 1,
    };

    const result = validateImportFile(file, rules);

    expect(result.valid).toBe(false);
    expect(result.errors[0].code).toBe("FILE_TOO_SMALL");
  });

  it("uses default extensions when none provided", () => {
    const file = new File(["data"], "data.csv", { type: "text/csv" });

    const result = validateImportFile(file, {});

    expect(result.valid).toBe(true);
  });

  it("returns multiple errors for multiple violations", () => {
    const file = new File([], "data.pdf", { type: "application/pdf" });
    const rules: ImportFileValidationRules = {
      allowedExtensions: [".csv"],
      maxFileSize: 100,
    };

    const result = validateImportFile(file, rules);

    expect(result.errors.length).toBeGreaterThanOrEqual(2);
  });
});

describe("validateCSVHeaders", () => {
  it("passes when all headers present", () => {
    const result = validateCSVHeaders(
      ["name", "email", "phone"],
      ["name", "email"]
    );

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("catches missing headers", () => {
    const result = validateCSVHeaders(["name"], ["name", "email", "phone"]);

    expect(result.valid).toBe(false);
    expect(result.errors[0].code).toBe("MISSING_HEADERS");
    expect(result.errors[0].value).toEqual(["email", "phone"]);
  });

  it("passes when required is empty", () => {
    const result = validateCSVHeaders(["name"], []);

    expect(result.valid).toBe(true);
  });
});
