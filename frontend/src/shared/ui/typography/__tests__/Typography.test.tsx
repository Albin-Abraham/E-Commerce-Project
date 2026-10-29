import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe } from "vitest-axe";
import * as matchers from "vitest-axe/matchers";
import "vitest-axe/extend-expect";

expect.extend(matchers);

import { Text } from "../Text";
import { Heading } from "../Heading";
import { Code } from "../Code";

describe("Typography Components", () => {
  describe("Text", () => {
    it("renders default paragraph with text-body-md", () => {
      render(<Text>Hello World</Text>);
      const el = screen.getByText("Hello World");
      expect(el.tagName).toBe("P");
      expect(el.className).toContain("text-body-md");
      expect(el.className).toContain("text-foreground");
    });

    it("supports polymorphic rendering with as prop", () => {
      render(
        <>
          <Text as="span">Span Text</Text>
          <Text as="label" htmlFor="input-1">
            Label Text
          </Text>
          <Text as="div">Div Text</Text>
        </>
      );
      expect(screen.getByText("Span Text").tagName).toBe("SPAN");
      expect(screen.getByText("Label Text").tagName).toBe("LABEL");
      expect(screen.getByText("Div Text").tagName).toBe("DIV");
    });

    it("applies all semantic text style variants correctly", () => {
      const { rerender } = render(<Text variant="display">Text</Text>);
      expect(screen.getByText("Text").className).toContain("text-display");

      rerender(<Text variant="heading-1">Text</Text>);
      expect(screen.getByText("Text").className).toContain("text-heading-1");

      rerender(<Text variant="heading-2">Text</Text>);
      expect(screen.getByText("Text").className).toContain("text-heading-2");

      rerender(<Text variant="heading-3">Text</Text>);
      expect(screen.getByText("Text").className).toContain("text-heading-3");

      rerender(<Text variant="heading-4">Text</Text>);
      expect(screen.getByText("Text").className).toContain("text-heading-4");

      rerender(<Text variant="body-lg">Text</Text>);
      expect(screen.getByText("Text").className).toContain("text-body-lg");

      rerender(<Text variant="body-md">Text</Text>);
      expect(screen.getByText("Text").className).toContain("text-body-md");

      rerender(<Text variant="body-sm">Text</Text>);
      expect(screen.getByText("Text").className).toContain("text-body-sm");

      rerender(<Text variant="label-lg">Text</Text>);
      expect(screen.getByText("Text").className).toContain("text-label-lg");

      rerender(<Text variant="label-md">Text</Text>);
      expect(screen.getByText("Text").className).toContain("text-label-md");

      rerender(<Text variant="label-sm">Text</Text>);
      expect(screen.getByText("Text").className).toContain("text-label-sm");

      rerender(<Text variant="caption">Text</Text>);
      expect(screen.getByText("Text").className).toContain("text-caption");

      rerender(<Text variant="code">Text</Text>);
      expect(screen.getByText("Text").className).toContain("text-code");
    });

    it("applies text truncation and clamping", () => {
      const { rerender } = render(<Text truncate>Truncated text</Text>);
      expect(screen.getByText("Truncated text").className).toContain("truncate");

      rerender(<Text truncate={2}>Clamped text</Text>);
      expect(screen.getByText("Clamped text").className).toContain("line-clamp-2");
    });

    it("applies logical text alignment for RTL compatibility", () => {
      const { rerender } = render(<Text align="start">Aligned</Text>);
      expect(screen.getByText("Aligned").className).toContain("text-start");

      rerender(<Text align="end">Aligned</Text>);
      expect(screen.getByText("Aligned").className).toContain("text-end");

      rerender(<Text align="center">Aligned</Text>);
      expect(screen.getByText("Aligned").className).toContain("text-center");
    });

    it("applies tabular numerals class when requested", () => {
      render(<Text tabularNums>123456</Text>);
      expect(screen.getByText("123456").className).toContain("tabular-nums");
    });
  });

  describe("Heading", () => {
    it("renders default h2 element with heading-2 variant and ARIA attributes", () => {
      render(<Heading>Section Title</Heading>);
      const heading = screen.getByRole("heading", { level: 2 });
      expect(heading.tagName).toBe("H2");
      expect(heading.getAttribute("aria-level")).toBe("2");
      expect(heading.className).toContain("text-heading-2");
    });

    it("renders h1 when level=1 is specified", () => {
      render(<Heading level={1}>Main Page Title</Heading>);
      const heading = screen.getByRole("heading", { level: 1 });
      expect(heading.tagName).toBe("H1");
      expect(heading.className).toContain("text-heading-1");
    });

    it("decouples HTML heading level from visual semantic variant", () => {
      render(
        <Heading level={2} variant="heading-1">
          Visual H1, Semantic H2
        </Heading>
      );
      const heading = screen.getByRole("heading", { level: 2 });
      expect(heading.tagName).toBe("H2");
      expect(heading.getAttribute("aria-level")).toBe("2");
      expect(heading.className).toContain("text-heading-1");
    });
  });

  describe("Code", () => {
    it("renders inline code span with monospace styling and tabular numbers", () => {
      render(<Code>const x = 42;</Code>);
      const el = screen.getByText("const x = 42;");
      expect(el.tagName).toBe("CODE");
      expect(el.className).toContain("font-mono");
      expect(el.className).toContain("tabular-nums");
    });

    it("renders pre block when inline=false", () => {
      const { container } = render(
        <Code inline={false}>{"{\n  \"status\": 200\n}"}</Code>
      );
      const pre = container.querySelector("pre");
      expect(pre).not.toBeNull();
      expect(pre?.querySelector("code")).not.toBeNull();
    });
  });

  describe("Accessibility (A11y)", () => {
    it("has zero axe-core accessibility violations", async () => {
      const { container } = render(
        <main>
          <Heading level={1}>Accessible Page Title</Heading>
          <Heading level={2} variant="heading-2">
            Section Subtitle
          </Heading>
          <Text variant="body-md">
            This is standard accessible body copy explaining the feature.
          </Text>
          <Code>token.spacing.md</Code>
        </main>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
