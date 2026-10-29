import { FormStyleDebugger } from "@ui/form/tools/FormStyleDebugger";
import { describe, expect, it } from "vitest";

import { StyleDriver } from "../drivers/StyleDriver";
import { renderWithProviders } from "../test-utils";

describe("Developer Tools: Style Debugger", () => {
  it("should render a complete style trace for an input field", async () => {
    const field = {
      id: "f1",
      type: "text",
      name: "test",
      label: "Test",
      properties: {
        intent: "primary",
        customClasses: "mb-4 border-dashed",
      },
      meta: {},
    } as any;

    const { container } = renderWithProviders(
      <div className="p-4">
        <FormStyleDebugger field={field} />
      </div>
    );

    const styleDriver = new StyleDriver(container);

    // 1. Verify Trace Header
    const header = container.querySelector("span");
    expect(header?.textContent).toContain("Style Trace: f1");

    // 2. Verify Source Mapping (Base)
    await styleDriver.expectStyleTrace("f1", "base", "form-field");

    // 3. Verify Intent Injection
    await styleDriver.expectStyleTrace("f1", "intent", "text-primary");

    // 4. Verify Heuristic Distribution
    await styleDriver.expectStyleTrace("f1", "heuristic", "mb-4");
    await styleDriver.expectStyleTrace("f1", "heuristic", "border-dashed");
  });

  it("should show density indicators correctly in the trace", async () => {
    const field = {
      id: "f1",
      type: "text",
      name: "test",
      label: "Test",
    } as any;

    // Render with Compact Density via Provider
    const { container: compactContainer } = renderWithProviders(
      <FormStyleDebugger field={field} />,
      { themeProps: { density: "compact" } }
    );

    expect(compactContainer.textContent).toContain("Density:Compact");

    // Render with Spacy Density
    const { container: normalContainer } = renderWithProviders(
      <FormStyleDebugger field={field} />,
      { themeProps: { density: "comfortable" } }
    );

    expect(normalContainer.textContent).toContain("Density:Normal");
  });

  it("should toggle FormDevTools visibility when PlatformCommand.ToggleFormDevTools is emitted", async () => {
    const { FormDevTools } = await import("@ui/form/tools/FormDevTools");
    const { FormCore } = await import("@form-core/engine");
    const { commandBus } = await import("@core/events/CommandBus");
    const { PlatformCommand } = await import("@core/events/config/shortcuts");
    const { act } = await import("react");

    const form = new FormCore({
      id: "test-form",
      title: "Test Form",
      fields: [{ id: "name", name: "name", type: "text", label: "Name" }],
    });

    const { container } = renderWithProviders(<FormDevTools form={form} open={false} />);

    // Initially closed (trigger button is visible)
    expect(container.querySelector("button")).toBeTruthy();
    expect(container.textContent).not.toContain("Values");

    // Emit ToggleFormDevTools via CommandBus
    act(() => {
      commandBus.emit(PlatformCommand.ToggleFormDevTools);
    });

    // Now open and displaying Form State tabs
    expect(container.textContent).toContain("values");
    expect(container.textContent).toContain("vitality");

    // Emit again to close
    act(() => {
      commandBus.emit(PlatformCommand.ToggleFormDevTools);
    });

    expect(container.textContent).not.toContain("Vitality");
  });
});

