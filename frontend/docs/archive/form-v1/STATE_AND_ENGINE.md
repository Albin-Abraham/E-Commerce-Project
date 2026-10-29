> [!WARNING]
> **ARCHIVED / HISTORICAL DOCUMENTATION (v1 MDAP)**
> This documentation describes the legacy v1 MDAP architecture and has been archived. For active development, refer to the current **[v2 Form Architecture](../../form/FORM_ARCHITECTURE.md)**, **[Quick Start Guide](../../form/QUICK_START.md)**, and **[Documentation Index](../../form/README.md)**.

# 🧠 V1 State & Engine Architecture

The V1 MDAP Form architecture is built on a headless, framework-agnostic state engine (`FormCore`). It manages state, validation, and side effects independently from React.

---

## 1. 📊 The 5V State Matrix

To prevent the "God State" anti-pattern, `FormCore` divides form state into five distinct vectors, ensuring O(1) reactivity and complete predictability:

1. **Values (V1):** The raw data payload (`{ "username": "alice" }`). Managed via the `ValueProxy` for deep path resolution.
2. **Validity (V2):** Validation state (`{ valid: false, errors: [...] }`).
3. **Visibility (V3):** Boolean state determining if a field is rendered. Hidden fields typically clear their values dynamically.
4. **View (V4):** Dynamic UI state (e.g., loading spinners, dropdown options fetched from an API).
5. **Vitality (V5):** Interaction state (`touched`, `dirty`, `focused`).

By splitting state, an API fetching event (View) doesn't trigger a re-render of Validation (Validity).

---

## 2. ⚡ FormExecution & The Event Pipeline

When a user types into a field, the `ReactFormAdapter` triggers `core.setValue()`. This is intercepted by the `FormExecution` module, which orchestrates the following pipeline:

1. **Immediate Write:** The value is written to the `ValueProxy` and the field is marked as `dirty`. A synchronous notification is sent to the UI to update the keystroke instantly.
2. **Middleware Execution:** The engine runs all registered middleware (e.g., "If Company is selected, fetch Business Units").
3. **Validation Evaluation:** Depending on the `validationMode` (e.g., `onChange`, `onBlur`), the engine triggers the `FormValidator`.
4. **Visibility Evaluation:** The engine checks if the new value causes any other fields to hide or show based on their conditions.

---

## 3. 🔌 The `ReactFormAdapter`

`FormCore` has zero knowledge of React. The `ReactFormAdapter` is the anti-corruption layer that bridges the headless engine to the UI.

It generates the `FieldViewModelProps` for `FieldRenderer`.
Crucially, it intercepts React events like `onChange` and converts them into Engine Commands:

```tsx
// Inside ReactFormAdapter:
onChange: (val) => {
  // Pre-process (e.g., trim, lowercase)
  if (field.onChange) val = field.onChange(val, field, values);
  // Send to headless engine
  core.setValue(field.name, val);
};
```

---

## 4. 🪝 The Middleware System

The engine supports asynchronous middleware. This is how complex side-effects (like dependent dropdowns or auto-filling values) are handled without cluttering the UI components.

When you create a `BehaviorDefinition`, you define pipeline middleware:

```typescript
const behavior = {
  pipeline: {
    middleware: [
      ({ form, fieldId }) => {
        if (fieldId === "company") {
          // Fetch branches automatically when company changes
          form.remoteOptions.executeSearch("branch");
        }
      },
    ],
  },
};
```

This ensures the UI remains purely visual and declarative.
