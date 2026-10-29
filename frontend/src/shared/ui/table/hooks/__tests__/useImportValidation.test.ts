import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useImportValidation } from "../../hooks/useImportValidation";

function createFile(
  name: string,
  size: number,
  type: string = "text/csv"
): File {
  const content = "a".repeat(size);
  return new File([content], name, { type });
}

function createCSVFile(
  name: string,
  headers: string[],
  rows: number = 1
): File {
  const headerLine = headers.join(",");
  const dataLines = Array.from({ length: rows }, (_, i) =>
    headers.map(() => `val${i}`).join(",")
  );
  const content = [headerLine, ...dataLines].join("\n");
  return new File([content], name, { type: "text/csv" });
}

describe("useImportValidation", () => {
  it("validates correct file", async () => {
    const { result } = renderHook(() =>
      useImportValidation({
        allowedExtensions: [".csv", ".xlsx"],
        maxFileSize: 1024,
      })
    );

    const file = createCSVFile("data.csv", ["name", "email"]);
    const validation = await result.current.validateFile(file);

    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);
    expect(result.current.isValid).toBe(true);
  });

  it("rejects invalid extension", async () => {
    const { result } = renderHook(() =>
      useImportValidation({
        allowedExtensions: [".csv", ".xlsx"],
      })
    );

    const file = createFile("data.pdf", 100, "application/pdf");
    let validation: Awaited<ReturnType<typeof result.current.validateFile>>;
    await act(async () => {
      validation = await result.current.validateFile(file);
    });

    expect(validation!.valid).toBe(false);
    expect(validation!.errors[0].code).toBe("INVALID_EXTENSION");
    expect(result.current.isValid).toBe(false);
  });

  it("rejects file exceeding max size", async () => {
    const { result } = renderHook(() =>
      useImportValidation({
        maxFileSize: 100,
      })
    );

    // Make file larger than 100 bytes
    const bigContent = "x".repeat(200);
    const bigFile = new File([bigContent], "data.csv", { type: "text/csv" });

    const validation = await result.current.validateFile(bigFile);

    expect(validation.valid).toBe(false);
    expect(validation.errors[0].code).toBe("FILE_TOO_LARGE");
  });

  it("rejects empty file", async () => {
    const { result } = renderHook(() =>
      useImportValidation({
        minFileSize: 1,
      })
    );

    const file = new File([], "empty.csv", { type: "text/csv" });
    const validation = await result.current.validateFile(file);

    expect(validation.valid).toBe(false);
    expect(validation.errors[0].code).toBe("FILE_TOO_SMALL");
  });

  it("validates CSV headers when requiredHeaders provided", async () => {
    const { result } = renderHook(() =>
      useImportValidation({
        allowedExtensions: [".csv"],
        requiredHeaders: ["name", "email", "phone"],
      })
    );

    const file = createCSVFile("data.csv", ["name", "email"]);
    const validation = await result.current.validateFile(file);

    expect(validation.valid).toBe(false);
    expect(validation.errors[0].code).toBe("MISSING_HEADERS");
    expect(validation.errors[0].value).toEqual(["phone"]);
  });

  it("passes when all required headers present", async () => {
    const { result } = renderHook(() =>
      useImportValidation({
        allowedExtensions: [".csv"],
        requiredHeaders: ["name", "email"],
      })
    );

    const file = createCSVFile("data.csv", ["name", "email", "phone"]);
    const validation = await result.current.validateFile(file);

    expect(validation.valid).toBe(true);
  });

  it("clearErrors resets errors", async () => {
    const { result } = renderHook(() =>
      useImportValidation({
        allowedExtensions: [".csv"],
      })
    );

    const file = createFile("data.pdf", 100, "application/pdf");
    await act(async () => {
      await result.current.validateFile(file);
    });

    expect(result.current.errors.length).toBeGreaterThan(0);

    act(() => {
      result.current.clearErrors();
    });

    expect(result.current.errors).toHaveLength(0);
    expect(result.current.isValid).toBe(true);
  });

  it("defaults to csv/xlsx/xls extensions", async () => {
    const { result } = renderHook(() => useImportValidation());

    const csvFile = createCSVFile("data.csv", ["name"]);
    const xlsxFile = createFile(
      "data.xlsx",
      100,
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    const pdfFile = createFile("data.pdf", 100, "application/pdf");

    const csvResult = await result.current.validateFile(csvFile);
    const xlsxResult = await result.current.validateFile(xlsxFile);
    const pdfResult = await result.current.validateFile(pdfFile);

    expect(csvResult.valid).toBe(true);
    expect(xlsxResult.valid).toBe(true);
    expect(pdfResult.valid).toBe(false);
  });
});
