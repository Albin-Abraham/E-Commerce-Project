import {
  createDefaultField,
  createDefaultForm,
  createDefaultSection,
} from "@ui/form/builder/utils/builder-utils";
import type { FieldType, FormField } from "@ui/form/fields";
import type { FormDefinition } from "@ui/form/types";
import type { FieldConditionGroup } from "@ui/form/types/condition";
import type { FormSection } from "@ui/form/types/section";
import type { ValidationRule } from "@ui/form/types/validation";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

// --- Adapter ---
// FormSection uses `fields` while the generic SFM interface uses `items`/`columns`.
// Rather than forcing the mismatch, the store implements SFM logic directly
// on `sections`/`fields` using Immer for efficient immutable state updates.

type NodeType = "form" | "section" | "field";

export interface Selection {
  type: NodeType;
  id: string;
  sectionId?: string;
}

interface BuilderState {
  formDefinition: FormDefinition;
  selection: Selection | null;
  isModalOpen: boolean;

  // Undo/Redo
  history: FormDefinition[];
  historyIndex: number;
  undo: () => void;
  redo: () => void;

  // Selection
  setSelection: (selection: Selection | null) => void;
  setModalOpen: (isOpen: boolean) => void;

  // Section actions
  addSection: () => void;
  updateSection: (sectionId: string, updates: Partial<FormSection>) => void;
  removeSection: (sectionId: string) => void;
  moveSection: (sourceIndex: number, destinationIndex: number) => void;

  // Field actions
  addSectionWithField: (type: FieldType) => void;
  addField: (sectionId: string, type: FieldType, index?: number) => void;
  updateField: (
    sectionId: string,
    fieldId: string,
    updates: Partial<FormField>
  ) => void;
  removeField: (sectionId: string, fieldId: string) => void;
  moveField: (
    sectionId: string,
    sourceIndex: number,
    destinationIndex: number
  ) => void;
  moveFieldToSection: (
    sourceSectionId: string,
    destSectionId: string,
    sourceIndex: number,
    destinationIndex: number
  ) => void;

  // Validation rule actions
  addValidationRule: (
    sectionId: string,
    fieldId: string,
    rule: ValidationRule
  ) => void;
  updateValidationRule: (
    sectionId: string,
    fieldId: string,
    ruleIndex: number,
    updates: Partial<ValidationRule>
  ) => void;
  removeValidationRule: (
    sectionId: string,
    fieldId: string,
    ruleIndex: number
  ) => void;
  reorderValidationRules: (
    sectionId: string,
    fieldId: string,
    fromIndex: number,
    toIndex: number
  ) => void;

  // Condition actions
  setFieldConditions: (
    sectionId: string,
    fieldId: string,
    groups: FieldConditionGroup[]
  ) => void;
  addConditionGroup: (sectionId: string, fieldId: string) => void;
  updateConditionGroup: (
    sectionId: string,
    fieldId: string,
    groupIndex: number,
    updates: Partial<FieldConditionGroup>
  ) => void;
  removeConditionGroup: (
    sectionId: string,
    fieldId: string,
    groupIndex: number
  ) => void;

  // Form actions
  updateForm: (updates: Partial<FormDefinition>) => void;
}

// Helper to find a field in the state
function findField(
  state: BuilderState,
  sectionId: string,
  fieldId: string
): FormField | undefined {
  const section = state.formDefinition.sections?.find(
    (s) => s.id === sectionId
  );
  return (section?.fields as any[])?.find((f) => (f as any).id === fieldId);
}

const MAX_HISTORY = 50;

export const useBuilderStore = create<BuilderState>()(
  immer((set) => ({
    formDefinition: createDefaultForm(),
    selection: null,
    isModalOpen: false,
    history: [],
    historyIndex: -1,

    // ── Undo / Redo ──────────────────────────────────────────────────────

    undo: () =>
      set((state) => {
        if (state.historyIndex > 0) {
          state.historyIndex--;
          state.formDefinition = JSON.parse(
            JSON.stringify(state.history[state.historyIndex])
          );
        }
      }),

    redo: () =>
      set((state) => {
        if (state.historyIndex < state.history.length - 1) {
          state.historyIndex++;
          state.formDefinition = JSON.parse(
            JSON.stringify(state.history[state.historyIndex])
          );
        }
      }),

    // ── Internal: push to history before mutation ────────────────────────

    setSelection: (selection) => set({ selection }),
    setModalOpen: (isOpen) => set({ isModalOpen: isOpen }),

    updateForm: (updates) =>
      set((state) => {
        // Push current state to history before mutating
        state.history.splice(state.historyIndex + 1);
        state.history.push(JSON.parse(JSON.stringify(state.formDefinition)));
        if (state.history.length > MAX_HISTORY) state.history.shift();
        state.historyIndex = state.history.length - 1;

        Object.assign(state.formDefinition, updates);
      }),

    addSection: () =>
      set((state) => {
        state.history.splice(state.historyIndex + 1);
        state.history.push(JSON.parse(JSON.stringify(state.formDefinition)));
        if (state.history.length > MAX_HISTORY) state.history.shift();
        state.historyIndex = state.history.length - 1;

        const newSection = createDefaultSection();
        state.formDefinition.sections!.push(newSection as any);
        state.selection = { type: "section", id: newSection.id };
      }),

    addSectionWithField: (type) =>
      set((state) => {
        state.history.splice(state.historyIndex + 1);
        state.history.push(JSON.parse(JSON.stringify(state.formDefinition)));
        if (state.history.length > MAX_HISTORY) state.history.shift();
        state.historyIndex = state.history.length - 1;

        const newSection = createDefaultSection();
        const newField = createDefaultField(type);
        newSection.fields.push(newField);
        state.formDefinition.sections!.push(newSection as any);
        state.selection = {
          type: "field",
          id: newField.id,
          sectionId: newSection.id,
        };
      }),

    updateSection: (sectionId, updates) =>
      set((state) => {
        state.history.splice(state.historyIndex + 1);
        state.history.push(JSON.parse(JSON.stringify(state.formDefinition)));
        if (state.history.length > MAX_HISTORY) state.history.shift();
        state.historyIndex = state.history.length - 1;

        const section = state.formDefinition.sections!.find(
          (s) => s.id === sectionId
        );
        if (section) Object.assign(section, updates);
      }),

    removeSection: (sectionId) =>
      set((state) => {
        state.history.splice(state.historyIndex + 1);
        state.history.push(JSON.parse(JSON.stringify(state.formDefinition)));
        if (state.history.length > MAX_HISTORY) state.history.shift();
        state.historyIndex = state.history.length - 1;

        const index = state.formDefinition.sections!.findIndex(
          (s) => s.id === sectionId
        );
        if (index !== -1) {
          state.formDefinition.sections!.splice(index, 1);
          if (state.selection?.id === sectionId) state.selection = null;
        }
      }),

    moveSection: (sourceIndex, destinationIndex) =>
      set((state) => {
        state.history.splice(state.historyIndex + 1);
        state.history.push(JSON.parse(JSON.stringify(state.formDefinition)));
        if (state.history.length > MAX_HISTORY) state.history.shift();
        state.historyIndex = state.history.length - 1;

        const sections = state.formDefinition.sections!;
        const [removed] = sections.splice(sourceIndex, 1);
        sections.splice(destinationIndex, 0, removed);
      }),

    addField: (sectionId, type, index) =>
      set((state) => {
        state.history.splice(state.historyIndex + 1);
        state.history.push(JSON.parse(JSON.stringify(state.formDefinition)));
        if (state.history.length > MAX_HISTORY) state.history.shift();
        state.historyIndex = state.history.length - 1;

        const section = state.formDefinition.sections!.find(
          (s) => s.id === sectionId
        );
        if (section) {
          if (!section.fields) section.fields = [];
          const newField = createDefaultField(type);
          if (typeof index === "number") {
            (section.fields as any[]).splice(index, 0, newField as any);
          } else {
            (section.fields as any[]).push(newField as any);
          }
          state.selection = { type: "field", id: newField.id, sectionId };
        }
      }),

    updateField: (sectionId, fieldId, updates) =>
      set((state) => {
        state.history.splice(state.historyIndex + 1);
        state.history.push(JSON.parse(JSON.stringify(state.formDefinition)));
        if (state.history.length > MAX_HISTORY) state.history.shift();
        state.historyIndex = state.history.length - 1;

        const field = findField(state, sectionId, fieldId);
        if (field) {
          Object.assign(field, updates);
        }
      }),

    removeField: (sectionId, fieldId) =>
      set((state) => {
        state.history.splice(state.historyIndex + 1);
        state.history.push(JSON.parse(JSON.stringify(state.formDefinition)));
        if (state.history.length > MAX_HISTORY) state.history.shift();
        state.historyIndex = state.history.length - 1;

        const section = state.formDefinition.sections!.find(
          (s) => s.id === sectionId
        );
        if (section && section.fields) {
          section.fields = (section.fields as any[]).filter(
            (f) => (f as any).id !== fieldId
          );
          if (state.selection?.id === fieldId) state.selection = null;
        }
      }),

    moveField: (sectionId, sourceIndex, destinationIndex) =>
      set((state) => {
        state.history.splice(state.historyIndex + 1);
        state.history.push(JSON.parse(JSON.stringify(state.formDefinition)));
        if (state.history.length > MAX_HISTORY) state.history.shift();
        state.historyIndex = state.history.length - 1;

        const section = state.formDefinition.sections!.find(
          (s) => s.id === sectionId
        );
        if (section && section.fields) {
          const [removed] = (section.fields as any[]).splice(sourceIndex, 1);
          (section.fields as any[]).splice(destinationIndex, 0, removed);
        }
      }),

    moveFieldToSection: (
      sourceSectionId,
      destSectionId,
      sourceIndex,
      destinationIndex
    ) =>
      set((state) => {
        state.history.splice(state.historyIndex + 1);
        state.history.push(JSON.parse(JSON.stringify(state.formDefinition)));
        if (state.history.length > MAX_HISTORY) state.history.shift();
        state.historyIndex = state.history.length - 1;

        const sourceSection = state.formDefinition.sections!.find(
          (s) => s.id === sourceSectionId
        );
        const destSection = state.formDefinition.sections!.find(
          (s) => s.id === destSectionId
        );

        if (sourceSection && destSection) {
          if (!sourceSection.fields) sourceSection.fields = [];
          if (!destSection.fields) destSection.fields = [];
          const [movedField] = (sourceSection.fields as any[]).splice(
            sourceIndex,
            1
          );
          (destSection.fields as any[]).splice(destinationIndex, 0, movedField);
        }
      }),

    // ── Validation Rule Actions ──────────────────────────────────────────

    addValidationRule: (sectionId, fieldId, rule) =>
      set((state) => {
        state.history.splice(state.historyIndex + 1);
        state.history.push(JSON.parse(JSON.stringify(state.formDefinition)));
        if (state.history.length > MAX_HISTORY) state.history.shift();
        state.historyIndex = state.history.length - 1;

        const field = findField(state, sectionId, fieldId);
        if (field) {
          if (!field.validation) field.validation = {};
          if (!field.validation.rules) field.validation.rules = [];
          field.validation.rules.push(rule as any);
        }
      }),

    updateValidationRule: (sectionId, fieldId, ruleIndex, updates) =>
      set((state) => {
        state.history.splice(state.historyIndex + 1);
        state.history.push(JSON.parse(JSON.stringify(state.formDefinition)));
        if (state.history.length > MAX_HISTORY) state.history.shift();
        state.historyIndex = state.history.length - 1;

        const field = findField(state, sectionId, fieldId);
        const rule = field?.validation?.rules?.[ruleIndex] as any;
        if (rule) {
          Object.assign(rule, updates);
        }
      }),

    removeValidationRule: (sectionId, fieldId, ruleIndex) =>
      set((state) => {
        state.history.splice(state.historyIndex + 1);
        state.history.push(JSON.parse(JSON.stringify(state.formDefinition)));
        if (state.history.length > MAX_HISTORY) state.history.shift();
        state.historyIndex = state.history.length - 1;

        const field = findField(state, sectionId, fieldId);
        if (field?.validation?.rules) {
          (field.validation.rules as any[]).splice(ruleIndex, 1);
        }
      }),

    reorderValidationRules: (sectionId, fieldId, fromIndex, toIndex) =>
      set((state) => {
        state.history.splice(state.historyIndex + 1);
        state.history.push(JSON.parse(JSON.stringify(state.formDefinition)));
        if (state.history.length > MAX_HISTORY) state.history.shift();
        state.historyIndex = state.history.length - 1;

        const field = findField(state, sectionId, fieldId);
        if (field?.validation?.rules) {
          const [moved] = (field.validation.rules as any[]).splice(
            fromIndex,
            1
          );
          (field.validation.rules as any[]).splice(toIndex, 0, moved);
        }
      }),

    // ── Condition Actions ────────────────────────────────────────────────

    setFieldConditions: (sectionId, fieldId, groups) =>
      set((state) => {
        state.history.splice(state.historyIndex + 1);
        state.history.push(JSON.parse(JSON.stringify(state.formDefinition)));
        if (state.history.length > MAX_HISTORY) state.history.shift();
        state.historyIndex = state.history.length - 1;

        const field = findField(state, sectionId, fieldId);
        if (field) {
          if (!field.meta) field.meta = {};
          field.meta.conditions = { groups };
        }
      }),

    addConditionGroup: (sectionId, fieldId) =>
      set((state) => {
        state.history.splice(state.historyIndex + 1);
        state.history.push(JSON.parse(JSON.stringify(state.formDefinition)));
        if (state.history.length > MAX_HISTORY) state.history.shift();
        state.historyIndex = state.history.length - 1;

        const field = findField(state, sectionId, fieldId);
        if (field) {
          if (!field.meta) field.meta = {};
          if (!field.meta.conditions) field.meta.conditions = { groups: [] };
          if (!field.meta.conditions.groups) field.meta.conditions.groups = [];
          field.meta.conditions.groups.push({
            action: "show",
            logic: "AND",
            rules: [{ field: "", operator: "equals", value: "" }],
          });
        }
      }),

    updateConditionGroup: (sectionId, fieldId, groupIndex, updates) =>
      set((state) => {
        state.history.splice(state.historyIndex + 1);
        state.history.push(JSON.parse(JSON.stringify(state.formDefinition)));
        if (state.history.length > MAX_HISTORY) state.history.shift();
        state.historyIndex = state.history.length - 1;

        const field = findField(state, sectionId, fieldId);
        const group = field?.meta?.conditions?.groups?.[groupIndex] as any;
        if (group) {
          Object.assign(group, updates);
        }
      }),

    removeConditionGroup: (sectionId, fieldId, groupIndex) =>
      set((state) => {
        state.history.splice(state.historyIndex + 1);
        state.history.push(JSON.parse(JSON.stringify(state.formDefinition)));
        if (state.history.length > MAX_HISTORY) state.history.shift();
        state.historyIndex = state.history.length - 1;

        const field = findField(state, sectionId, fieldId);
        if (field?.meta?.conditions?.groups) {
          (field.meta.conditions.groups as any[]).splice(groupIndex, 1);
        }
      }),
  }))
);
