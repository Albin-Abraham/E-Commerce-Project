import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { TableColumnMeta, TableMeta } from "../../types";
import {
  validateColumns,
  validateMeta,
  validateSource,
  validateTableConfig,
} from "../validateConfig";

describe("validateConfig", () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  describe("validateMeta", () => {
    it("warns when meta.id is missing", () => {
      validateMeta({} as TableMeta);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("meta.id is required")
      );
    });

    it("warns on unknown feature flag keys", () => {
      validateMeta({
        id: "test",
        features: { paginaton: true } as any, // typo
      });
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Unknown feature flag "paginaton"')
      );
    });

    it("warns on unknown top-level meta keys", () => {
      validateMeta({
        id: "test",
        stripd: true as any, // typo
      });
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Unknown meta key "stripd"')
      );
    });

    it("does not warn for urlSync", () => {
      validateMeta({
        id: "test",
        features: { urlSync: true },
      });
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it("warns on retired flags like serverExport", () => {
      validateMeta({
        id: "test",
        features: { serverExport: true } as any,
      });
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Feature flag "serverExport" is not wired')
      );
    });

    it("warns on removed flags like virtualization", () => {
      validateMeta({
        id: "test",
        features: { virtualization: true } as any,
      });
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Unknown feature flag "virtualization"')
      );
    });
  });

  describe("validateSource", () => {
    it("warns when source is not an object", () => {
      validateSource(null as any);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("source must be an object")
      );
    });

    it("warns when server source is missing fetcher", () => {
      validateSource({ type: "server" } as any);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("source.fetcher is missing")
      );
    });

    it("warns when client source data is not an array", () => {
      validateSource({ type: "client", data: "not-array" } as any);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("source.data is not an array")
      );
    });

    it("warns on unknown source type", () => {
      validateSource({ type: "websocket" } as any);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Unknown source.type "websocket"')
      );
    });

    it("does not warn for valid client source", () => {
      validateSource({ type: "client", data: [] });
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it("does not warn for valid server source", () => {
      validateSource({ type: "server", fetcher: vi.fn() } as any);
      expect(warnSpy).not.toHaveBeenCalled();
    });
  });

  describe("validateColumns", () => {
    it("warns when columns is empty", () => {
      validateColumns([]);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("columns array is empty")
      );
    });

    it("warns on duplicate column ids", () => {
      validateColumns([
        { id: "name", label: "Name" },
        { id: "name", label: "Name 2" },
      ] as TableColumnMeta[]);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Duplicate column id "name"')
      );
    });

    it("does not warn for valid columns", () => {
      validateColumns([
        { id: "name", label: "Name" },
        { id: "email", label: "Email" },
      ] as TableColumnMeta[]);
      expect(warnSpy).not.toHaveBeenCalled();
    });
  });

  describe("validateTableConfig", () => {
    it("runs all validations", () => {
      validateTableConfig({
        meta: {} as TableMeta,
        source: { type: "server" } as any,
        columns: [],
      });
      // Should have warnings from all three validators
      expect(warnSpy).toHaveBeenCalled();
    });

    it("does nothing when no config provided", () => {
      validateTableConfig({});
      expect(warnSpy).not.toHaveBeenCalled();
    });
  });
});
