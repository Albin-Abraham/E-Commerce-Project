> [!WARNING]
> **ARCHIVED / HISTORICAL DOCUMENTATION (v1 MDAP)**
> This documentation describes the legacy v1 MDAP architecture and has been archived. For active development, refer to the current **[v2 Form Architecture](../../form/FORM_ARCHITECTURE.md)**, **[Quick Start Guide](../../form/QUICK_START.md)**, and **[Documentation Index](../../form/README.md)**.

# Getting Started with MDAP Form Engine v1

The v1 Form Architecture separates form configuration, state management, and rendering through the **MDAP (Multi-Domain Application Platform)** compiler.

## The MDAP Workflow

Do **NOT** write flattened `FormDefinition` objects by hand. Instead, define an `EntityDefinition` and compile it into a runtime schema. This guarantees the separation of Content, Behavior, Surface, and Presentation.

### 1. Define the MDAP Entity (`*-logical.ts`)

Create your raw entity containing domain logic (Content) and macro-presentation limits (Surface).

```typescript
import type { EntityDefinition } from "@/shared/ui/form/types/application";

export const UserProfileEntity: EntityDefinition = {
  id: "user-profile-entity",
  name: "User Profile",
  content: {
    sections: [
      {
        id: "primary",
        title: "Basic Info",
        fields: [
          {
            id: "firstName",
            name: "firstName",
            type: "text",
            label: "First Name",
            required: true,
          },
          {
            id: "lastName",
            name: "lastName",
            type: "text",
            label: "Last Name",
            required: true,
          },
        ],
      },
    ],
  },
  surface: {
    ui: {
      density: "comfortable",
    },
  },
};
```

### 2. Compile the Schema (`*-schema.ts`)

Use the MDAP Compiler (`compileEntityToFormDef`) to fuse your logical layers into a flat, runtime-ready `FormDefinition`. This is where you inject environment-specific behaviors (e.g., swapping a login form to a signup form).

```typescript
import { compileEntityToFormDef } from "@/shared/ui/form/utils/mdap-compiler";

import { UserProfileEntity } from "./user-profile-logical";

export function buildUserProfileSchema() {
  return compileEntityToFormDef(
    UserProfileEntity,
    "user-profile-form", // Form ID
    "Save Profile" // Submit Button Label
  );
}
```

### 3. Render the Form (`UserProfilePage.tsx`)

Pass the compiled schema into the `Form` wrapper component.

```tsx
import React, { useMemo } from "react";

import { Form } from "@/shared/ui/form/Form";

import { buildUserProfileSchema } from "./user-profile-schema";

export const UserProfilePage = () => {
  const schema = useMemo(() => buildUserProfileSchema(), []);

  const handleSubmit = async (data) => {
    console.log("Form Submitted:", data);
    // return validation errors mapping if backend fails
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <Form definition={schema} onSubmit={handleSubmit} />
    </div>
  );
};
```

## Legacy "Flattened" Implementations

You may see legacy code (like Storybook showcases) passing hardcoded `{ id: '...', sections: [...] }` directly into `<Form>`. This is known as a **Flattened Implementation**.

While this still works because the engine consumes `FormDefinition`, it bypasses the MDAP Architecture. **All new forms must use `EntityDefinition` + `compileEntityToFormDef`.**
