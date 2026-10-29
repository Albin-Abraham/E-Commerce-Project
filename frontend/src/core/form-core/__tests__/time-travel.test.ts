import { describe, expect, it, vi } from "vitest";
import { createTimeTravelStore, TimeTravelStore } from "../modules/time-travel";

describe("TimeTravelStore", () => {
  it("initializes with initial state as step 0", () => {
    const store = new TimeTravelStore({ name: "Alice" });
    expect(store.length).toBe(1);
    expect(store.currentIndex).toBe(0);
    expect(store.currentSnapshot?.values).toEqual({ name: "Alice" });
    expect(store.canUndo).toBe(false);
    expect(store.canRedo).toBe(false);
  });

  it("records mutations, supports undo and redo", () => {
    const store = createTimeTravelStore({ count: 0 });

    store.record({ count: 1 }, "INCREMENT");
    store.record({ count: 2 }, "INCREMENT");
    expect(store.length).toBe(3);
    expect(store.canUndo).toBe(true);
    expect(store.canRedo).toBe(false);

    // Undo to count: 1
    const prev = store.undo();
    expect(prev).toEqual({ count: 1 });
    expect(store.canRedo).toBe(true);

    // Undo to count: 0
    const initial = store.undo();
    expect(initial).toEqual({ count: 0 });
    expect(store.canUndo).toBe(false);

    // Redo to count: 1
    const redone = store.redo();
    expect(redone).toEqual({ count: 1 });

    // Mutate from branch: should truncate future
    store.record({ count: 10 }, "JUMP_BRANCH");
    expect(store.length).toBe(3); // [0, 1, 10]
    expect(store.canRedo).toBe(false);
    expect(store.currentSnapshot?.values).toEqual({ count: 10 });
  });

  it("notifies subscribers and exports history telemetry", () => {
    const store = createTimeTravelStore({ active: false });
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);

    store.record({ active: true }, "TOGGLE");
    expect(listener).toHaveBeenCalledTimes(1);

    const json = store.exportHistory();
    const parsed = JSON.parse(json);
    expect(parsed.totalSnapshots).toBe(2);
    expect(parsed.history[1].action).toBe("TOGGLE");

    unsubscribe();
    store.record({ active: false }, "TOGGLE_OFF");
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
