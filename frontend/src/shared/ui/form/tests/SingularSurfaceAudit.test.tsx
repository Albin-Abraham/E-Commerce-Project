import React from "react";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { manifestRegistry } from "@form-core/ManifestRegistry";
import { FormOrchestratorProvider } from "../context/FormOrchestratorContext";
import { defaultRegistry } from "../fields/lazy-registry-builder";
import {
  FormButtonField,
  FormCheckboxField,
  FormRadioField,
  FormRangeField,
  FormSearchInputField,
  FormSelectField,
  FormSwitchField,
  FormTextField,
} from "../fields/wrapped-fields";
import { withAtom } from "../hoc/withAtom";

describe("Singular Surface & Anti-Double-Wrap Audit", () => {
  const renderInRuntime = (ui: React.ReactElement) =>
    render(
      <FormOrchestratorProvider
        value={{
          mode: "edit",
          registry: {
            registry: defaultRegistry,
            form: null as any,
            debug: false,
          },
          manifest: { manifestRegistry },
        }}
      >
        {ui}
      </FormOrchestratorProvider>
    );

  it("ensures FormTextField has exactly one interaction surface and one label", () => {
    const { container } = renderInRuntime(
      <FormTextField
        field={{
          id: "username",
          name: "username",
          type: "text",
          label: "Username",
        }}
      />
    );
    expect(container.querySelectorAll("label")).toHaveLength(1);
    expect(container.querySelectorAll(".form-field-surface")).toHaveLength(1);
    expect(container.querySelectorAll(".form-field-container")).toHaveLength(1);
  });

  it("ensures static idempotency: withAtom(FormTextField) never double-wraps", () => {
    const DoubleWrapped = withAtom(FormTextField);
    const { container } = renderInRuntime(
      React.createElement(DoubleWrapped, {
        field: {
          id: "username_dup",
          name: "usernameDup",
          type: "text",
          label: "Username Dup",
        },
      })
    );
    expect(container.querySelectorAll("label")).toHaveLength(1);
    expect(container.querySelectorAll(".form-field-surface")).toHaveLength(1);
    expect(container.querySelectorAll(".form-field-container")).toHaveLength(1);
  });

  it("ensures runtime idempotency: dynamic nested withAtom bypasses inner shell", () => {
    const DynamicCustom = withAtom(() => (
      <FormTextField
        field={{
          id: "nested_text",
          name: "nestedText",
          type: "text",
          label: "Nested Label",
        }}
      />
    ));

    const { container } = renderInRuntime(
      <DynamicCustom
        field={{
          id: "parent_custom",
          name: "parentCustom",
          type: "text",
          label: "Parent Label",
        }}
      />
    );

    // Dynamic nesting should NOT double-wrap the inner input's surface or labels
    expect(container.querySelectorAll("label")).toHaveLength(1);
    expect(container.querySelectorAll(".form-field-surface")).toHaveLength(1);
  });

  it("ensures FormCheckboxField has exactly one accessible label and no text-input box surface", () => {
    const { container } = renderInRuntime(
      <FormCheckboxField
        field={{
          id: "agree",
          name: "agree",
          type: "checkbox",
          label: "Agree to terms",
        }}
      />
    );
    expect(container.querySelectorAll("label")).toHaveLength(1);
    expect(container.querySelectorAll(".form-field-surface")).toHaveLength(0);
  });

  it("ensures FormRadioField does not duplicate surface classes or render input box surface", () => {
    const { container } = renderInRuntime(
      <FormRadioField
        field={{
          id: "radio_field",
          name: "radioField",
          type: "radio",
          label: "Choose one",
          options: [
            { value: "a", label: "Option A" },
            { value: "b", label: "Option B" },
          ],
        }}
      />
    );
    expect(container.querySelectorAll(".form-field-surface")).toHaveLength(0);
  });

  it("ensures FormSearchInputField does not double-wrap search bar surface", () => {
    const { container } = renderInRuntime(
      <FormSearchInputField
        field={{
          id: "search",
          name: "search",
          type: "search_input",
          label: "Search",
        }}
      />
    );
    expect(container.querySelectorAll(".form-field-surface")).toHaveLength(0);
    expect(container.querySelectorAll(".group\\/search")).toHaveLength(1);
  });

  it("ensures FormRangeField has no text-input surface box", () => {
    const { container } = renderInRuntime(
      <FormRangeField
        field={{
          id: "slider",
          name: "slider",
          type: "range",
          label: "Slider",
        }}
        value={10}
        onChange={() => {}}
      />
    );
    expect(container.querySelectorAll(".form-field-surface")).toHaveLength(0);
  });

  it("ensures FormSwitchField renders without an input box surface", () => {
    const { container } = renderInRuntime(
      <FormSwitchField
        field={{
          id: "toggle",
          name: "toggle",
          type: "switch",
          label: "Enable notifications",
        }}
        value={false}
        onChange={() => {}}
      />
    );
    expect(container.querySelectorAll(".form-field-surface")).toHaveLength(0);
  });
});
