> [!WARNING]
> **ARCHIVED / HISTORICAL DOCUMENTATION (v1 MDAP)**
> This documentation describes the legacy v1 MDAP architecture and has been archived. For active development, refer to the current **[v2 Form Architecture](../../form/FORM_ARCHITECTURE.md)**, **[Quick Start Guide](../../form/QUICK_START.md)**, and **[Documentation Index](../../form/README.md)**.

# 🎨 V1 Rendering & Routing Architecture

The V1 MDAP Form architecture strictly separates the **State Engine** from the **React Rendering Tree**. When a schema is processed, the rendering layer dynamically resolves and mounts the correct UI components without coupling the domain logic to the UI.

This document covers the UI resolution pipeline: from the `FieldRouter` down to the `FieldRenderer` and the `withAtom` wrappers.

---

## 1. 🔀 The `FieldRouter`

The `FieldRouter` is the primary layout orchestrator. It receives a structured `FormDefinition` (including Sections and Fields) and recursively walks the layout tree.

### Responsibilities:

1. **Layout Parsing:** Understands grid structures, `columnSpan`, `rowSpan`, and grouping (like `FieldsetField` or `ContainerField`).
2. **Context Passing:** Wraps the entire form inside the `FormRegistryContext` and `FormOrchestratorContext` to provide dependency injection for sub-components.
3. **Delegation:** Does not render input components directly; instead, it delegates every individual field to the `FieldRenderer`.

---

## 2. 🎭 The `FieldRenderer`

The `FieldRenderer` acts as the **Dynamic Component Resolver**. For any given `field` object in the schema, it determines _which_ actual React component should be painted on the screen.

### The Resolution Pipeline:

When the `FieldRenderer` is given a field, it uses the `FormRegistry` (via `useFormRegistry`) to find the component:

1. **Explicit Root Override:** If `field.component` is defined, it uses it.
2. **Semantic Meta Override:** If `field.meta.ui.component` is defined (e.g., `"email"`), it looks up that string in the Registry.
3. **Type Fallback:** If no overrides exist, it looks up `field.type` (e.g., `"text"`, `"select"`) in the Registry.

### The View Model (`useFieldViewModel`):

Before mounting the resolved component, the `FieldRenderer` calls `useFieldViewModel(field.id)`.
This custom hook subscribes to the headless `FormCore` state and generates standard React props (`value`, `onChange`, `onBlur`, `isInvalid`). These props are then passed down to the resolved atomic component.

---

## 3. ⚛️ The Atomic Component System & `withAtom`

In V1, all UI components (`TextField`, `SelectField`) are completely "dumb". They only accept standard HTML-like props.

To apply complex layouts (Labels, Error Messages, Icons, Inline Editing), they are wrapped in a High-Order Component (HOC) called `withAtom`.

### The `withAtom` Wrapper (Data Component System Layer)

`withAtom` is the visual orchestrator for an individual field. It applies the "Wrapper Trinity":

1. **`OuterWrapper`:** Handles prefix/suffix icons, tooltips, and interactive slot injections (like password reveal buttons).
2. **`InputWrapper`:** Handles the field label, validation styling, and the error feedback (`FieldFeedback`).
3. **The Core Input:** The raw atomic component (e.g., `TextField`) is rendered inside.

By using `withAtom`, developers building new features only have to build the raw input (the inner element) and the system automatically handles all labels, layout spacing, and error animations.

---

## 4. 🗃️ The Component Registry

The `FieldRegistry` (located in `registry.tsx`) maps the schema string types to the `withAtom`-wrapped components.

```tsx
export const fieldRegistry: Record<string, FieldComponent> = {
  text: withAtom(TextField),
  select: withAtom(SelectField),
  email: withAtom(TextField), // Alias rendering TextField but via "email" semantic
  header: withAtom(HeaderField, { showLabel: false, wrapOuter: false }), // Headless rendering
};
```

This Inversion of Control means the Form Engine is completely decoupled from your UI library. You can swap out HeroUI for another library entirely just by updating this registry file.
