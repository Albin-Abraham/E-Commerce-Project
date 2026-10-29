# Zenith Form Architecture Quick Start Guide

This guide demonstrates the 5 primary patterns for building forms, detail views, and interactive inputs.

---

## 1. Complete Form (`<Form />`)

Best for: Complete forms requiring standard submit buttons, validation errors, reset actions, or multi-step wizard navigation.

```tsx
import React from "react";
import { Form, type FormDefinition } from "@ui/form";
import { z } from "zod";

const contactSchema: FormDefinition = {
  id: "contact-form",
  title: "Contact Support",
  sections: [
    {
      id: "general",
      title: "Ticket Details",
      fields: [
        {
          id: "email",
          name: "email",
          type: "text",
          label: "Email Address",
          required: true,
          placeholder: "you@company.com",
        },
        {
          id: "priority",
          name: "priority",
          type: "select",
          label: "Urgency Level",
          required: true,
          options: [
            { value: "low", label: "Low Priority" },
            { value: "medium", label: "Medium Priority" },
            { value: "high", label: "Critical" },
          ],
        },
        {
          id: "details",
          name: "details",
          type: "textarea",
          label: "Issue Description",
          placeholder: "Describe what went wrong...",
        },
      ],
    },
  ],
};

const validationSchema = z.object({
  email: z.email("Please provide a valid business email"),
  priority: z.enum(["low", "medium", "high"]),
  details: z.string().min(10, "Description must be at least 10 characters"),
});

type ContactValues = z.infer<typeof validationSchema>;

export function ContactPage() {
  const handleSubmit = async (values: ContactValues) => {
    console.log("Submitting values:", values);
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Form
        definition={contactSchema}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
        initialData={{ priority: "medium" }}
      />
    </div>
  );
}
```

---

## 2. Lightweight Dynamic Layout (`<FormRenderer />`)

Best for: Dynamic dashboards, filter panels, or inline settings where you have a `FormDefinition` or `RenderDefinition` but do **not** want full `<form>` submission buttons or wrappers.

```tsx
import React, { useState } from "react";
import { FormRenderer, type FormDefinition } from "@ui/form";

const filterDefinition: FormDefinition = {
  id: "table-filters",
  sections: [
    {
      id: "filters",
      fields: [
        {
          id: "search",
          name: "search",
          type: "text",
          label: "Quick Search",
          placeholder: "Filter by name or keyword...",
        },
        {
          id: "status",
          name: "status",
          type: "select",
          label: "Status",
          options: [
            { value: "active", label: "Active" },
            { value: "pending", label: "Pending" },
            { value: "archived", label: "Archived" },
          ],
        },
      ],
    },
  ],
};

export function FilterToolbar() {
  const [filterValues, setFilterValues] = useState<Record<string, unknown>>({});

  const handleFieldChange = (fieldId: string, value: unknown) => {
    setFilterValues((prev) => ({ ...prev, [fieldId]: value }));
  };

  return (
    <div className="bg-card p-4 rounded-xl border border-border">
      <FormRenderer
        definition={filterDefinition}
        value={filterValues}
        onChange={handleFieldChange}
      />
    </div>
  );
}
```

---

## 3. Autonomous Standalone Direct Fields

Best for: Rapid prototyping, custom layouts, or drop-in inputs in bespoke UI components without creating schema objects.

All wrapped fields (`FormTextField`, `FormSelectField`, `FormAutocompleteField`, etc.) are pre-composed with `withFieldShell` (`withAtom`). When used outside of `<Form>`, they manage local state automatically while supporting standard controlled props.

```tsx
import React, { useState } from "react";
import {
  FormTextField,
  FormSelectField,
  FormSwitchField,
  FormButtonField,
} from "@ui/form";

export function SimpleProfileEditor() {
  const [country, setCountry] = useState("ca");
  const [notifications, setNotifications] = useState(true);

  return (
    <div className="max-w-md space-y-4 p-6 border rounded-2xl bg-card">
      <h2 className="text-lg font-bold text-foreground">User Preferences</h2>

      {/* Autonomous Text Field */}
      <FormTextField
        name="username"
        label="Display Name"
        placeholder="e.g. alex_dev"
        required
      />

      {/* Controlled Select Field */}
      <FormSelectField
        name="country"
        label="Region"
        value={country}
        onChange={setCountry}
        options={[
          { value: "us", label: "United States" },
          { value: "ca", label: "Canada" },
          { value: "uk", label: "United Kingdom" },
        ]}
      />

      {/* Controlled Switch */}
      <FormSwitchField
        name="notifications"
        label="Email Notifications"
        value={notifications}
        onChange={setNotifications}
      />

      <FormButtonField name="save" label="Save Changes" variant="solid" />
    </div>
  );
}
```

---

## 4. Smart Field Controller (`<Field />`)

Best for: Hybrid rendering where you have a schema-bound form but want to render custom third-party UI controls using render props, while retaining automatic label/error shell integration.

```tsx
import React from "react";
import { Field, ControlledField } from "@ui/form/fields/Field";

export function CustomEditorField() {
  return (
    <div className="space-y-4">
      {/* ControlledField dynamically injects value and onChange into any custom component */}
      <ControlledField
        name="bio"
        label="Biographical Note"
        helpText="Rich text editor powered by a third-party canvas."
        render={({ value, onChange, onBlur }) => (
          <textarea
            className="w-full p-2 border rounded-md"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur}
            rows={4}
          />
        )}
      />
    </div>
  );
}
```

---

## 5. Headless Hook (`useForm`)

Best for: Custom interactive widgets, modal multi-step flows, or full imperative access to the headless engine state.

```tsx
import React from "react";
import { useForm, type FormDefinition } from "@ui/form";

const wizardSchema: FormDefinition = {
  id: "onboarding-wizard",
  sections: [
    {
      id: "step-1",
      title: "Account",
      fields: [{ id: "email", name: "email", type: "text", label: "Email" }],
    },
    {
      id: "step-2",
      title: "Organization",
      fields: [{ id: "org", name: "org", type: "text", label: "Company Name" }],
    },
  ],
};

export function HeadlessOnboarding() {
  const { form, values, isDirty, isValid } = useForm(
    wizardSchema,
    { email: "admin@enterprise.com" },
    {
      initialDataSyncMode: "preserve-dirty", // Protects active typing on background refetch
      onChange: (val) => console.log("Values changed:", val),
    }
  );

  return (
    <div className="p-4 space-y-4">
      <p className="text-sm">Dirty: {isDirty ? "Yes" : "No"}</p>
      <p className="text-sm">Valid: {isValid ? "Yes" : "No"}</p>
      <input
        className="border p-2 rounded"
        value={values.email || ""}
        onChange={(e) => form.setValue("email", e.target.value)}
      />
    </div>
  );
}
```

---

**See also:** [./VALIDATION_GUIDE.md](./VALIDATION_GUIDE.md) (schema validation details) · [./CONTRACTS_AND_MDAP.md](./CONTRACTS_AND_MDAP.md) (typed contracts & wizard authoring) · [./reference/06-HOOKS.md](./reference/06-HOOKS.md) (useForm API) · [./reference/07-COMPONENTS.md](./reference/07-COMPONENTS.md) (component props) · [./FORM_ARCHITECTURE.md](./FORM_ARCHITECTURE.md)
