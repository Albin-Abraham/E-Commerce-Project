import { beforeEach, describe, expect, it, vi } from "vitest";

import { downloadCSV, generateCSV, generateCSVFast, parseCSV } from "../csv";

describe("parseCSV", () => {
  it("parses simple CSV", async () => {
    const content = "name,email\nJohn,john@test.com\nJane,jane@test.com";
    const file = new File([content], "test.csv", { type: "text/csv" });

    const result = await parseCSV(file);

    expect(result).toEqual([
      { name: "John", email: "john@test.com" },
      { name: "Jane", email: "jane@test.com" },
    ]);
  });

  it("skips empty lines", async () => {
    const content = "name,email\nJohn,john@test.com\n\nJane,jane@test.com\n";
    const file = new File([content], "test.csv", { type: "text/csv" });

    const result = await parseCSV(file);

    expect(result).toHaveLength(2);
  });

  it("handles quoted fields", async () => {
    const content =
      'name,description\nJohn,"Hello, World"\nJane,"Line1\nLine2"';
    const file = new File([content], "test.csv", { type: "text/csv" });

    const result = (await parseCSV(file)) as any[];

    expect((result[0] as any).description).toBe("Hello, World");
    expect((result[1] as any).description).toContain("Line1\nLine2");
  });
});

describe("generateCSV", () => {
  it("generates CSV from objects", async () => {
    const data = [
      { name: "John", email: "john@test.com" },
      { name: "Jane", email: "jane@test.com" },
    ];

    const csv = await generateCSV(data);

    expect(csv).toContain("name");
    expect(csv).toContain("email");
    expect(csv).toContain("John");
    expect(csv).toContain("jane@test.com");
  });

  it("generates CSV from simple array", async () => {
    // Papa.unparse does not support plain string arrays — use objects
    const data = [{ value: "a" }, { value: "b" }, { value: "c" }];
    const csv = await generateCSV(data);

    expect(csv).toContain("value");
    expect(csv).toContain("a");
    expect(csv).toContain("b");
    expect(csv).toContain("c");
  });

  it("handles empty array", async () => {
    const csv = await generateCSV([]);
    expect(csv).toBe("");
  });

  it("sanitizes CSV injection prefixes (=, +, -, @)", async () => {
    const data = [
      { name: "=SUM(A1:A10)", email: "test@test.com" },
      { name: "+cmd|'/C calc'!A0", email: "test2@test.com" },
      { name: "-1+1", email: "test3@test.com" },
      { name: "@SUM(A1:A10)", email: "test4@test.com" },
    ];

    const csv = await generateCSV(data);

    // Each dangerous value should be prefixed with a single quote
    expect(csv).toContain("'=SUM(A1:A10)");
    expect(csv).toContain("'+cmd|'/C calc'!A0");
    expect(csv).toContain("'-1+1");
    expect(csv).toContain("'@SUM(A1:A10)");
  });

  it("does not sanitize safe values", async () => {
    const data = [{ name: "John", amount: "100" }];
    const csv = await generateCSV(data);

    expect(csv).toContain("John");
    expect(csv).toContain("100");
    expect(csv).not.toContain("'John");
    expect(csv).not.toContain("'100");
  });

  // RFC 4180 compliance tests
  it("escapes fields containing commas by quoting", async () => {
    const data = [{ name: "Doe, John", email: "john@test.com" }];
    const csv = await generateCSV(data);

    // Field with comma should be quoted
    expect(csv).toContain('"Doe, John"');
  });

  it("escapes fields containing double quotes by doubling them", async () => {
    const data = [{ name: 'John "Johnny" Doe', email: "john@test.com" }];
    const csv = await generateCSV(data);

    // Double quotes should be escaped by doubling
    expect(csv).toContain('"John ""Johnny"" Doe"');
  });

  it("escapes fields containing newlines by quoting", async () => {
    const data = [{ name: "John\nDoe", email: "john@test.com" }];
    const csv = await generateCSV(data);

    // Newlines should be preserved within quoted field
    expect(csv).toContain("John\nDoe");
    expect(csv).toMatch(/"John[\s\S]*Doe"/);
  });

  it("preserves leading and trailing whitespace", async () => {
    const data = [{ name: "  John  ", email: "john@test.com" }];
    const csv = await generateCSV(data);

    // Whitespace should be preserved
    expect(csv).toContain("  John  ");
  });

  it("handles empty fields", async () => {
    const data = [{ name: "", email: "john@test.com" }];
    const csv = await generateCSV(data);

    // Empty field should be represented as empty quoted string or just empty
    expect(csv).toContain("john@test.com");
  });

  it("handles fields with only whitespace", async () => {
    const data = [{ name: "   ", email: "john@test.com" }];
    const csv = await generateCSV(data);

    // Whitespace-only field should be quoted
    expect(csv).toContain('"   "');
  });

  it("handles tab characters in fields", async () => {
    const data = [{ name: "John\tDoe", email: "john@test.com" }];
    const csv = await generateCSV(data);

    // Tab should be preserved
    expect(csv).toContain("John\tDoe");
  });

  it("escapes fields starting with space or tab", async () => {
    const data = [{ name: " John", email: "john@test.com" }];
    const csv = await generateCSV(data);

    // Leading space should be preserved (quoted)
    expect(csv).toContain(" John");
  });
});

describe("generateCSVFast", () => {
  it("generates CSV from data", async () => {
    const data = [{ name: "John" }, { name: "Jane" }];
    const csv = await generateCSVFast(data);

    expect(csv).toContain("name");
    expect(csv).toContain("John");
    expect(csv).toContain("Jane");
  });
});

describe("downloadCSV", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("creates and clicks download link", () => {
    const clickSpy = vi.fn();
    const appendChildSpy = vi
      .spyOn(document.body, "appendChild")
      .mockImplementation((node) => node);
    const removeChildSpy = vi
      .spyOn(document.body, "removeChild")
      .mockImplementation((node) => node);

    vi.spyOn(document, "createElement").mockImplementation(
      () =>
        ({
          setAttribute: vi.fn(),
          style: { visibility: "" },
          click: clickSpy,
        }) as unknown as HTMLAnchorElement
    );

    // URL.createObjectURL may not exist in jsdom — mock it on the prototype
    const originalCreateObjectURL = URL.createObjectURL;
    const originalRevokeObjectURL = URL.revokeObjectURL;
    URL.createObjectURL = vi.fn(() => "blob:http://localhost/test");
    URL.revokeObjectURL = vi.fn();

    try {
      downloadCSV("name,email\nJohn,john@test.com", "test.csv");

      expect(clickSpy).toHaveBeenCalled();
      expect(appendChildSpy).toHaveBeenCalled();
      expect(removeChildSpy).toHaveBeenCalled();
    } finally {
      URL.createObjectURL = originalCreateObjectURL;
      URL.revokeObjectURL = originalRevokeObjectURL;
    }
  });
});
