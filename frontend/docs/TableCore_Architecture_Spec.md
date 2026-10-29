# TableCore: Enterprise Data Grid Engine Specification

## 1. Executive Summary

`TableCore` is a headless, schema-driven, plugin-based Data Operating System for React. It follows the Entity Component System (ECS) philosophy, strictly separating the "Physics" of the table (sorting, filtering, selection) from the "Paint" (React Virtual DOM).

It is designed to handle extreme data density (e.g., 100,000+ rows) with O(1) mathematical efficiency, zero-render cell updates, and absolute type safety.

**v1 status:** the shipping grid is TanStack + adapters in `@shared/ui/table` ([docs/table/v1](./table/v1/README.md)). ECS kernel, workers, 100k-row cell atoms, and local filter/sort/page pipelines are **not** implemented.

---

## 2. Core Architectural Philosophy

### 2.1 Headless Micro-Kernel

The `TableCore` class acts as a Micro-Kernel. It holds the raw data buffer and maintains a highly optimized Event Bus. It has **zero knowledge** of React, JSX, or the DOM.

- **State Managed:** Sorting, Pagination, Global/Column Filtering, Row Selection (Set), Expanded Rows, Column Visibility.
- **Data Flow:** Unidirectional. Raw Data ➡️ Pipeline ➡️ View Model.

### 2.2 Entity Component System (ECS) Parity

- **Entities:** Row IDs and Column IDs.
- **Components:** JSON Column Schemas (e.g., `{ id: "status", type: "badge", sortable: true }`).
- **System:** `TableCore` processes the physics.
- **Renderer:** A `withCell` React HOC that blindly renders what the engine commands.

---

## 3. Sub-Module Plugin Architecture

To prevent bundle bloat and ensure infinite extensibility, features are registered as isolated sub-modules into the Micro-Kernel pipeline.

### 3.1 `ColumnDefinitionModule` (Dynamic UI)

- Enables users to dynamically create, reorder, or resize columns.
- Synchronizes the personalized JSON column definition with the backend.
- Dynamically injects new columns into the pipeline at runtime.
- **ColumnRef Orchestration**: Exposes a `columnRef` API to allow external systems (e.g., a Sidebar or Command Palette) to programmatically hide, show, or resize columns without direct DOM access.

### 3.2 `MultiSortModule` (Composite Physics)

- Supports multi-level sorting (e.g., Sort by `Status` then by `Date`).
- Implements a priority-based sorting buffer to handle complex data ordering requirements.
- Exposes `setSortPriority(columnId, priority)` for programmatic control.

### 3.3 `BulkSelectionModule`

- Manages advanced O(1) Set operations for selection.
- Supports Shift-Click multi-select for thousands of rows without freezing the main thread.
- Exposes `exportSelectedIds()` for immediate API consumption.

### 3.4 `ExportImportModule` (Worker Offloading)

- Completely decoupled from the main thread.
- Serializes `table.data.getFiltered()` into CSV/Excel Blob payloads.
- Operates in a Web Worker to ensure the UI remains at 60FPS during massive data crunches.

### 3.5 `ViewPersistenceModule`

- Throttles and listens to user view changes (resizing, sorting, filtering).
- Persists the "View State" to `localStorage` or a remote DB.
- Re-hydrates the exact table layout upon the user's next login.

### 3.6 `ColumnPinningModule` (Sticky Orchestration)

- Manages "Left" and "Right" pinning boundaries.
- Uses CSS `sticky` positioning synchronized with the Engine's column offset calculations.
- Ensures pinned columns maintain absolute structural integrity during horizontal scrolling.

### 3.7 `DensityModulationModule`

- Orchestrates the "Information Density" of the grid (Compact, Comfortable, Spacious).
- Injects Zenith density tokens (`--gap-xs`, `--space-sm`) into the cell renderer based on the active View State.

---

## 4. The Data Pipeline

Data mutations flow strictly through registered modules before reaching the UI View Model:
`Raw API Data` ➡️ `FilterModule` ➡️ `SortModule` ➡️ `PaginationModule` ➡️ `UI Renderer`

---

## 5. React Integration & The UI Shell

### 5.1 The `withCell` Micro-Subscription (Zero-Render Grid)

Instead of re-rendering 10,000 cells when one row is selected, the architecture utilizes a `useTableCellAtom(rowId, columnId)` hook.

- Cells are "Self-Hydrating".
- A change to a single cell's state triggers a surgical Virtual DOM update strictly limited to that specific DOM node.

### 5.2 Inline Editing (FormCore Integration)

`TableCore` and `FormCore` are natively interoperable.

- If a column schema declares `editable: true`, the Table Cell Renderer mounts a `FormCore` `FieldRenderer`.
- The Table orchestrates the grid coordinates; `FormCore` orchestrates the data mutation and Zod validation physics.

### 5.3 Virtualization

Because the state is fully headless, the final View Model array is passed directly into a virtualizer (e.g., TanStack Virtual). The DOM only renders the ~20 visible rows, ensuring infinite vertical scaling.

---

## 6. Guarantees

- **Scalability:** Handles 100k+ rows with 60FPS scrolling and O(1) selection logic.
- **Extensibility:** Open/Closed Principle. New features (e.g., custom export formats) are added as isolated Plugins without modifying the Micro-Kernel.
- **Maintainability:** Complete separation of business logic (TypeScript) from the rendering layer (React/Tailwind), protected by an Anti-Corruption Layer.
