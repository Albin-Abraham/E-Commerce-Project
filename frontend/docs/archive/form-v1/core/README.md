> [!WARNING]
> **ARCHIVED / HISTORICAL DOCUMENTATION (v1 MDAP)**
> This documentation describes the legacy v1 MDAP architecture and has been archived. For active development, refer to the current **[v2 Form Architecture](../../../form/FORM_ARCHITECTURE.md)** and **[Documentation Index](../../../form/README.md)**.

# Core Engine Documentation

The Core Engine is the heart of the v1 Form Architecture, located primarily in `src/shared/ui/form/core`. It implements the **Content and Behavior Layers** within the MDAP paradigm.

## File-by-File Implementation Analysis

### `core/engine.ts` (The Headless Composition Root)

`FormCore` is the framework-agnostic composition root for all form modules. It runs perfectly in Node.js or React, orchestrating 9 single-responsibility modules:

- `FieldRegistry` / `FieldResolver`: For O(1) field lookups and nested repeater path resolution.
- `StateManager`: Owns the 5V State Matrix.
- `FormValidator`: Manages plugin-based validation adapters (e.g., Zod, Yup).
- `FormVisibility`: Handles cascading show/hide logic.
- `FormExecution`: Orchestrates the `setValue` pipeline and triggers middlewares.

**Validation Modes** supported by the engine:

- `onChange`: Triggers immediately on keystrokes.
- `onBlur`: Triggers when a field loses focus (default).
- `onSubmit`: Delays validation until submission.
- `manual`: Validates only via direct API calls.
- `lazy`: Acts as `onBlur` until the first submit, then switches to `onChange`.

**Payload Generation**:
When generating the final API payload via `form.getPayload()`, the engine runs a deep clone and automatically strips any field defined as `ephemeral: true` in the schema.

### `hooks/useFieldViewModel.ts` (Atomic Subscriptions)

This hook is the critical performance boundary for the Form Engine.
Rather than passing the entire form state down via props, individual React components call `useFieldViewModel("field_id")`. This uses `useField` internally to subscribe _only_ to updates for that specific field.

**Prop Flattening**:
The hook flattens nested `inputProps` (`onChange`, `onBlur`, `value`, `errors`) and merges them with runtime metadata like `isLoading`, `options` (fetched via `RemoteOptionsManager`), `isInvalid`, and `isEmpty`. This flat structure is essential for the styling HOC (`withAtom`) to intercept and layout without tight coupling.

### Execution Pipeline & Middleware

When a user types into an input:

1. `handleDelegatedChange` catches the event.
2. `setValue` updates the `Values (V1)` matrix.
3. The `FormValidator` assesses the new value.
4. **Middleware** executes (cross-field dependencies).
5. `FormVisibility` checks if the new value hides/shows other branches.
6. The engine notifies subscribed hooks, updating _only_ the affected fields.
