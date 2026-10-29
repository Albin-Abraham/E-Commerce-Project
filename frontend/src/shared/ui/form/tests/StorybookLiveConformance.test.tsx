/* eslint-disable testing-library/no-container, testing-library/no-node-access */
import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { composeStories } from "@storybook/react-vite";

// Story imports
import * as RawFieldIconStories from "../atoms/FieldIcon.stories";
import * as RawFieldTooltipStories from "../atoms/FieldTooltip.stories";
import * as RawFieldShellStories from "../structure/FieldShell.stories";
import * as RawInputWrapperStories from "../structure/InputWrapper.stories";
import * as RawOuterWrapperStories from "../structure/OuterWrapper.stories";
import * as RawStaticFieldsStories from "../fields/primitive/StaticFields.stories";
import * as RawWrapperFieldsStories from "../fields/WrapperFields.stories";
import * as RawButtonFieldStories from "../fields/primitive/ButtonField.stories";
import * as RawRadioFieldStories from "../fields/primitive/RadioField.stories";
import * as RawCheckboxFieldStories from "../fields/primitive/CheckboxField.stories";
import * as RawSwitchFieldStories from "../fields/primitive/SwitchField.stories";
import * as RawRangeFieldStories from "../fields/primitive/RangeField.stories";
import * as RawFileFieldStories from "../fields/primitive/FileField.stories";
import * as RawMultiSelectFieldStories from "../fields/primitive/MultiSelectField.stories";
import * as RawAutocompleteFieldStories from "../fields/primitive/AutocompleteField.stories";
import * as RawDetailRendererStories from "../detail/DetailRenderer.stories";

const FieldIconStories = composeStories(RawFieldIconStories);
const FieldTooltipStories = composeStories(RawFieldTooltipStories);
const FieldShellStories = composeStories(RawFieldShellStories);
const InputWrapperStories = composeStories(RawInputWrapperStories);
const OuterWrapperStories = composeStories(RawOuterWrapperStories);
const StaticFieldsStories = composeStories(RawStaticFieldsStories);
const WrapperFieldsStories = composeStories(RawWrapperFieldsStories);
const ButtonFieldStories = composeStories(RawButtonFieldStories);
const RadioFieldStories = composeStories(RawRadioFieldStories);
const CheckboxFieldStories = composeStories(RawCheckboxFieldStories);
const SwitchFieldStories = composeStories(RawSwitchFieldStories);
const RangeFieldStories = composeStories(RawRangeFieldStories);
const FileFieldStories = composeStories(RawFileFieldStories);
const MultiSelectFieldStories = composeStories(RawMultiSelectFieldStories);
const AutocompleteFieldStories = composeStories(RawAutocompleteFieldStories);
const DetailRendererStories = composeStories(RawDetailRendererStories);

describe("Storybook Live Conformance & Screen Rendering Test Suite", () => {
  describe("1. Atoms Stories", () => {
    it("renders FieldIcon - CustomScale with settings icon", () => {
      const { container } = render(<FieldIconStories.CustomScale />);
      const svgs = container.querySelectorAll("svg");
      expect(svgs.length).toBeGreaterThanOrEqual(1);
    });

    it("renders FieldIcon - IconRegistryGallery with all registered icons", () => {
      const { container } = render(<FieldIconStories.IconRegistryGallery />);
      const svgs = container.querySelectorAll("svg");
      expect(svgs.length).toBeGreaterThanOrEqual(12);
    });

    it("renders FieldTooltip - Default with accessible role and trigger", () => {
      render(<FieldTooltipStories.Default />);
      expect(screen.getByRole("button", { name: /more information/i })).toBeInTheDocument();
    });
  });

  describe("2. Structure Stories", () => {
    it("renders FieldShell - TopLabelDefault with surface and label", () => {
      const { container } = render(<FieldShellStories.TopLabelDefault />);
      expect(screen.getByText("Username")).toBeInTheDocument();
      expect(container.querySelectorAll(".form-field-surface")).toHaveLength(1);
    });

    it("renders FieldShell - SideLabelLayout with grid columns", () => {
      const { container } = render(<FieldShellStories.SideLabelLayout />);
      expect(screen.getByText("Organization Name")).toBeInTheDocument();
      expect(container.querySelectorAll(".form-field-surface")).toHaveLength(1);
    });

    it("renders FieldShell - ErrorStateWithReservation with error feedback", () => {
      render(<FieldShellStories.ErrorStateWithReservation />);
      expect(screen.getByText("Work Email")).toBeInTheDocument();
      expect(
        screen.getByText(
          "A valid corporate email address is required (e.g. user@zenith.com)"
        )
      ).toBeInTheDocument();
    });

    it("renders InputWrapper - TopPlacement with label and child", () => {
      render(<InputWrapperStories.TopPlacement />);
      expect(screen.getByText("Top Placed Label")).toBeInTheDocument();
      expect(screen.getByText("Input control zone")).toBeInTheDocument();
    });

    it("renders OuterWrapper - WithStartAndEndSlots with search icon and clear button", () => {
      const { container } = render(<OuterWrapperStories.WithStartAndEndSlots />);
      expect(container.querySelectorAll(".form-field-surface")).toHaveLength(1);
      expect(container.querySelectorAll("svg").length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("3. Static Primitive Stories", () => {
    it("renders StaticFields - AllHeadingLevels across all tags without crashing", () => {
      render(<StaticFieldsStories.AllHeadingLevels />);
      expect(screen.getByText("Heading Level — H1")).toBeInTheDocument();
      expect(screen.getByText("Heading Level — H2")).toBeInTheDocument();
      expect(screen.getByText("Heading Level — H3")).toBeInTheDocument();
    });

    it("renders StaticFields - StandaloneHeaderWithoutField safely", () => {
      render(<StaticFieldsStories.StandaloneHeaderWithoutField />);
      expect(
        screen.getByText("Autonomous Header without Field Prop")
      ).toBeInTheDocument();
    });

    it("renders StaticFields - DividersShowcase with styled rules", () => {
      const { container } = render(<StaticFieldsStories.DividersShowcase />);
      expect(container.querySelectorAll("hr")).toHaveLength(1);
      expect(
        screen.getByText("OR ENTER DIRECT IDENTIFIER")
      ).toBeInTheDocument();
    });
  });

  describe("4. Integration / WrapperFields Stories", () => {
    it("renders WrapperFields - ControlledFieldFocusStability with bio input and parent button", () => {
      render(<WrapperFieldsStories.ControlledFieldFocusStability />);
      expect(
        screen.getByText("Live Monitored Controlled Input")
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText(
          "Type continuously here — watch cursor & focus stay locked!"
        )
      ).toBeInTheDocument();
    });

    it("renders WrapperFields - NestedCompositionAntiDoubleWrap with exactly ONE surface and ONE label", () => {
      const { container } = render(
        <WrapperFieldsStories.NestedCompositionAntiDoubleWrap />
      );
      expect(container.querySelectorAll(".form-field-surface")).toHaveLength(1);
      expect(screen.getAllByText("Canonical Outer Label")).toHaveLength(1);
    });

    it("renders WrapperFields - UnifiedFieldSmartSwitching with top label and surface", () => {
      const { container } = render(
        <WrapperFieldsStories.UnifiedFieldSmartSwitching />
      );
      expect(screen.getByText("Email Address")).toBeInTheDocument();
      expect(screen.getByText("Interactive Custom Rating")).toBeInTheDocument();
      expect(container.querySelectorAll(".form-field-surface").length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("5. Overhauled Primitive Fields Stories", () => {
    it("renders ButtonField - AllVariantsShowcase with solid, outline, flat, ghost buttons", () => {
      render(<ButtonFieldStories.AllVariantsShowcase />);
      expect(screen.getByRole("button", { name: /Solid Primary/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Outline \/ Bordered/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Soft \/ Flat/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Destructive Danger/i })).toBeInTheDocument();
    });

    it("renders RadioField - CardVariantShowcase with interactive option cards", () => {
      render(<RadioFieldStories.CardVariantShowcase />);
      expect(screen.getByText("Amazon Web Services")).toBeInTheDocument();
      expect(screen.getByText("Google Cloud Platform")).toBeInTheDocument();
      expect(screen.getByText("Microsoft Azure")).toBeInTheDocument();
    });

    it("renders RadioField - SegmentedControlShowcase with tab-style options", () => {
      render(<RadioFieldStories.SegmentedControlShowcase />);
      expect(screen.getByText("Compact")).toBeInTheDocument();
      expect(screen.getByText("Comfortable")).toBeInTheDocument();
      expect(screen.getByText("Spacious")).toBeInTheDocument();
    });

    it("renders CheckboxField - CardVariantShowcase and IndeterminateState", () => {
      render(<CheckboxFieldStories.CardVariantShowcase />);
      expect(screen.getByText("Enable Enterprise Zero-Trust Mesh")).toBeInTheDocument();
    });

    it("renders SwitchField - SizesShowcase across sm, md, and lg sizes", () => {
      render(<SwitchFieldStories.SizesShowcase />);
      expect(screen.getByText("Small Switch (sm)")).toBeInTheDocument();
      expect(screen.getByText("Medium Switch (md - Default)")).toBeInTheDocument();
      expect(screen.getByText("Large Switch (lg)")).toBeInTheDocument();
    });

    it("renders RangeField - WithUnitAndBadge with dynamic value badge", () => {
      render(<RangeFieldStories.WithUnitAndBadge />);
      expect(screen.getByText("Dedicated Memory Allocation")).toBeInTheDocument();
      expect(screen.getByText(/16/)).toBeInTheDocument();
    });

    it("renders FileField - Default Dropzone Card with drag-and-drop prompt", () => {
      render(<FileFieldStories.Default />);
      expect(screen.getByText(/Click to upload/i)).toBeInTheDocument();
    });

    it("renders MultiSelectField - WithChipsAndTags with selected tags", () => {
      render(<MultiSelectFieldStories.WithChipsAndTags />);
      expect(screen.getByText("Selected Frontend Technologies")).toBeInTheDocument();
      expect(screen.getByText("React 19")).toBeInTheDocument();
      expect(screen.getByText("Vite 6")).toBeInTheDocument();
      expect(screen.getByText("Tailwind CSS v4")).toBeInTheDocument();
    });

    it("renders AutocompleteField - Default story without collection errors", () => {
      render(<AutocompleteFieldStories.Default />);
      expect(screen.getByRole("combobox")).toBeInTheDocument();
    });

    it("renders AutocompleteField - PreselectedChoice story with selected value", () => {
      render(<AutocompleteFieldStories.PreselectedChoice />);
      expect(screen.getByRole("combobox")).toBeInTheDocument();
    });

    it("renders AutocompleteField - CanonicalFlatProps story", () => {
      render(<AutocompleteFieldStories.CanonicalFlatProps />);
      expect(screen.getByRole("combobox")).toBeInTheDocument();
    });
  });

  describe("6. DetailRenderer & Slots Stories", () => {
    it("renders ProductDetailShowcase with header, media, and specs without <form>", () => {
      const { container } = render(<DetailRendererStories.ProductDetailShowcase />);
      expect(container.querySelector("form")).toBeNull();
      expect(screen.getAllByText("Aether Pro Studio Wireless Headset").length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText("Units in Warehouse")).toBeInTheDocument();
      expect(screen.getByText("142")).toBeInTheDocument();
      expect(screen.getByText("In Stock & Ready")).toBeInTheDocument();
    });

    it("renders KeyValueLayoutShowcase with definition list layout", () => {
      const { container } = render(<DetailRendererStories.KeyValueLayoutShowcase />);
      expect(container.querySelector("form")).toBeNull();
      expect(screen.getAllByText("prod-api-edge-01.us-east.zenos.internal").length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText("Primary IPv4 Address")).toBeInTheDocument();
      expect(screen.getByText("10.128.4.19")).toBeInTheDocument();
    });

    it("renders SlotInjectionShowcase with custom throughput and audit trail slots", () => {
      const { container } = render(<DetailRendererStories.SlotInjectionShowcase />);
      expect(container.querySelector("form")).toBeNull();
      expect(screen.getByText("18.4k req/s")).toBeInTheDocument();
      expect(screen.getByText("Node auto-scaler provisioned worker-pool-9c")).toBeInTheDocument();
    });

    it("renders InteractiveWidgetsWithoutForm and responds to state changes without <form>", () => {
      const { container } = render(<DetailRendererStories.InteractiveWidgetsWithoutForm />);
      expect(container.querySelector("form")).toBeNull();
      expect(screen.getByText(/Live Controls \(Interactive Mode\)/i)).toBeInTheDocument();
      expect(screen.getByText("Force Dark High-Contrast Theme")).toBeInTheDocument();
    });

    it("renders FlatLayoutShowcase cleanly with flat structure", () => {
      const { container } = render(<DetailRendererStories.FlatLayoutShowcase />);
      expect(container.querySelector("form")).toBeNull();
      expect(screen.getByText("Security & Sign-in Credentials")).toBeInTheDocument();
      expect(screen.getByText("security@zenos.enterprise.io")).toBeInTheDocument();
    });
  });
});
