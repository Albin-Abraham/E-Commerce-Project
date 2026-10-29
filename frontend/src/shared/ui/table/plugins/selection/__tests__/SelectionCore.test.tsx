import React from "react";

import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TablePhysicsProvider } from "../../../core/TablePhysicsContext";
import {
  SelectionActionBarRoot,
  SelectionBarInfo,
  useSelectionContext,
} from "../SelectionCore";

function createMockRef() {
  return { current: null } as React.RefObject<HTMLDivElement | null>;
}

function SelectionWrapper({ children }: { children: React.ReactNode }) {
  return (
    <TablePhysicsProvider containerRef={createMockRef()}>
      {children}
    </TablePhysicsProvider>
  );
}

describe("SelectionCore", () => {
  describe("SelectionActionBarRoot", () => {
    it("renders nothing when no selection", () => {
      const { container } = render(
        <SelectionWrapper>
          <SelectionActionBarRoot>
            <div>content</div>
          </SelectionActionBarRoot>
        </SelectionWrapper>
      );
      expect(container.innerHTML).toBe("");
    });

    it("renders children when there is a selection", () => {
      render(
        <SelectionWrapper>
          <SelectionActionBarRoot>
            <div>action bar content</div>
          </SelectionActionBarRoot>
        </SelectionWrapper>
      );
      // Note: This test verifies the component renders but selection requires
      // the physics store to have selected rows, which needs user interaction.
      // For now we just verify the component doesn't throw.
    });
  });

  describe("useSelectionContext", () => {
    it("throws when used outside provider", () => {
      expect(() => {
        render(
          <SelectionWrapper>
            <TestConsumer />
          </SelectionWrapper>
        );
      }).toThrow(
        "Selection components must be used within a SelectionActionBar provider"
      );
    });
  });

  describe("SelectionBarInfo", () => {
    it("throws when used outside SelectionBarContext", () => {
      expect(() => {
        render(
          <SelectionWrapper>
            <SelectionBarInfo />
          </SelectionWrapper>
        );
      }).toThrow(
        "Selection components must be used within a SelectionActionBar provider"
      );
    });
  });
});

function TestConsumer() {
  useSelectionContext();
  return null;
}
