import { describe, expect, it } from "vitest";
import { FormCore } from "../engine";
import { StateManager } from "../modules/state-manager";
import { RepeaterRowFactory } from "../modules/repeater-factory";
import type { FormDefinition } from "../domain";

describe("Array Identity & Reordering Safety (10/10 Enterprise Requirement)", () => {
  const emptyNormalizedDef = { fields: {}, renderNodes: {} } as any;

  describe("RepeaterRowFactory Identity Logic", () => {
    it("should return existing business ID if present", () => {
      const stateManager = new StateManager(emptyNormalizedDef, {});
      const factory = new RepeaterRowFactory(stateManager);

      const row = { id: "item-101", name: "Laptop" };
      const rowId = factory.getOrAssignRowId(row, "id");
      expect(rowId).toBe("item-101");
    });

    it("should auto-generate and assign non-enumerable _rowId if business ID is absent", () => {
      const stateManager = new StateManager(emptyNormalizedDef, {});
      const factory = new RepeaterRowFactory(stateManager);

      const row: Record<string, any> = { name: "Mouse" };
      const rowId = factory.getOrAssignRowId(row);

      expect(rowId).toMatch(/^row_\d+_[a-z0-9]+$/);
      expect(row._rowId).toBe(rowId);

      // Crucial: _rowId MUST be non-enumerable to prevent backend JSON payload pollution
      expect(Object.keys(row)).toEqual(["name"]);
      const serialized = JSON.stringify(row);
      expect(serialized).toBe('{"name":"Mouse"}');
      expect(serialized).not.toContain("_rowId");
    });

    it("should handle frozen objects gracefully without throwing", () => {
      const stateManager = new StateManager(emptyNormalizedDef, {});
      const factory = new RepeaterRowFactory(stateManager);

      const frozenRow = Object.freeze({ name: "Immutable Row" });
      let rowId = "";
      expect(() => {
        rowId = factory.getOrAssignRowId(frozenRow);
      }).not.toThrow();

      expect(rowId).toMatch(/^row_\d+_[a-z0-9]+$/);
      // Repeated call should retrieve stable cached ID from WeakMap
      expect(factory.getOrAssignRowId(frozenRow)).toBe(rowId);
    });

    it("should resolve identity state keys by default", () => {
      const stateManager = new StateManager(emptyNormalizedDef, {});
      const factory = new RepeaterRowFactory(stateManager);

      const row = { id: "row-42", name: "Monitor" };
      const stateKey = factory.resolveStateKey("items", 0, row, undefined, "name");
      expect(stateKey).toBe("items__row-42__name");
    });

    it("should fallback to positional keys if explicitly configured", () => {
      const stateManager = new StateManager(emptyNormalizedDef, {});
      const factory = new RepeaterRowFactory(stateManager);

      const row = { id: "row-42", name: "Monitor" };
      const stateKey = factory.resolveStateKey(
        "items",
        2,
        row,
        { rowStateStrategy: "index" },
        "name"
      );
      expect(stateKey).toBe("items[2].name");
    });
  });

  describe("StateManager Array Mutations", () => {
    it("should append rows with stable _rowId and notify subscribers", () => {
      const stateManager = new StateManager<{ items: any[] }>(emptyNormalizedDef, { items: [] });
      let notifications = 0;
      stateManager.subscribe(() => notifications++);

      const rowId1 = stateManager.appendRow("items", { name: "First" });
      const rowId2 = stateManager.appendRow("items", { name: "Second" });

      expect(stateManager.state.values.items.length).toBe(2);
      expect(stateManager.state.values.items[0].name).toBe("First");
      expect(stateManager.state.values.items[0]._rowId).toBe(rowId1);
      expect(stateManager.state.values.items[1].name).toBe("Second");
      expect(stateManager.state.values.items[1]._rowId).toBe(rowId2);
      expect(notifications).toBe(2);
    });

    it("should remove rows by index and clean up state slices for that row only", () => {
      const stateManager = new StateManager<{ items: any[] }>(emptyNormalizedDef, { items: [] });
      const rowId0 = stateManager.appendRow("items", { name: "Row 0" });
      const rowId1 = stateManager.appendRow("items", { name: "Row 1" });
      const rowId2 = stateManager.appendRow("items", { name: "Row 2" });

      // Seed 5V slices for each row
      stateManager.state.validity[`items__${rowId0}__name`] = {
        valid: false,
        errors: [{ message: "Error 0", code: "err" }],
      };
      stateManager.state.validity[`items__${rowId1}__name`] = {
        valid: false,
        errors: [{ message: "Error 1", code: "err" }],
      };
      stateManager.state.validity[`items__${rowId2}__name`] = {
        valid: false,
        errors: [{ message: "Error 2", code: "err" }],
      };

      // Remove row 0
      stateManager.removeRow("items", 0);

      // Values array should now have 2 rows
      expect(stateManager.state.values.items.length).toBe(2);
      expect(stateManager.state.values.items[0].name).toBe("Row 1");
      expect(stateManager.state.values.items[1].name).toBe("Row 2");

      // Row 0 slices must be cleaned up
      expect(stateManager.state.validity[`items__${rowId0}__name`]).toBeUndefined();

      // Row 1 and Row 2 slices must be preserved without corruption or index-shifting!
      expect(stateManager.state.validity[`items__${rowId1}__name`]?.errors[0]?.message).toBe("Error 1");
      expect(stateManager.state.validity[`items__${rowId2}__name`]?.errors[0]?.message).toBe("Error 2");
    });

    it("should remove rows by rowId directly", () => {
      const stateManager = new StateManager<{ items: any[] }>(emptyNormalizedDef, { items: [] });
      const rowId0 = stateManager.appendRow("items", { name: "Alpha" });
      const rowId1 = stateManager.appendRow("items", { name: "Beta" });

      stateManager.removeRow("items", rowId0);
      expect(stateManager.state.values.items.length).toBe(1);
      expect(stateManager.state.values.items[0].name).toBe("Beta");
    });

    it("should reorder rows via moveRow without modifying row identity or state slices", () => {
      const stateManager = new StateManager<{ items: any[] }>(emptyNormalizedDef, { items: [] });
      const rowId0 = stateManager.appendRow("items", { name: "First" });
      const rowId1 = stateManager.appendRow("items", { name: "Second" });
      const rowId2 = stateManager.appendRow("items", { name: "Third" });

      // Seed validity on row 0
      stateManager.state.validity[`items__${rowId0}__name`] = {
        valid: false,
        errors: [{ message: "Error on First", code: "err" }],
      };

      // Move First (index 0) to index 2
      stateManager.moveRow("items", 0, 2);

      const items = stateManager.state.values.items;
      expect(items.map((i) => i.name)).toEqual(["Second", "Third", "First"]);
      expect(items[2]._rowId).toBe(rowId0);

      // State slice for rowId0 remains intact and securely bound to its rowId
      expect(stateManager.state.validity[`items__${rowId0}__name`]?.errors[0]?.message).toBe(
        "Error on First"
      );
    });
  });

  describe("FormCore End-to-End Array Operations", () => {
    const repeaterDef: FormDefinition = {
      id: "orders-form",
      title: "Order Form",
      sections: [
        {
          id: "section_items",
          title: "Order Items",
          fields: [
            {
              id: "items",
              name: "items",
              type: "repeater",
              label: "Items",
              fields: [
                {
                  id: "sku",
                  name: "sku",
                  type: "text",
                  label: "SKU",
                  required: true,
                },
                {
                  id: "qty",
                  name: "qty",
                  type: "number",
                  label: "Quantity",
                },
              ],
            },
          ],
        },
      ],
    };

    it("should integrate appendRow, removeRow, moveRow on FormCore instance", () => {
      const form = new FormCore<{ items: Array<{ sku: string; qty: number }> }>(repeaterDef, {
        items: [],
      });

      const rowA = form.appendRow("items", { sku: "SKU-A", qty: 10 });
      const rowB = form.appendRow("items", { sku: "SKU-B", qty: 20 });
      const rowC = form.appendRow("items", { sku: "SKU-C", qty: 30 });

      expect(form.values.items.length).toBe(3);

      // Set vitality and errors on rowB
      form.setError(`items__${rowB}__sku`, { code: "custom", message: "Invalid SKU-B" });
      form.setVitality(`items__${rowB}__sku`, { dirty: true, touched: true });

      // Delete rowA (index 0)
      form.removeRow("items", 0);

      expect(form.values.items.length).toBe(2);
      expect(form.values.items[0].sku).toBe("SKU-B");
      expect(form.values.items[1].sku).toBe("SKU-C");

      // Verify rowB's error and vitality survive intact!
      const rowBValidity = form.validity[`items__${rowB}__sku`];
      expect(rowBValidity).toBeDefined();
      expect(rowBValidity?.errors[0]?.message).toBe("Invalid SKU-B");

      const rowBVitality = form.vitality[`items__${rowB}__sku`];
      expect(rowBVitality?.dirty).toBe(true);
      expect(rowBVitality?.touched).toBe(true);

      // Reorder: Move rowB (index 0) to index 1
      form.moveRow("items", 0, 1);
      expect(form.values.items[0].sku).toBe("SKU-C");
      expect(form.values.items[1].sku).toBe("SKU-B");

      // rowB's state is still completely intact after reordering
      expect(form.validity[`items__${rowB}__sku`]?.errors[0]?.message).toBe("Invalid SKU-B");

      // Serialization check: Ensure clean JSON payload without _rowId
      const payload = JSON.stringify(form.values);
      expect(payload).not.toContain("_rowId");
      expect(JSON.parse(payload)).toEqual({
        items: [
          { sku: "SKU-C", qty: 30 },
          { sku: "SKU-B", qty: 20 },
        ],
      });
    });
  });
});
