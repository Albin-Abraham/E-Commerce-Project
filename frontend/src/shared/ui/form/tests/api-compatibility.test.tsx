import { describe, it, expect } from "vitest";

// Canonical and historical exports from index
import {
  withAtom,
  withFieldShell,
  useFormCore,
  DetailRenderer,
  DetailRenderers,
  DetailHeader,
  DetailKeyDetailsCard,
  DetailBottomActions,
  DetailKeyValueRow,
  DetailValueDisplay,
  Field as IndexField,
  ControlledField as IndexControlledField,
  UncontrolledField as IndexUncontrolledField,
} from "../index";

// Direct source imports to verify exact reference equality and module integrity
import { withAtom as directWithAtom, withFieldShell as directWithFieldShell } from "../hoc/withAtom";
import { useFormCore as directUseFormCore } from "../hooks/useFormCore";
import {
  DetailHeader as directDetailHeader,
  DetailKeyDetailsCard as directDetailKeyDetailsCard,
  DetailBottomActions as directDetailBottomActions,
  DetailKeyValueRow as directDetailKeyValueRow,
  DetailValueDisplay as directDetailValueDisplay,
} from "../detail/DetailRenderers";
import {
  Field as CanonicalField,
  ControlledField as CanonicalControlledField,
  UncontrolledField as CanonicalUncontrolledField,
} from "../fields/Field";
import {
  Field as WrapperField,
  ControlledField as WrapperControlledField,
  UncontrolledField as WrapperUncontrolledField,
} from "../fields/WrapperFields";

describe("LLSD Form Architecture API Compatibility Suite", () => {
  describe("Phase 1A: DCS Decorator Canonical Aliases", () => {
    it("preserves exact referential identity between withAtom and withFieldShell", () => {
      expect(withFieldShell).toBe(withAtom);
      expect(directWithFieldShell).toBe(directWithAtom);
      expect(withFieldShell).toBe(directWithFieldShell);
      expect(typeof withFieldShell).toBe("function");
    });
  });

  describe("Phase 1A: Shell Runtime Hook Canonical Export", () => {
    it("exports canonical useFormCore runtime orchestrator hook", () => {
      expect(useFormCore).toBe(directUseFormCore);
      expect(typeof useFormCore).toBe("function");
    });
  });

  describe("Phase 1A: DetailRenderer Compound and Subcomponent Exports", () => {
    it("attaches standalone subcomponents as compound properties on DetailRenderer", () => {
      expect(DetailRenderer.Header).toBe(DetailHeader);
      expect(DetailRenderer.KeyDetailsCard).toBe(DetailKeyDetailsCard);
      expect(DetailRenderer.BottomActions).toBe(DetailBottomActions);
      expect(DetailRenderer.KeyValueRow).toBe(DetailKeyValueRow);
      expect(DetailRenderer.ValueDisplay).toBe(DetailValueDisplay);
    });

    it("maintains backward compatibility with DetailRenderers dictionary", () => {
      expect(DetailRenderers.Header).toBe(DetailHeader);
      expect(DetailRenderers.KeyDetailsCard).toBe(DetailKeyDetailsCard);
      expect(DetailRenderers.BottomActions).toBe(DetailBottomActions);
      expect(DetailRenderers.KeyValueRow).toBe(DetailKeyValueRow);
      expect(DetailRenderers.ValueDisplay).toBe(DetailValueDisplay);
      expect(DetailRenderers.Header).toBe(directDetailHeader);
    });
  });

  describe("Phase 1A: Field Component Canonical Exports", () => {
    it("re-exports Field, ControlledField, and UncontrolledField with identical reference", () => {
      expect(CanonicalField).toBe(WrapperField);
      expect(CanonicalControlledField).toBe(WrapperControlledField);
      expect(CanonicalUncontrolledField).toBe(WrapperUncontrolledField);

      expect(IndexField).toBe(CanonicalField);
      expect(IndexControlledField).toBe(CanonicalControlledField);
      expect(IndexUncontrolledField).toBe(CanonicalUncontrolledField);
    });
  });
});
