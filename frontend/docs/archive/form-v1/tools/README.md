> [!WARNING]
> **ARCHIVED / HISTORICAL DOCUMENTATION (v1 MDAP)**
> This documentation describes the legacy v1 MDAP architecture and has been archived. For active development, refer to the current **[v2 Form Architecture](../../../form/FORM_ARCHITECTURE.md)** and **[Documentation Index](../../../form/README.md)**.

# Tools & Configuration

The tools module (`src/shared/ui/form/tools`, `builder`, `manifest`, `utils`) provides Developer Experience (DX) utilities, schema normalization, and configuration standards.

## Form Builder (`/builder`)

Instead of writing large, complex JSON schemas by hand, the builder module provides fluent APIs and factory functions to programmatically construct `FormDefinition` objects.

- **Type-Safety**: Enforces TypeScript integrity when defining fields.
- **Composability**: Allows developers to compose reusable form chunks and merge them together prior to passing the final schema to the `FormShell`.

## Component Registry & Manifests (`/manifest`)

- **Manifest Definitions**: Defines the standard schemas, default properties, and metadata configurations for all supported field types. This acts as the single source of truth for what properties a `type: "text"` or `type: "select"` field can accept.
- **Registry Injection**: The `ManifestRegistry` is mapped by the engine so that abstract strings in the JSON (`type: "switch"`) dynamically resolve to the actual physical React component without tight coupling.

## Utilities & Debugging (`/utils`, `/tools`)

- **`SchemaNormalizer`**: Runs before a form mounts to automatically fix common schema issues, assign unique IDs if missing, and prepare the tree for rendering.
- **`FormDevTools` & `FormDebugOverlay`**: When `debug=true` is passed to the `<Form />`, these tools activate. They provide visual metrics, performance tracing, state snapshot debugging, and execution timers to observe side-effects and middleware execution.
