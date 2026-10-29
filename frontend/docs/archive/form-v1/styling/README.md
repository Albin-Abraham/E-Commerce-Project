> [!WARNING]
> **ARCHIVED / HISTORICAL DOCUMENTATION (v1 MDAP)**
> This documentation describes the legacy v1 MDAP architecture and has been archived. For active development, refer to the current **[v2 Form Architecture](../../../form/FORM_ARCHITECTURE.md)** and **[Documentation Index](../../../form/README.md)**.

# Styling & DCS Layer

The Styling module (`src/shared/ui/form/styles`, `hoc`, `atoms`, `scss`) implements the **Presentation Layer** of the MDAP architecture. It enforces **Data-Centric Styling (DCS)** across the Form Architecture.

## File-by-File Implementation Analysis

### `hoc/withAtom.tsx` (The DCS Boundary)

The `withAtom` Higher-Order Component (HOC) is arguably the most important file in the presentation layer. It wraps every atomic input field (e.g., `TextField`, `SelectField`) and enforces a strict separation between domain logic and CSS layout.

**Key Features Implemented:**

1. **Prop Interception**: It takes the flattened props from `useFieldViewModel`, extracts the layout and error details, and passes only "clean props" down to the raw `<input>`.
2. **Inline Edit Metamorphosis**: It tracks a local `isInlineEditing` state to automatically switch a field between `edit` and `view` mode, intercepting hover events to display a pencil icon.
3. **Headless Bypass**: If a schema node is defined as `headless: true`, `withAtom` bypasses the Wrapper Trinity entirely, rendering only the base component. This is essential for rendering pure UI components like buttons and dividers.
4. **Automated Icon Resolution**: Scans `field.meta.ui.icon` and automatically wraps the input with leading icons, or trailing tooltips (via `<HelpText>`) based on the schema's `tooltipPlacement`.

### The Wrapper Trinity

When not in headless mode, `withAtom` delegates the layout to the Wrapper Trinity:

1. **`InputWrapper.tsx`**: The outermost structure inside the field block. It coordinates the `<FieldLabel>` placement (`top`, `left`) and the `<FieldFeedback>` (validation messages) at the bottom.
2. **`OuterWrapper.tsx`**: Defines the physical boundaries of the input field. It injects the `startContent` (icons) and `endContent` (toggles) passed down from `withAtom`.
3. **Input Component**: The pure React element.

## Styles & SCSS (`/styles`, `/scss`)

- **Utility Generation**: Utilities like `getFieldLayout` transform schema properties into specific spacing configurations (`gap-4`, `p-4`) dynamically.
- **SCSS Overrides**: Handled structurally via BEM-compliant classes injected by the wrappers (e.g., `.form-field-container`).
