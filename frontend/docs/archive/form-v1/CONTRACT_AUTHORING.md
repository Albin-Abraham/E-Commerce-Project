# Type-Safe Contract Authoring

The **Contract API** is the recommended way to author forms in the v1 MDAP architecture. It provides full TypeScript inference, discriminated unions for field types, and a fluent builder pattern that catches errors at compile time.

---

## Why Contracts Over EntityDefinition?

| Aspect | `EntityDefinition` (MDAP) | `defineFormContract` (Contracts) |
|--------|---------------------------|----------------------------------|
| **Type Safety** | Partial - manual type annotations needed | Full - `const` inference + discriminated unions |
| **Field Types** | String-based (`type: "text"`) | Discriminated unions (`component: "text" \| "email"`) |
| **Options** | Any array | `ReadonlyArray<FieldOption>` with typed values |
| **Inference** | Manual `InferFormValues` | Automatic from contract |
| **Validation** | Separate `ValidationSettings` | Inline per-field |
| **Wizard Flow** | Manual `settings.wizard` | `withWizard()` helper |

---

## Quick Start

```typescript
import { defineFormContract, compileContractToFormDefinition } from "@/shared/ui/form";

const UserProfileContract = defineFormContract({
  id: "user-profile",
  title: "User Profile",
  submitLabel: "Save Profile",
  sections: [
    {
      id: "basic",
      title: "Basic Information",
      layout: { type: "grid", columns: 12, gap: "md" },
      fields: [
        {
          id: "firstName",
          name: "firstName",
          type: "string",
          component: "text",
          label: "First Name",
          required: true,
          layout: { columnSpan: 6 },
          properties: { placeholder: "John" },
        },
        {
          id: "lastName",
          name: "lastName",
          type: "string",
          component: "text",
          label: "Last Name",
          required: true,
          layout: { columnSpan: 6 },
          properties: { placeholder: "Doe" },
        },
        {
          id: "email",
          name: "email",
          type: "string",
          component: "email",
          label: "Email",
          required: true,
          layout: { columnSpan: 12 },
          properties: { placeholder: "john@example.com" },
        },
        {
          id: "role",
          name: "role",
          type: "string",
          component: "select",
          label: "Role",
          required: true,
          layout: { columnSpan: 12 },
          options: [
            { label: "Admin", value: "admin" },
            { label: "User", value: "user" },
            { label: "Viewer", value: "viewer" },
          ],
        },
      ],
    },
  ],
});

// Compile to runtime FormDefinition
const schema = compileContractToFormDefinition(UserProfileContract);

// Type-safe form data inference
type UserProfileData = InferFormValues<typeof UserProfileContract>;
// { firstName: string; lastName: string; email: string; role: "admin" | "user" | "viewer" }
```

---

## Field Contracts Reference

All field contracts are **discriminated unions** keyed by `type` + `component`.

### Text Variants (`type: "string"`)

```typescript
// Text input
{ type: "string", component: "text", ... }

// Email input (HTML5 validation)
{ type: "string", component: "email", ... }

// Password (masked)
{ type: "string", component: "password", ... }

// URL input
{ type: "string", component: "url", ... }

// Textarea
{ type: "string", component: "textarea", properties: { rows: 4 } }

// Search input
{ type: "string", component: "search_input", ... }

// Code editor
{ type: "string", component: "code", properties: { language: "typescript" } }

// Phone (with mask)
{ type: "string", component: "phone", properties: { mask: "(999) 999-9999" } }
```

**Shared Properties:**
```typescript
properties?: {
  placeholder?: string;
  maxLength?: number;
  minLength?: number;
  rows?: number;           // textarea only
  mask?: string;           // phone only
  language?: string;       // code only
}
```

### Select Variants (`type: "string"`)

```typescript
// Native select
{ type: "string", component: "select", options: [...] }

// Autocomplete (searchable)
{ type: "string", component: "autocomplete", options: [...] }
```

**Options are required and typed:**
```typescript
options: ReadonlyArray<FieldOption<"admin" | "user" | "viewer">>;
// or inline:
options: [
  { label: "Admin", value: "admin" },
  { label: "User", value: "user" },
] as const;
```

### MultiSelect (`type: "array"`)

```typescript
{
  type: "array",
  component: "multiselect",
  name: "tags",
  label: "Tags",
  options: [
    { label: "Frontend", value: "fe" },
    { label: "Backend", value: "be" },
  ],
  properties: { maxSelected: 3, isClearable: true },
}
```

### Radio Group (`type: "string"`)

```typescript
{
  type: "string",
  component: "radio",
  name: "plan",
  label: "Plan",
  options: [
    { label: "Free", value: "free" },
    { label: "Pro", value: "pro" },
  ],
  properties: { direction: "row" }, // or "column"
}
```

### Number Variants (`type: "number"`)

```typescript
// Number input
{ type: "number", component: "number", properties: { min: 0, max: 100, step: 1 } }

// Slider
{ type: "number", component: "slider", properties: { min: 0, max: 100 } }

// Range (dual handle)
{ type: "number", component: "range", properties: { min: 0, max: 100 } }

// Rating (stars)
{ type: "number", component: "rating", properties: { max: 5 } }

// Formatted number (currency, percentage)
{ type: "number", component: "formatted-number", properties: { format: "currency", currency: "USD" } }
```

### Boolean Variants (`type: "boolean"`)

```typescript
// Checkbox
{ type: "boolean", component: "checkbox", label: "I agree" }

// Toggle switch
{ type: "boolean", component: "switch", label: "Enable feature" }
```

### Date/Time (`type: "string"`)

```typescript
// Date picker
{ type: "string", component: "date", properties: { minDate: "2020-01-01", maxDate: "2030-12-31" } }

// Date + time
{ type: "string", component: "datetime", properties: { format: "YYYY-MM-DD HH:mm" } }

// Time only
{ type: "string", component: "time", properties: { format: "HH:mm" } }
```

### File Upload (`type: "array" | "string" | "object"`)

```typescript
// Single file
{ type: "string", component: "file", properties: { accept: ".pdf,.docx", maxSize: 5_000_000 } }

// Multiple files
{ type: "array", component: "file", properties: { accept: "image/*", multiple: true } }

// Image (with preview)
{ type: "string", component: "image", properties: { accept: "image/*" } }
```

---

## Static & Structural Fields

### Static Fields (no value)

```typescript
// Header
{ type: "header", label: "Section Title", properties: { variant: "h2" } }

// Paragraph
{ type: "paragraph", properties: { content: "Description text" } }

// Divider
{ type: "divider" }
{ type: "divider-label", properties: { content: "Or continue with" } }

// Spacer
{ type: "spacer", properties: { size: "lg" } }

// Button (action)
{ type: "button", properties: { onClick: () => console.log("clicked"), variant: "primary" } }

// Image display
{ type: "image", properties: { src: "/logo.png", alt: "Logo" } }

// Message/Alert
{ type: "message", properties: { variant: "info", content: "This is an info message" } }

// Raw HTML
{ type: "html", properties: { content: "<strong>Bold</strong>" } }
```

### Structural Fields (contain nested fields)

```typescript
// Card container
{
  type: "card",
  label: "Account Settings",
  layout: { type: "grid", columns: 12, gap: "md" },
  fields: [ /* nested fields */ ],
  properties: { variant: "outlined", elevation: "sm" }
}

// Accordion (collapsible)
{
  type: "accordion",
  label: "Advanced Options",
  defaultOpen: false,
  fields: [ /* nested fields */ ],
}

// Container (layout only, no chrome)
{
  type: "container",
  layout: { type: "flex", direction: "row", gap: "md" },
  fields: [ /* nested fields */ ],
}

// Tabs
{
  type: "tabs",
  fields: [
    { type: "container", label: "Tab 1", fields: [...] },
    { type: "container", label: "Tab 2", fields: [...] },
  ],
}

// Fieldset (semantic grouping)
{
  type: "fieldset",
  label: "Personal Info",
  fields: [ ... ],
}

// Group (inline horizontal group)
{
  type: "group",
  layout: { type: "flex", direction: "row", gap: "sm" },
  fields: [ ... ],
}

// Repeater (dynamic rows)
{
  type: "repeater",
  name: "items",
  label: "Line Items",
  fields: [
    { id: "itemName", name: "name", type: "string", component: "text", label: "Name" },
    { id: "itemQty", name: "qty", type: "number", component: "number", label: "Qty" },
  ],
  properties: { minItems: 1, maxItems: 10, addButtonLabel: "Add Item" },
}

// Slot (injection point for dynamic content)
{
  type: "slot",
  name: "customSlot",
  properties: { slotName: "custom-content" },
}
```

---

## Common Field Properties

All fields support these shared properties:

```typescript
{
  id: "unique-field-id",           // Required - unique across form
  name: "fieldName",               // Required - data key (dot notation for nested)
  label: "Display Label",          // Optional - shown in UI
  description?: "Help text",       // Optional - shown below label
  helpText?: "Tooltip text",       // Optional - tooltip on label
  required?: true,                 // Optional - validation
  disabled?: false,                // Optional - read-only UI
  readOnly?: false,                // Optional - read-only, submits value
  hidden?: false,                  // Optional - hidden but submits
  validation?: {                   // Optional - inline validation
    required: true,
    minLength: 2,
    pattern: "^[a-zA-Z]+$",
    custom: (value) => value !== "admin" || "Reserved name",
  },
  conditions?: {                   // Optional - visibility logic
    when: { field: "role", equals: "admin" },
    then: { hidden: false },
    else: { hidden: true },
  },
  meta?: {                         // Optional - extensibility
    ui: { icon: "user", displayConfig: { titleKey: "label", avatarKey: "meta.avatar" } },
    accessibility: { describedBy: "help-text-id" },
  },
  layout?: {                       // Optional - grid positioning
    columnSpan: 6,                 // 1-12
    rowSpan: 1,
    startNewRow: false,
  },
  properties?: {                   // Component-specific props
    placeholder: "Enter value...",
    intent: "primary" | "secondary" | "danger" | "warning" | "success" | "subtle",
    // ... component-specific
  },
}
```

---

## Section Contract

```typescript
interface FormSectionContract {
  id: string;
  title?: string;
  description?: string;
  layout?: SectionLayoutConfig;    // Grid, flex, block config
  fields: ReadonlyArray<TypedFieldContract>;
  subSections?: ReadonlyArray<FormSectionContract>;
  nextStep?: string | ((values) => string | null); // Wizard flow
}
```

**Layout Config:**
```typescript
// Grid (default)
layout: { type: "grid", columns: 12, gap: "md", rowGap: "lg", colGap: "md" }

// Flex row
layout: { type: "flex", direction: "row", gap: "md", wrap: true }

// Flex column
layout: { type: "flex", direction: "column", gap: "md" }

// Block (vertical stack)
layout: { type: "block", gap: "lg" }
```

---

## Form Contract

```typescript
interface FormDefinitionContract {
  id: string;
  title: string;
  description?: string;
  submitLabel?: string;      // "Save"
  cancelLabel?: string;      // "Cancel"
  sections?: FormSectionContract[];
  fields?: TypedFieldContract[]; // Flat fields (no sections)
  settings?: {
    density?: "compact" | "comfortable" | "spacious";
    width?: "full" | "contained" | "max-w-2xl";
    layoutMode?: "dashboard" | "portal" | "fullscreen" | "drawer" | "modal" | "inline";
    stickyHeader?: boolean;
    stickyFooter?: boolean;
    maxHeight?: string;
    wizard?: WizardContractConfig; // Stepper config
  };
  layout?: FormLayoutConfig;
  style?: FormStyleConfig;   // DCS theming
  validation?: ValidationSettings; // Global validation
  events?: {
    onSubmit?: (data) => Promise<void>;
    onInit?: (data) => void;
    onChange?: (data, changedField) => void;
  };
  metadata?: Record<string, any>;
}
```

---

## Wizard / Stepper Forms

Use `withWizard()` to enable stepper flow:

```typescript
import { defineFormContract, withWizard, compileContractToFormDefinition } from "@/shared/ui/form";

const OnboardingContract = withWizard({
  stepperType: "sidebar",  // or "top"
  linear: true,            // enforce order
  initialStepId: "welcome",
})(
  defineFormContract({
    id: "onboarding",
    title: "Welcome to ZenOS",
    sections: [
      { id: "welcome", title: "Welcome", fields: [...] },
      { id: "profile", title: "Profile", fields: [...], nextStep: "preferences" },
      { id: "preferences", title: "Preferences", fields: [...], nextStep: null }, // last
    ],
  })
);

// Compiled form has settings.wizard.enabled = true
const schema = compileContractToFormDefinition(OnboardingContract);
```

**Dynamic Next Step:**
```typescript
{
  id: "profile",
  title: "Profile",
  fields: [...],
  nextStep: (values) => values.hasCompany ? "company" : "preferences",
}
```

---

## Type Inference

### `InferFormValues<Contract>`

Automatically extracts the form data shape:

```typescript
type UserProfileData = InferFormValues<typeof UserProfileContract>;
// Result:
{
  firstName: string;
  lastName: string;
  email: string;
  role: "admin" | "user" | "viewer";
}
```

- **Static fields** (header, divider, etc.) → excluded
- **Required fields** → non-optional
- **Optional fields** → `| undefined`
- **Arrays** (multiselect, repeater) → `Type[]`
- **Nested objects** (dot notation names) → nested types

### Usage in Components

```tsx
import { Form } from "@/shared/ui/form";
import { useFormFacade } from "@/shared/ui/form";

function UserProfilePage() {
  const schema = useMemo(() => compileContractToFormDefinition(UserProfileContract), []);
  
  const { handleSubmit } = useFormFacade({
    definition: schema,
    onSubmit: async (data: UserProfileData) => {
      // data is fully typed!
      await api.updateProfile(data);
    },
  });

  return <Form definition={schema} onSubmit={handleSubmit} />;
}
```

---

## Compilation Pipeline

```
defineFormContract()
       │
       ▼
TypeScript const inference
       │
       ▼
compileContractToFormDefinition()
       │
       ├── Validates discriminated unions
       ├── Resolves FieldOption value types
       ├── Flattens sections → fields[]
       ├── Applies default layouts
       └── Generates FormDefinition (runtime)
       │
       ▼
FormDefinition (consumed by FormCore)
```

The compiled `FormDefinition` is identical to what MDAP Entity produces - the engine doesn't know the difference.

---

## Migration from EntityDefinition

### Before (EntityDefinition)
```typescript
const UserEntity: EntityDefinition = {
  id: "user",
  name: "User",
  content: {
    sections: [{ id: "basic", fields: [...] }],
  },
  surface: { ui: { density: "comfortable" } },
};

const schema = compileEntityToFormDef(UserEntity, "user-form", "Save");
```

### After (Contract)
```typescript
const UserContract = defineFormContract({
  id: "user",
  title: "User",
  settings: { density: "comfortable" },
  sections: [{ id: "basic", fields: [...] }],
});

const schema = compileContractToFormDefinition(UserContract);
```

**Benefits:**
- Full TypeScript inference on `fields[]`
- Discriminated unions catch invalid `component` values
- `options` typed by value literal
- `InferFormValues` works automatically
- No separate `surface`/`behavior` objects needed for simple forms

---

## Advanced: Custom Field Contracts

For domain-specific fields, extend with `CustomFieldContract`:

```typescript
import { defineFormContract, type CustomFieldContract } from "@/shared/ui/form";

interface EmployeeSelectContract extends CustomFieldContract {
  type: "employee-select";
  component: "employee-select";
  properties?: {
    departmentFilter?: string;
    showAvatar: true;
  };
}

const Contract = defineFormContract({
  id: "assign-task",
  fields: [
    {
      id: "assignee",
      name: "assigneeId",
      type: "employee-select",
      component: "employee-select",
      label: "Assignee",
      properties: { departmentFilter: "engineering", showAvatar: true },
    } as EmployeeSelectContract, // Cast for custom type
  ],
});

// Register at runtime (in feature layer)
import { manifestRegistry } from "@/shared/ui/form";
import { EmployeeSelectField } from "@/features/employees";

manifestRegistry.registerField({
  type: "employee-select",
  category: "input",
  routing: "leaf",
  component: EmployeeSelectField,
  // ... manifest
});
```

---

## Best Practices

1. **Use `as const` on options** for literal value inference
2. **Group related fields in sections** for layout control
3. **Use `columnSpan`** for responsive grids (1-12)
4. **Prefer `component` over `type` alone** for precise rendering
5. **Keep contracts in `*-contract.ts` files** alongside components
6. **Export inferred types** for use in API layers
7. **Use `withWizard` for steppers** instead of manual wizard config

---

## Related Docs

- [Getting Started](./GETTING_STARTED.md) - Full render example
- [Runtime Contexts](./RUNTIME_CONTEXTS.md) - FormRuntimeProvider
- [State & Engine](./STATE_AND_ENGINE.md) - FormCore internals
- [Migration Guide](./MIGRATION_GUIDE.md) - From EntityDefinition