import { describe, expect, it, vi, beforeEach } from "vitest";
import { KeyboardDelegationStrategy } from "../strategies/KeyboardDelegationStrategy";
import { useEventRegistry } from "../stores/eventRegistry.store";

describe("KeyboardDelegationStrategy", () => {
  let strategy: KeyboardDelegationStrategy;

  beforeEach(() => {
    strategy = new KeyboardDelegationStrategy();
    useEventRegistry.setState({
      shortcuts: {},
      mouseActions: {},
      activeScope: "global",
    });
    document.body.innerHTML = "";
  });

  it("prevents default and executes command on global shortcut", () => {
    const mockExecute = vi.fn();
    useEventRegistry.getState().registerShortcut("test-search", {
      key: "ctrl+k",
      description: "Search",
      enabled: true,
      command: { execute: mockExecute },
    });

    const event = new KeyboardEvent("keydown", {
      key: "k",
      ctrlKey: true,
      cancelable: true,
    });
    const preventDefaultSpy = vi.spyOn(event, "preventDefault");
    const stopPropagationSpy = vi.spyOn(event, "stopPropagation");

    strategy.handle(event);

    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(stopPropagationSpy).toHaveBeenCalled();
    expect(mockExecute).toHaveBeenCalled();
  });

  it("prevents browser default when Ctrl+K is pressed inside an active input (double Ctrl+K scenario)", () => {
    const mockExecute = vi.fn();
    useEventRegistry.getState().registerShortcut("test-search", {
      key: "ctrl+k",
      description: "Search",
      enabled: true,
      command: { execute: mockExecute },
    });

    // Create and focus an input
    const input = document.createElement("input");
    document.body.appendChild(input);
    input.focus();

    expect(document.activeElement).toBe(input);

    const event = new KeyboardEvent("keydown", {
      key: "k",
      ctrlKey: true,
      cancelable: true,
    });
    const preventDefaultSpy = vi.spyOn(event, "preventDefault");
    const stopPropagationSpy = vi.spyOn(event, "stopPropagation");

    strategy.handle(event);

    // Modifier combinations must prevent browser default even when inside input
    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(stopPropagationSpy).toHaveBeenCalled();
    expect(mockExecute).toHaveBeenCalled();
  });

  it("suppresses single-character hotkeys when an input is focused to allow typing", () => {
    const mockExecute = vi.fn();
    useEventRegistry.getState().registerShortcut("single-char", {
      key: "s",
      description: "Save",
      enabled: true,
      command: { execute: mockExecute },
    });

    const input = document.createElement("input");
    document.body.appendChild(input);
    input.focus();

    const event = new KeyboardEvent("keydown", {
      key: "s",
      cancelable: true,
    });
    const preventDefaultSpy = vi.spyOn(event, "preventDefault");

    strategy.handle(event);

    // Regular character keys must NOT trigger shortcut or preventDefault in inputs
    expect(preventDefaultSpy).not.toHaveBeenCalled();
    expect(mockExecute).not.toHaveBeenCalled();
  });
});
