> [!WARNING]
> **ARCHIVED / HISTORICAL DOCUMENTATION (v1 MDAP)**
> This documentation describes the legacy v1 MDAP architecture and has been archived. For active development, refer to the current **[v2 Form Architecture](../../form/FORM_ARCHITECTURE.md)**, **[Quick Start Guide](../../form/QUICK_START.md)**, and **[Documentation Index](../../form/README.md)**.

# MDAP Architecture: Rules and Anti-Patterns

> **Supersession note:** The authoring rules below describe the v1 MDAP mandate (`EntityDefinition` + `compileEntityToFormDef`, flattened definitions banned). The v2 architecture reverses key parts of this: flattened `FormDefinition` literals are the current default (see the [v2 Quick Start](../../form/QUICK_START.md)), while contracts and MDAP remain optional pathways (see [Contracts & MDAP](../../form/CONTRACTS_AND_MDAP.md)). Treat this file as historical context, not current guidance.

The MDAP (Multi-Domain Application Platform) architecture relies on strict boundaries to ensure the form engine remains headless, scalable, and domain-agnostic.

This document outlines the core Rules (Do's) and Anti-Patterns (Don'ts) for developing and extending the `shared/ui/form` engine.

---

## 1. 🛑 Anti-Patterns (What NOT to Do)

These patterns violate the core principles of MDAP and will degrade the scalability of the application.

### 1.1. The "God Component" Anti-Pattern

**The Problem**: Hardcoding domain-specific UI logic directly into the generic `shared/ui` form components.
**Example**: Modifying `shared/ui/form/fields/AutocompleteField.tsx` to include `if (options.type === 'employee') return <EmployeeCard />`.
**Why it's bad**: It tightly couples the generic engine to a specific business domain. Every new feature will require modifying the core, breaking the Open/Closed Principle.

### 1.2. The "React Node in Schema" Anti-Pattern

**The Problem**: Injecting raw React components or JSX into your JSON/Entity schema.
**Example**: `{ id: "user", customSlot: <MyReactNode /> }`
**Why it's bad**: Form schemas must remain serializable (JSON-friendly). If you put React nodes in the schema, it can no longer be generated dynamically by a backend, saved in a database, or passed across network boundaries safely.

### 1.3. The "Flattened Implementation" Anti-Pattern

**The Problem**: Manually defining a `FormDefinition` object (which includes layout, UI, and domain logic all mixed together) and passing it directly into the `<Form>` component.
**Why it's bad**: It tightly couples the Surface/Presentation layers directly into the domain logic, making the form impossible to reuse across different surfaces (e.g., mobile vs. desktop).

### 1.4. The "Raw API Response" Anti-Pattern

**The Problem**: Passing raw, unmapped backend API payloads directly into UI components for them to parse.
**Why it's bad**: UI components should not know the shape of your backend database. It breaks separation of concerns.

### 1.5. The "Loop-in-Loop" (JSON UI Framework) Anti-Pattern

**The Problem**: Building a recursive UI rendering engine (like an `AtomicRenderer`) that parses complex `itemTemplate: { atoms: [...] }` arrays from inside the JSON schema.
**Why it's bad**: You are rebuilding a UI framework inside a JSON payload (a loop-in-loop). It makes schemas unreadable, overly verbose, and blurs the boundary between the Form Engine (data/state) and the Atomic Component System (presentation). Forms should define data semantics, not pixel-level atom compositions.

---

## 2. ✅ Core Rules (What to Do)

Follow these architectural patterns to maintain a clean MDAP implementation.

### 2.1. Author via `EntityDefinition`

Always author your forms using the decoupled `EntityDefinition` interface, separating your configuration into:

1. **Content**: What data is being collected.
2. **Behavior**: Side-effect logic, API calls, and middleware.
3. **Surface**: Layout constraints and routing (Wizard vs Simple).
4. **Presentation**: DCS styling and tokens.

Use the `mdap-compiler` (`compileEntityToFormDef`) to fuse these layers together at runtime.

### 2.2. The Field Registry Extension Pattern (Inversion of Control)

When you need a complex, domain-specific field (e.g., an Employee Dropdown that shows avatars and badges):

1. **Keep Base Generic**: The `shared/ui` fields should only accept standard props.
2. **Create Domain Field in Features**: Build your rich component inside your feature layer (`src/features/employees/components/...`).
3. **Register Dynamically**: Inject it into the form engine using the field registry (`defaultRegistry`, formerly `fieldRegistry`).

   ```typescript
   import { EmployeeSelectField } from "@/features/employees";
   import { defaultRegistry } from "@ui/form";

   // Register without modifying shared/ui
   defaultRegistry.register("feature-employee-select", EmployeeSelectField);
   ```

### 2.3. Remote Data Normalization Pattern (The `meta` slice)

When your `RemoteOptionsManager` fetches data, use the Behavior layer to normalize the complex payload into a standard `OptionItem` before the UI sees it.

**Standard:**

```typescript
interface OptionItem {
  value: string;
  label: string;
  meta?: Record<string, any>; // Pass avatars, subtitles, and badges here!
}
```

The generic UI component will read from the `meta` object to render custom slots, completely unaware of the underlying "Employee" domain.

### 2.4. Schema-Driven Slot Configuration

If you must use a generic component but want it to render richly, pass intent strings via `componentProps.slotTemplate` in your schema.

```json
{
  "id": "department_id",
  "type": "async-select",
  "componentProps": {
    "slotTemplate": "avatar-list-item"
  }
}
```

Let the UI layer resolve the string `"avatar-list-item"` to a React renderer via a internal **Slot Registry**. This keeps the schema 100% serializable.

### 2.5. Semantic Display Configuration (The Clean Boundary)

Instead of relying on heavy `SlotRegistries` or recursive atomic renderers for standard rich UI (like Avatars and Subtitles), standardize your generic fields to accept **Semantic Data Keys**. This provides a clean boundary where the Form Engine knows _what_ data to display, but the DCS/ACS layer natively handles the _how_.

**Standard Semantic Mapping:**

```json
{
  "id": "assigned_user",
  "type": "async-select",
  "meta": {
    "ui": {
      "displayConfig": {
        "titleKey": "label",
        "subtitleKey": "meta.role",
        "avatarKey": "meta.avatarUrl",
        "statusKey": "meta.status"
      }
    }
  }
}
```

If a field's requirements go beyond these standard semantic configurations (e.g., embedding an interactive chart inside a dropdown), it should be extracted into a custom feature component and registered via the **Field Registry Extension Pattern** (Rule 2.2).

## 3. 🏛️ The Two Pillars of Complex Fields

When building highly interactive, data-heavy fields (like an `async-tree-select` that lazy-loads children from an API), rely entirely on these two pillars to keep `shared/ui` pristine:

### 3.1. The Data Provider Pattern (Behavior Layer)

**Solves:** "Where does the messy API logic go?"

- The UI component never makes HTTP requests (no `fetch` or `axios` in UI code).
- The `BehaviorDefinition` configures a **Data Provider** (e.g., `RemoteOptionsManager`).
- The UI emits generic events (e.g., `FETCH_CHILDREN`), and the Data Provider intercepts these to handle the URL, network request, pagination, and data mapping.
- The result is that the UI stays 100% agnostic to your backend infrastructure.

### 3.2. Definition-Driven Atomic Composition (Presentation Layer)

**Solves:** "How do we render rich UI without hardcoding React nodes?"

- Do not pass raw React `<Slot />` components in schemas. Instead, the schema defines **Semantic Keys** (as shown in Rule 2.5).
- The core UI fields read these semantic keys and use their internal **Atomic Component System (ACS)** to natively compose the visual layout.
- The result is that the schema remains 100% pure JSON, avoiding the "Loop-in-Loop" anti-pattern while effortlessly supporting rich visual components.

---

_Following these guidelines ensures that the core Form Architecture remains pristine, robust, and infinitely extensible._
