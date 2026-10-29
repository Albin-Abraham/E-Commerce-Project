> [!WARNING]
> **ARCHIVED / HISTORICAL DOCUMENTATION (v1 MDAP)**
> This documentation describes the legacy v1 MDAP architecture and has been archived. For active development, refer to the current **[v2 Form Architecture](../../../form/FORM_ARCHITECTURE.md)** and **[Documentation Index](../../../form/README.md)**.

# User Interface (UI) Layer

The UI layer (`src/shared/ui/form/components`, `fields`, `shell`, `layout`, `surfaces`) is the implementation of the **Surface Layer** in the MDAP paradigm. It evaluates schema layout settings and orchestrates the DOM rendering.

## File-by-File Implementation Analysis

### `components/FormShell.tsx` (The Layout Orchestrator)

The `FormShell` is the primary orchestrator that mounts the entire structure by evaluating `definition.settings.wizard.enabled`.

**Simple Form Path**:
If `isWizard` is false, it uses `<StepRenderer>` to immediately pass the entire node array into `FormComposer`. It wraps the UI in `<FormHeader>`, `<FormBody>`, and `<FormFooter>`.

**Flow Wizard Path**:
If `isWizard` is true, the `FormShell` mounts `<FormStepper>` (sidebar or top). Crucially, the `<StepRenderer>` filters the nodes using `nodes.filter((node) => node.id === currentStepId)`, passing only the active step's fields into the `FormComposer`.

### `components/FormComposer.tsx` (The Grid Assembler)

The `FormComposer` is completely unaware of whether it is inside a Wizard or a Simple form. It simply takes an array of fields and maps them into the DOM.

- It calculates dynamic spacing using `FormMetricsAnalyzer`.
- It wraps the children in `AnimatePresence` to enable smooth layout transitions.
- It iterates over the nodes, passing them to `SectionComposer` (for grid wrapping) or `FieldRouter` (for atomic component mapping).

### `components/Form.tsx` (The Root Boundary)

This is the main entry point exported to application code.

- It calls `useForm()` to hydrate the core engine (`FormCore`).
- It wires up `react-router-dom`'s `useBlocker` to automatically prevent navigation if `form.isDirty` is true.
- It wraps the UI in `FormRuntimeProvider` and `FormShellProvider`.
- It intercepts the submit payload and forwards it to the host component's `onSubmit` or `actions.submit` handlers, mapping returned server errors back into the core engine via `setServerErrors`.
