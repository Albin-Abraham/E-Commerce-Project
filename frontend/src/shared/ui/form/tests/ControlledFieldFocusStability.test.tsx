/* eslint-disable testing-library/no-node-access, testing-library/prefer-user-event, testing-library/prefer-implicit-assert, testing-library/no-test-id-queries */
import React, { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Form } from "../Form";
import { ControlledField } from "../fields/WrapperFields";
import { HeaderField } from "../fields/primitive/StaticFields";
import { InputWrapper } from "../structure/InputWrapper";
import type { FormDefinition } from "../types";

describe("Phase 1 Regression Tests: Focus Stability & Standalone Safety", () => {
  const testDefinition: FormDefinition = {
    id: "stability-test-form",
    title: "Stability Test Form",
    sections: [
      {
        id: "sec-1",
        title: "Section 1",
        fields: [
          {
            id: "bio",
            name: "bio",
            type: "text",
            label: "User Bio",
          },
        ],
      },
    ],
  };

  it("preserves DOM node identity and focus across keystrokes in ControlledField with inline render prop", () => {
    let renderCount = 0;

    const TestComponent = () => {
      const [parentState, setParentState] = useState(0);

      return (
        <div>
          <button
            type="button"
            data-testid="increment-parent"
            onClick={() => setParentState((c) => c + 1)}
          >
            Count: {parentState}
          </button>

          <Form definition={testDefinition}>
            <ControlledField
              name="bio"
              render={({ value, onChange }) => {
                renderCount += 1;
                return (
                  <input
                    data-testid="controlled-bio-input"
                    value={value || ""}
                    onChange={(e) => onChange(e.target.value)}
                  />
                );
              }}
            />
          </Form>
        </div>
      );
    };

    render(<TestComponent />);

    const input = screen.getByTestId("controlled-bio-input") as HTMLInputElement;
    input.focus();
    expect(input).toHaveFocus();

    // Initial node reference
    const initialInputRef = input;

    // Simulate typing
    fireEvent.change(input, { target: { value: "Hello" } });

    // Node must NOT have remounted
    const afterFirstChangeInput = screen.getByTestId("controlled-bio-input");
    expect(afterFirstChangeInput).toBe(initialInputRef);
    expect(afterFirstChangeInput).toHaveValue("Hello");
    expect(afterFirstChangeInput).toHaveFocus();

    // Trigger parent state update to force re-render with new inline function reference
    fireEvent.click(screen.getByTestId("increment-parent"));

    const afterParentUpdateInput = screen.getByTestId("controlled-bio-input");
    expect(afterParentUpdateInput).toBe(initialInputRef);
    expect(afterParentUpdateInput).toHaveValue("Hello");
    expect(afterParentUpdateInput).toHaveFocus();

    // Continue typing
    fireEvent.change(afterParentUpdateInput, {
      target: { value: "Hello World" },
    });
    expect(afterParentUpdateInput).toHaveValue("Hello World");
    expect(afterParentUpdateInput).toHaveFocus();
    expect(renderCount).toBeGreaterThan(1);
  });

  it("renders InputWrapper standalone without field prop safely without throwing", () => {
    expect(() => {
      render(
        <InputWrapper label="Standalone Label">
          <input data-testid="standalone-input" />
        </InputWrapper>
      );
    }).not.toThrow();

    expect(screen.getByText("Standalone Label")).toBeInTheDocument();
    expect(screen.getByTestId("standalone-input")).toBeInTheDocument();
  });

  it("renders HeaderField standalone without field prop safely without throwing", () => {
    expect(() => {
      render(
        <HeaderField
          label="Standalone Heading"
          description="Supporting standalone description"
        />
      );
    }).not.toThrow();

    expect(screen.getByText("Standalone Heading")).toBeInTheDocument();
    expect(
      screen.getByText("Supporting standalone description")
    ).toBeInTheDocument();
  });
});
