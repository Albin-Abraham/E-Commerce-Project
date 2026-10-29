import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";

import { Form } from "@form-core/form";
import type { FormField } from "@ui/form/fields";
import type { FormDefinition } from "@ui/form/types";

import type { FormFieldSchema } from "../types";

/**
 * InlineEditContext
 *
 * Provides inline editing state to cell renderers.
 * Each editing row gets its own Form instance created from column fieldSchemas.
 * This integrates with the ZenithForm architecture for full form lifecycle.
 */

export interface InlineEditContextValue {
  /** Row ID currently being edited, or null */
  editingRowId: string | null;
  /** The Form instance for the currently editing row */
  activeForm: Form | null;
  /** Column field schemas indexed by column ID */
  columnSchemas: Record<string, FormFieldSchema>;
  /** Start editing — creates a Form instance for the row */
  startEdit: (rowId: string, rowData: Record<string, unknown>) => void;
  /** Cancel editing — destroys the Form instance */
  cancelEdit: () => void;
  /** Commit — validates and calls onSubmit, then destroys the Form */
  commitEdit: () => Promise<void>;
  /** Whether a commit is in progress */
  submitting: boolean;
  /** Validation errors from the active form */
  errors: Record<string, string>;
  /** Check if a specific row is being edited */
  isEditing: (rowId: string) => boolean;
  /** Get resolved value for a cell (from form if editing, otherwise original) */
  getCellValue: (
    rowId: string,
    colId: string,
    originalValue: unknown
  ) => unknown;
  /** Get the FormField for a column (for FieldRenderer) */
  getFieldForColumn: (colId: string) => FormField | undefined;
}

export const InlineEditContext = createContext<InlineEditContextValue | null>(null);

function buildFormDefinition(
  columnSchemas: Record<string, FormFieldSchema>
): FormDefinition {
  const fields: FormField[] = Object.entries(columnSchemas).map(
    ([colId, schema]) => ({
      id: schema.id || colId,
      name: colId,
      label: schema.label,
      type: schema.type,
      initialValue: schema.initialValue,
      required: schema.required,
      visible: schema.visible !== false,
      enabled: schema.enabled !== false,
      options: schema.options,
      validation: schema.validation,
      properties: schema.properties,
    })
  );

  return {
    id: `inline-edit-${Date.now()}`,
    title: "Inline Edit",
    sections: [
      {
        id: "inline-edit-section",
        title: "",
        fields,
      },
    ],
  };
}

function buildFormFieldMap(
  columnSchemas: Record<string, FormFieldSchema>
): Record<string, FormField> {
  const map: Record<string, FormField> = {};
  for (const [colId, schema] of Object.entries(columnSchemas)) {
    map[colId] = {
      id: schema.id || colId,
      name: colId,
      label: schema.label,
      type: schema.type,
      initialValue: schema.initialValue,
      required: schema.required,
      visible: schema.visible !== false,
      enabled: schema.enabled !== false,
      options: schema.options,
      validation: schema.validation,
      properties: schema.properties,
    };
  }
  return map;
}

export interface InlineEditProviderProps {
  children: React.ReactNode;
  /** Column schemas indexed by column ID */
  columnSchemas?: Record<string, FormFieldSchema>;
  /** Called when user commits changes */
  onSubmit?: (rowId: string, changes: Record<string, unknown>) => Promise<void>;
  /** Optional validation before commit */
  validate?: (
    rowId: string,
    changes: Record<string, unknown>
  ) => Record<string, string> | null;
}

export function InlineEditProvider({
  children,
  columnSchemas = {},
  onSubmit,
  validate,
}: InlineEditProviderProps) {
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [activeForm, setActiveForm] = useState<Form | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const formRef = useRef<Form | null>(null);
  const editingRowIdRef = useRef<string | null>(null);

  const fieldMap = useMemo(
    () => buildFormFieldMap(columnSchemas),
    [columnSchemas]
  );

  const startEdit = useCallback(
    (rowId: string, rowData: Record<string, unknown>) => {
      // Destroy previous form if exists
      if (formRef.current) {
        formRef.current = null;
      }

      const definition = buildFormDefinition(columnSchemas);
      const form = new Form(definition, rowData);

      formRef.current = form;
      editingRowIdRef.current = rowId;
      setEditingRowId(rowId);
      setActiveForm(form);
      setErrors({});
    },
    [columnSchemas]
  );

  const cancelEdit = useCallback(() => {
    formRef.current = null;
    editingRowIdRef.current = null;
    setEditingRowId(null);
    setActiveForm(null);
    setErrors({});
  }, []);

  const commitEdit = useCallback(async () => {
    const form = formRef.current;
    const rowId = editingRowIdRef.current;
    if (!form || !rowId) return;

    const isValid = await form.submit();
    if (!isValid) {
      const formErrors: Record<string, string> = {};
      for (const [id, validity] of Object.entries(form.validity ?? {})) {
        if (validity && !validity.valid) {
          const msg = validity.errors?.[0]?.message;
          if (msg) formErrors[id] = msg;
        }
      }
      setErrors(formErrors);
      return;
    }

    // External validation
    if (validate) {
      const validationErrors = validate(rowId, form.values);
      if (validationErrors) {
        setErrors(validationErrors);
        return;
      }
    }

    setSubmitting(true);
    try {
      await onSubmit?.(rowId, form.values);
      // Success — destroy form
      formRef.current = null;
      editingRowIdRef.current = null;
      setEditingRowId(null);
      setActiveForm(null);
      setErrors({});
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Save failed";
      setErrors({ _form: msg });
    } finally {
      setSubmitting(false);
    }
  }, [onSubmit, validate]);

  const isEditing = useCallback(
    (rowId: string) => editingRowId === rowId,
    [editingRowId]
  );

  const getCellValue = useCallback(
    (rowId: string, colId: string, originalValue: unknown) => {
      if (editingRowId !== rowId || !activeForm) return originalValue;
      const formValues = activeForm.values;
      return colId in formValues ? formValues[colId] : originalValue;
    },
    [editingRowId, activeForm]
  );

  const getFieldForColumn = useCallback(
    (colId: string) => fieldMap[colId],
    [fieldMap]
  );

  const value = useMemo<InlineEditContextValue>(
    () => ({
      editingRowId,
      activeForm,
      columnSchemas,
      startEdit,
      cancelEdit,
      commitEdit,
      submitting,
      errors,
      isEditing,
      getCellValue,
      getFieldForColumn,
    }),
    [
      editingRowId,
      activeForm,
      columnSchemas,
      startEdit,
      cancelEdit,
      commitEdit,
      submitting,
      errors,
      isEditing,
      getCellValue,
      getFieldForColumn,
    ]
  );

  return (
    <InlineEditContext.Provider value={value}>
      {children}
    </InlineEditContext.Provider>
  );
}

export function useInlineEditContext(): InlineEditContextValue {
  const ctx = useContext(InlineEditContext);
  if (!ctx) {
    throw new Error(
      "[ZenithTable] useInlineEditContext must be used inside an <InlineEditProvider>."
    );
  }
  return ctx;
}

/** Returns null outside a provider so display cells can render without throwing. */
export function useOptionalInlineEditContext(): InlineEditContextValue | null {
  return useContext(InlineEditContext);
}

export const useInlineEdit = useInlineEditContext;
