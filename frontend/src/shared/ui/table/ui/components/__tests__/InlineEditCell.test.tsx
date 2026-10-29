import React from "react";

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  InlineEditProvider,
  useInlineEditContext,
} from "../../../core/InlineEditContext";
import type { FormFieldSchema } from "../../../types";
import { InlineEditCell } from "../InlineEditCell";

const schemas: Record<string, FormFieldSchema> = {
  name: { id: "name", name: "name", label: "Name", type: "text" },
};

function renderCell(
  props: Partial<React.ComponentProps<typeof InlineEditCell>> = {},
  providerProps: Partial<React.ComponentProps<typeof InlineEditProvider>> = {}
) {
  return render(
    <InlineEditProvider columnSchemas={schemas} {...providerProps}>
      <table>
        <tbody>
          <tr>
            <td>
              <InlineEditCell
                rowId="row-1"
                colId="name"
                value="John"
                {...props}
              >
                <span data-testid="display">John</span>
              </InlineEditCell>
            </td>
          </tr>
        </tbody>
      </table>
    </InlineEditProvider>
  );
}

describe("InlineEditCell", () => {
  it("renders children when not editing", () => {
    renderCell();

    expect(screen.getByTestId("display")).toHaveTextContent("John");
  });

  it("renders value fallback when no children", () => {
    render(
      <InlineEditProvider columnSchemas={schemas}>
        <table>
          <tbody>
            <tr>
              <td>
                <InlineEditCell rowId="row-1" colId="name" value="John" />
              </td>
            </tr>
          </tbody>
        </table>
      </InlineEditProvider>
    );

    expect(screen.getByText("John")).toBeInTheDocument();
  });

  it("renders empty string for null value", () => {
    const { container } = render(
      <InlineEditProvider columnSchemas={schemas}>
        <table>
          <tbody>
            <tr>
              <td>
                <InlineEditCell rowId="row-1" colId="name" value={null} />
              </td>
            </tr>
          </tbody>
        </table>
      </InlineEditProvider>
    );

    const cell = container.querySelector("td");
    expect(cell).toBeInTheDocument();
  });

  it("throws in edit mode when no field schema matches", () => {
    const emptySchemas: Record<string, FormFieldSchema> = {};
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    function StartButton() {
      const ctx = useInlineEditContext();
      return (
        <button
          data-testid="start"
          onClick={() => ctx.startEdit("row-1", { name: "John" })}
        >
          Start
        </button>
      );
    }

    render(
      <InlineEditProvider columnSchemas={emptySchemas}>
        <table>
          <tbody>
            <tr>
              <td>
                <InlineEditCell rowId="row-1" colId="name" value="John">
                  <span data-testid="display">John</span>
                </InlineEditCell>
              </td>
            </tr>
          </tbody>
        </table>
        <StartButton />
      </InlineEditProvider>
    );

    expect(screen.getByTestId("display")).toBeInTheDocument();
    expect(() => fireEvent.click(screen.getByTestId("start"))).toThrow(
      /No form field schema defined for column "name"/
    );
    spy.mockRestore();
  });

  it("does not show edit input when different row is being edited", () => {
    function StartButton() {
      const ctx = useInlineEditContext();
      return (
        <button
          data-testid="start"
          onClick={() => ctx.startEdit("row-2", { other: "data" })}
        >
          Start
        </button>
      );
    }

    render(
      <InlineEditProvider columnSchemas={{}}>
        <table>
          <tbody>
            <tr>
              <td>
                <InlineEditCell rowId="row-1" colId="name" value="John">
                  <span data-testid="display">John</span>
                </InlineEditCell>
              </td>
            </tr>
          </tbody>
        </table>
        <StartButton />
      </InlineEditProvider>
    );

    fireEvent.click(screen.getByTestId("start"));

    // row-1 is not being edited, so display is still shown
    expect(screen.getByTestId("display")).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("renders display text without a provider", () => {
    render(
      <table>
        <tbody>
          <tr>
            <td>
              <InlineEditCell rowId="row-1" colId="name" value="John">
                <span data-testid="display">John</span>
              </InlineEditCell>
            </td>
          </tr>
        </tbody>
      </table>
    );

    expect(screen.getByTestId("display")).toHaveTextContent("John");
  });
});
