import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FieldIcon } from "../atoms/FieldIcon";
import { FieldTooltip } from "../atoms/FieldTooltip";
import { HelpText } from "../atoms/HelpText";
import { ValidationHints } from "../atoms/ValidationHints";

describe("Form Atoms", () => {
  describe("FieldIcon", () => {
    it("should render correctly when a valid icon name is provided", () => {
      const { container } = render(<FieldIcon iconName="user" />);
      expect(container.querySelector("svg")).toBeTruthy();
    });

    it("should render null when no icon name is provided", () => {
      const { container } = render(<FieldIcon />);
      expect(container.firstChild).toBeNull();
    });

    it("should render null when an invalid icon name is provided", () => {
      const { container } = render(<FieldIcon iconName="non-existent-icon" />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe("FieldTooltip", () => {
    it("should render the tooltip info icon when text is provided", () => {
      render(<FieldTooltip text="This is a tooltip" />);
      expect(screen.getByText("This is a tooltip")).toBeTruthy();
    });

    it("should render null when no text is provided", () => {
      const { container } = render(<FieldTooltip />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe("HelpText", () => {
    it("should render correctly with string text", () => {
      render(<HelpText text="Help string" />);
      expect(screen.getByText("Help string")).toBeTruthy();
    });

    it("should render correctly with array of strings", () => {
      const hints = ["Hint 1", "Hint 2"];
      render(<HelpText text={hints} />);
      expect(screen.getByText("Hint 1")).toBeTruthy();
      expect(screen.getByText("Hint 2")).toBeTruthy();
    });

    it("should render null when text is empty", () => {
      const { container } = render(<HelpText text="" />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe("ValidationHints", () => {
    it("should render a list of hints", () => {
      const hints = ["Required", "Min 5 chars"];
      render(<ValidationHints hints={hints} />);
      expect(screen.getByText("Required")).toBeTruthy();
      expect(screen.getByText("Min 5 chars")).toBeTruthy();
    });

    it("should render null when no hints are provided", () => {
      const { container } = render(<ValidationHints />);
      expect(container.firstChild).toBeNull();
    });
  });
});
