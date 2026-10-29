> [!WARNING]
> **ARCHIVED / HISTORICAL DOCUMENTATION (v1 MDAP)**
> This documentation describes the legacy v1 MDAP architecture and has been archived.
> For active development, please refer to the modern **[v2 Form Architecture](../../form/FORM_ARCHITECTURE.md)**, **[Quick Start Guide](../../form/QUICK_START.md)**, and **[Detail Renderers Guide](../../form/DETAIL_RENDERERS.md)**.

# Form Engine v1 Architecture (MDAP) [ARCHIVED]

Welcome to the ZenOS Form Architecture (v1) documentation. This architecture represents a headless, data-centric, and multi-layered approach to form state management and UI rendering.

## The MDAP Architectural Paradigm

At the core of the v1 Form Engine is the **MDAP (Multi-Domain Application Platform) Model**. Instead of treating forms as monolithic React components, a form is compiled from multiple decoupled layers.

The MDAP compiler orchestrates four distinct layers:

1. **Content Layer**: The domain logic. What data is being collected, data types, validation schemas, and fields.
2. **Behavior Layer**: The side-effect logic. Middleware pipelines, remote data fetching, and execution callbacks.
3. **Surface Layer**: The spatial layout. Decides if the form is a single-page Simple Form or a Multi-Step Wizard, density, and grid constraints.
4. **Presentation Layer**: The visual identity. Applies Design Tokens, Data-Centric Styling (DCS) classes, and thematic overrides via BEM-compliant wrappers.

---

## ⚠️ Important Architectural Rule: Entity vs. Form Definition

There is a strict boundary between Authoring a form and Running a form.

### The Problem: Flattened Implementations

In early iterations (and some Storybook showcases), developers wrote **Flattened Implementations**. They manually created `FormDefinition` objects and passed them directly into `<Form>`.
This violates the MDAP architecture because it tightly couples the Surface/Presentation layers directly into the domain logic, making the form impossible to reuse across different surfaces (like a mobile app vs a dense admin portal).

### The Solution: `EntityDefinition` & The MDAP Compiler

1. You must author your forms using the **`EntityDefinition`** interface (`src/shared/ui/form/types/application.ts`). This interface enforces the strict separation of `content`, `behavior`, `surface`, and `presentation` blocks.
2. You then pass this entity into **`compileEntityToFormDef()`** (`src/shared/ui/form/utils/mdap-compiler.ts`).
3. The compiler safely flattens these 4 layers into a runtime-optimized `FormDefinition` that the headless engine can consume.

_See the [Getting Started Guide](./GETTING_STARTED.md) for the exact code implementation of this pipeline._

---

## Module Organization

The codebase is strictly organized to map to the MDAP layers. All modules are located in `src/shared/ui/form`:

### 1. [Core Engine (`/core`)](./STATE_AND_ENGINE.md)

_Handles Content & Behavior Layers._
The headless state machine (`FormCore`), the 5V State Matrix, Event Pipeline, Middleware, and React bindings (`ReactFormAdapter`).

### 2. [User Interface (`/ui`)](./RENDERING_AND_ROUTING.md)

_Handles the Surface Layer._
The presentation components, `FieldRouter`, `FieldRenderer`, and the UI resolution pipeline.

### 3. [Styling & Design (`/styling`)](./RENDERING_AND_ROUTING.md#3-the-atomic-component-system--withatom)

_Handles the Presentation Layer._
The Data-Centric Styling (DCS) system (`withAtom`), and the Wrapper Trinity.

---

## 📚 Deep Dives & Rules

- **[Rules & Anti-Patterns](./RULES_AND_ANTI_PATTERNS.md)**: Strict architectural do's and don'ts (like avoiding the God Component).
- **[State & Engine Architecture](./STATE_AND_ENGINE.md)**: How the headless 5V state matrix and pipeline work.
- **[Rendering & Routing Architecture](./RENDERING_AND_ROUTING.md)**: How JSON schemas are safely converted into React Atomic components.
- **[Getting Started Guide](./GETTING_STARTED.md)**: How to compile an EntityDefinition.
- **[API Reference](./API_REFERENCE.md)**: Auto-generated index of the engine.
