import { describe, it, expect, vi, beforeEach } from "vitest";
import { FormCore } from "../engine";
import {
  FormPersistenceManager,
  MemoryStorageAdapter,
  SessionStorageAdapter,
  LocalStorageAdapter,
} from "../modules/persistence-manager";
import type { FormDefinition } from "../domain";

describe("State Persistence & Field Lifecycle Engine", () => {
  describe("Storage Adapters", () => {
    it("MemoryStorageAdapter sets, gets, and removes items", async () => {
      const adapter = new MemoryStorageAdapter();
      expect(await adapter.getItem("draft")).toBeNull();

      await adapter.setItem("draft", JSON.stringify({ a: 1 }));
      expect(await adapter.getItem("draft")).toBe(JSON.stringify({ a: 1 }));

      await adapter.removeItem("draft");
      expect(await adapter.getItem("draft")).toBeNull();
    });

    it("SessionStorageAdapter and LocalStorageAdapter handle missing window/storage gracefully", async () => {
      const session = new SessionStorageAdapter();
      const local = new LocalStorageAdapter();

      expect(await session.getItem("key")).toBeNull();
      expect(await local.getItem("key")).toBeNull();

      // Setting items when window is mocked or available doesn't throw
      expect(() => session.setItem("key", "val")).not.toThrow();
      expect(() => local.setItem("key", "val")).not.toThrow();
    });
  });

  describe("FormPersistenceManager Draft Lifecycle", () => {
    let mockStorage: MemoryStorageAdapter;

    beforeEach(() => {
      mockStorage = new MemoryStorageAdapter();
    });

    it("persists draft on save and restores values into form state", async () => {
      const def: FormDefinition = {
        id: "draft-form",
        sections: [
          {
            id: "s1",
            fields: [
              { id: "username", name: "username", type: "text", label: "Username" },
              { id: "email", name: "email", type: "email", label: "Email" },
            ],
          },
        ],
      };

      const form = new FormCore(
        def,
        {},
        {
          persistence: {
            key: "draft_test_1",
            storage: mockStorage,
            debounceMs: 10,
          },
        }
      );

      await form.setValue("username", "johndoe");
      await form.setValue("email", "john@example.com");

      // Save draft immediately
      await form.saveDraft();

      const storedRaw = await mockStorage.getItem("draft_test_1");
      expect(storedRaw).not.toBeNull();
      const stored = JSON.parse(storedRaw!);
      expect(stored.values.username).toBe("johndoe");
      expect(stored.values.email).toBe("john@example.com");

      // Create new fresh form instance and restore from storage
      const freshForm = new FormCore(
        def,
        {},
        {
          persistence: {
            key: "draft_test_1",
            storage: mockStorage,
            autoRestore: false,
          },
        }
      );

      expect(freshForm.getValue("username")).toBeNull();
      const restored = await freshForm.restoreDraft();
      expect(restored).toBe(true);
      expect(freshForm.getValue("username")).toBe("johndoe");
      expect(freshForm.getValue("email")).toBe("john@example.com");
    });

    it("filters sensitive fields via excludeFields and respects includeFields", async () => {
      const def: FormDefinition = {
        id: "secure-form",
        sections: [
          {
            id: "s1",
            fields: [
              { id: "account", name: "account", type: "text", label: "Account" },
              { id: "password", name: "password", type: "password", label: "Password" },
              { id: "ssn", name: "ssn", type: "text", label: "SSN" },
            ],
          },
        ],
      };

      const form = new FormCore(
        def,
        {},
        {
          persistence: {
            key: "secure_draft",
            storage: mockStorage,
            excludeFields: ["password", "ssn"],
          },
        }
      );

      await form.setValue("account", "AC-12345");
      await form.setValue("password", "superSecret!");
      await form.setValue("ssn", "000-12-3456");

      await form.saveDraft();

      const storedRaw = await mockStorage.getItem("secure_draft");
      const stored = JSON.parse(storedRaw!);

      expect(stored.values.account).toBe("AC-12345");
      expect(stored.values.password).toBeUndefined();
      expect(stored.values.ssn).toBeUndefined();
    });

    it("rejects stale drafts when schema version mismatches", async () => {
      // Seed a draft with version 1.0.0
      await mockStorage.setItem(
        "versioned_draft",
        JSON.stringify({
          version: "1.0.0",
          timestamp: Date.now(),
          values: { fieldA: "old_val" },
        })
      );

      const def: FormDefinition = {
        id: "versioned-form",
        sections: [
          {
            id: "s1",
            fields: [{ id: "fieldA", name: "fieldA", type: "text", label: "A" }],
          },
        ],
      };

      const form = new FormCore(
        def,
        {},
        {
          persistence: {
            key: "versioned_draft",
            storage: mockStorage,
            version: "2.0.0", // Expecting version 2.0.0
            autoRestore: false,
          },
        }
      );

      const restored = await form.restoreDraft();
      expect(restored).toBe(false);
      expect(form.getValue("fieldA")).toBeNull();
    });

    it("clears draft storage on successful submit", async () => {
      const def: FormDefinition = {
        id: "submit-form",
        sections: [
          {
            id: "s1",
            fields: [
              { id: "name", name: "name", type: "text", label: "Name" },
            ],
          },
        ],
      };

      const form = new FormCore(
        def,
        {},
        {
          persistence: {
            key: "clear_on_submit_draft",
            storage: mockStorage,
            clearOnSubmit: true,
          },
        }
      );

      await form.setValue("name", "Alice");
      await form.saveDraft();
      expect(await mockStorage.getItem("clear_on_submit_draft")).not.toBeNull();

      // Submit valid form
      const submitted = await form.submit();
      expect(submitted).toBe(true);

      // Draft must be wiped
      expect(await mockStorage.getItem("clear_on_submit_draft")).toBeNull();
    });
  });

  describe("Field Vitality Pinning", () => {
    it("preserves state slices for pinned fields when row state is deregistered", () => {
      const def: FormDefinition = {
        id: "pin-form",
        sections: [
          {
            id: "s1",
            fields: [
              { id: "row1_colA", name: "row1_colA", type: "text", label: "Col A" },
            ],
          },
        ],
      };

      const form = new FormCore(def);
      form.stateManager.registerRowState("row1_colA", "initial");

      // Pin the field
      form.pinField("row1_colA", true);
      expect(form.stateManager.isFieldPinned("row1_colA")).toBe(true);

      // Try to deregister row state (simulating component unmount)
      form.stateManager.deregisterRowState("row1_colA");

      // State slices must still be alive because it is pinned
      expect(form.stateManager.state.vitality["row1_colA"]).toBeDefined();
      expect(form.stateManager.state.validity["row1_colA"]).toBeDefined();

      // Unpin and deregister again
      form.pinField("row1_colA", false);
      form.stateManager.deregisterRowState("row1_colA");

      // Now it must be purged
      expect(form.stateManager.state.vitality["row1_colA"]).toBeUndefined();
      expect(form.stateManager.state.validity["row1_colA"]).toBeUndefined();
    });
  });

  describe("Visibility Behavior Invariants (purge | preserve | suspend)", () => {
    it("enforces purge: nulls value and clears errors when hidden", async () => {
      const def: FormDefinition = {
        id: "vis-form",
        sections: [
          {
            id: "s1",
            fields: [
              { id: "showExtra", name: "showExtra", type: "checkbox", label: "Show Extra" },
              {
                id: "extra",
                name: "extra",
                type: "text",
                label: "Extra",
                visibilityBehavior: "purge",
                visible: { expression: "{{showExtra}} === true" },
              },
            ],
          },
        ],
      };

      const form = new FormCore(def, { showExtra: true, extra: "important data" });

      // Initially visible
      expect(form.visibility["extra"]).toBe(true);
      expect(form.getValue("extra")).toBe("important data");

      // Toggle showExtra to false -> hides extra
      await form.setValue("showExtra", false);

      expect(form.visibility["extra"]).toBe(false);
      // Value should be purged to null
      expect(form.getValue("extra")).toBeNull();
    });

    it("enforces preserve: retains value in state when hidden", async () => {
      const def: FormDefinition = {
        id: "vis-preserve-form",
        sections: [
          {
            id: "s1",
            fields: [
              { id: "showExtra", name: "showExtra", type: "checkbox", label: "Show Extra" },
              {
                id: "extra",
                name: "extra",
                type: "text",
                label: "Extra",
                visibilityBehavior: "preserve",
                visible: { expression: "{{showExtra}} === true" },
              },
            ],
          },
        ],
      };

      const form = new FormCore(def, { showExtra: true, extra: "saved value" });

      expect(form.visibility["extra"]).toBe(true);

      // Hide the field
      await form.setValue("showExtra", false);

      expect(form.visibility["extra"]).toBe(false);
      // Value is preserved!
      expect(form.getValue("extra")).toBe("saved value");
    });
  });
});
