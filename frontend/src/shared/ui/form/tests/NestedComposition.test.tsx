/* eslint-disable testing-library/no-container, testing-library/no-node-access, testing-library/prefer-implicit-assert */
import React, { createRef } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FormTextField } from "../fields/wrapped-fields";
import { FieldShell } from "../structure/FieldShell";
import { useFieldComposition } from "../context/FieldCompositionContext";

describe("Phase 2: Unified Field Composition & Anti-Double-Wrap Protocol", () => {
  it("ensures rendering FormTextField inside FieldShell renders exactly ONE label and ONE surface", () => {
    const { container } = render(
      <FieldShell name="username" label="Username">
        <FormTextField name="username" placeholder="Enter username" />
      </FieldShell>
    );

    // Exactly one label element
    const labels = screen.getAllByText("Username");
    expect(labels).toHaveLength(1);

    // Exactly one interaction surface
    const surfaces = container.querySelectorAll(".form-field-surface");
    expect(surfaces).toHaveLength(1);

    // Exactly one input element
    const inputs = screen.getAllByPlaceholderText("Enter username");
    expect(inputs).toHaveLength(1);
  });

  it("forwards ref through withAtom to the native input element", () => {
    const inputRef = createRef<HTMLInputElement>();

    render(
      <FormTextField
        ref={inputRef}
        name="email"
        placeholder="Enter email"
      />
    );

    expect(inputRef.current).not.toBeNull();
    expect(inputRef.current?.tagName).toBe("INPUT");
    expect(inputRef.current?.placeholder).toBe("Enter email");
  });

  it("renders standalone FormTextField with complete single surface and label", () => {
    const { container } = render(
      <FormTextField
        name="standaloneField"
        label="Standalone Field"
        placeholder="Type here"
      />
    );

    expect(screen.getByText("Standalone Field")).toBeInTheDocument();
    expect(container.querySelectorAll(".form-field-surface")).toHaveLength(1);
    expect(screen.getByPlaceholderText("Type here")).toBeInTheDocument();
  });

  it("enforces strict FieldCompositionMode contract without boolean fallbacks", () => {
    let observedMode: string | null = null;

    const ModeInspector = () => {
      const composition = useFieldComposition();
      observedMode = composition.mode;
      return <div data-testid="mode-value">{composition.mode}</div>;
    };

    const { rerender } = render(<ModeInspector />);
    expect(observedMode).toBe("standalone");

    rerender(
      <FieldShell name="test" label="Test">
        <ModeInspector />
      </FieldShell>
    );
    expect(observedMode).toBe("managed");
  });
});
