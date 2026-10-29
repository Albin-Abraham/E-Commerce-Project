# Permissions and Navigation

This guide covers two runtime concerns of the Zenith Form Architecture: field-level permissions (`edit` / `view` / `hidden`) and the unsaved-changes navigation guard. Part A documents the permission context, the `<Form permissions>` prop, and what each level actually does at runtime. Part B documents `FormNavigationGuard`, the `navigationGuard` prop, and dirty-state interplay.

---

## Part A — Field permissions

### 1. Concepts

The permission model is defined in [PermissionContext.tsx](../../src/shared/ui/form/context/PermissionContext.tsx):

```ts
export type FieldPermission = "edit" | "view" | "hidden";

export interface PermissionMap {
  [fieldId: string]: FieldPermission;
}
```

| Level | Meaning |
|---|---|
| `"edit"` | View and modify (default for any field not present in the map) |
| `"view"` | See the value but not modify it (read-only) |
| `"hidden"` | Field is completely hidden from the user |

The map is keyed by **field id**. `getPermission` returns `"edit"` for unknown ids, so the map only needs entries that deviate from full access.

---

### 2. `PermissionProvider`

```ts
export const PermissionProvider: React.FC<{
  children: React.ReactNode;
  permissions?: PermissionMap;
}>; // initial permissions default to {}
```

`permissions` seeds provider state via `useState`; later prop changes are ignored — use the manager hooks for runtime updates (see 2.3).

Nesting: `FormRuntimeProvider` ([FormRuntimeProvider.tsx](../../src/shared/ui/form/context/FormRuntimeProvider.tsx)) mounts `PermissionProvider` internally, between `ControlProvider` and `DataSourceProvider`, so every field under `<Form>` already has permission resolution available. Mounting a provider manually is only needed to scope a subtree outside a `<Form>` or to pre-seed before one:

```tsx
import { Form, PermissionProvider } from "@ui/form";

export function InvoiceScreen(): React.ReactElement {
  return (
    <PermissionProvider
      permissions={{ invoice_total: "view", delete_action: "hidden" }}
    >
      <Form definition={invoiceDefinition} />
    </PermissionProvider>
  );
}
```

When `<Form>` itself receives a `permissions` prop, the internal provider is seeded from it (see 2.4); no manual provider is required.

---

### 3. `useFieldPermission` and `usePermissionManager`

Both are exported from `@ui/form` and defined in [PermissionContext.tsx](../../src/shared/ui/form/context/PermissionContext.tsx).

```ts
export const usePermissionManager: () => PermissionManagerValue;

export interface PermissionManagerValue {
  getPermission: (fieldId: string) => FieldPermission;
  updatePermissions: (updates: PermissionMap) => void; // shallow-merges into current map
  setPermissions: (permissions: PermissionMap) => void; // replaces the whole map
}
```

```ts
export const useFieldPermission: (fieldId: string) => FieldPermissionResult;

export interface FieldPermissionResult {
  permission: FieldPermission;
  canEdit: boolean;  // permission === "edit"
  canView: boolean;  // permission !== "hidden"
  isHidden: boolean; // permission === "hidden"
}
```

Both hooks fall back to a default manager (`getPermission` returns `"edit"`, mutations are no-ops) when no `PermissionProvider` is above them, so they never throw.

Per-field usage in a custom field component:

```tsx
import React from "react";
import { useFieldPermission } from "@ui/form";

interface SalaryInputProps {
  fieldId: string;
  value: string;
  onChange: (value: string) => void;
}

export function SalaryInput({
  fieldId,
  value,
  onChange,
}: SalaryInputProps): React.ReactElement | null {
  const { canEdit, isHidden } = useFieldPermission(fieldId);
  if (isHidden) return null;

  return (
    <input
      type="text"
      value={value}
      disabled={!canEdit}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}
```

Dynamic updates (role change, feature flag):

```tsx
import { usePermissionManager } from "@ui/form";

function useSalaryGate(): void {
  const { updatePermissions, setPermissions } = usePermissionManager();
  // merge: only flips the listed fields
  updatePermissions({ employee_salary: "edit" });
  // replace: rebuilds the whole map
  setPermissions({ employee_salary: "view", internal_notes: "hidden" });
}
```

Enforcement note: the hooks are the contract; consumers call them from their own field drivers or custom components. As of this writing no built-in primitive field driver calls `useFieldPermission` — the plumbing (provider, hooks, `<Form>` prop) exists, but read-only/hidden rendering is applied by the code that consumes the hook. For a whole-form read-only switch, `<Form mode="view">` is the built-in mechanism (see 2.5).

---

### 4. `<Form permissions={...}>`

From [FormProps.ts](../../src/shared/ui/form/FormProps.ts):

```ts
permissions?: Record<string, "edit" | "view" | "hidden">;
```

The prop flows: `Form` → `useFormCore` runtime (`permissions`) → [FormRuntimeTree.tsx](../../src/shared/ui/form/components/FormRuntimeTree.tsx) → `FormRuntimeProvider` → `PermissionProvider`. It is therefore the initial map of the provider mounted inside the form tree.

Locking a form to a role:

```tsx
import React from "react";
import { Form, type FormDefinition } from "@ui/form";

const ROLE_PERMISSIONS: Record<string, Record<string, "edit" | "view" | "hidden">> = {
  manager: { employee_salary: "view", internal_notes: "hidden" },
  auditor: { employee_salary: "view", internal_notes: "view" },
  admin: {},
};

export function PayrollForm({
  role,
}: {
  role: keyof typeof ROLE_PERMISSIONS;
}): React.ReactElement {
  return (
    <Form
      definition={payrollDefinition}
      permissions={ROLE_PERMISSIONS[role]}
      onSubmit={async (data) => {
        await fetch("/api/payroll", { method: "POST", body: JSON.stringify(data) });
      }}
    />
  );
}
```

Relationship to `mode`: `FormProps.mode?: "edit" | "view"` is a separate, whole-form switch. It is resolved in [useFormCore.ts](../../src/shared/ui/form/hooks/useFormCore.ts) (`mode || definition.settings?.mode || "edit"`) and published on the orchestrator; field drivers use it to render read-only presentation (for example `TextField` renders a text span, `FieldLabel` renders a `span`, and `FormFooter` switches its layout). Use `mode="view"` for the entire form, `permissions` for per-field granularity.

---

### 5. Effects of each level

What is verified in source:

| Concern | `"edit"` | `"view"` | `"hidden"` |
|---|---|---|---|
| Rendering (contract) | Normal input | See value, cannot modify | Driver returns `null` per the documented pattern (`if (isHidden) return null`) |
| `canEdit` / `canView` / `isHidden` | `true` / `true` / `false` | `false` / `true` / `false` | `false` / `false` / `true` |
| Values / `getPayload()` | Included | Included | Stripped — the React runtime syncs permission-hidden field ids into the engine via `setHiddenFields`, and `getPayload()` in [engine.ts](../../src/core/form-core/engine.ts) removes them alongside `ephemeral` fields |
| Validation | Validates normally | Validates normally | Skipped — [modules/validator.ts](../../src/core/form-core/modules/validator.ts) skips fields whose **V3 visibility** is `false` or that are marked hidden via `setHiddenFields` (permission `"hidden"`) |
| Enforcement point | — | Consumer code (`disabled={!canEdit}`) | Consumer code (early return) |

Interaction with conditions (`visible` rules): permissions and conditions are orthogonal. Conditions drive the V3 visibility slice; when a condition hides a field, the visibility side effects apply (default `visibilityBehavior: "purge"` clears the field's errors and nulls its value — see [modules/visibility.ts](../../src/core/form-core/modules/visibility.ts); `"preserve"` and `"suspend"` alter that). Permission levels do not trigger these side effects.

Practical guidance:

- For hiding that must also purge the stored value and clear errors (not just strip from the submit payload), use a `visible` condition (purge behavior) — permission `"hidden"` strips from `getPayload()` and skips validation but does not null the stored value.
- For read-only enforcement that must survive custom UI, combine `permissions` with `mode` or set `readOnly`/`disabled` from `canEdit` in your components.

---

### 6. Governance metadata

Declarative, schema-level access control lives in [domain/governance.ts](../../src/core/form-core/domain/governance.ts) under `FormDefinition.governance`:

```ts
export type FieldAccessLevel = "editable" | "readOnly" | "hidden" | "masked";

export interface FieldAccessRule {
  fieldId: string;
  roles?: string[];
  access: FieldAccessLevel;
  condition?: string;
}

export interface RolePermissions {
  roles: string[];
  defaultAccess?: FieldAccessLevel;
  rules?: FieldAccessRule[];
}
```

`GovernanceDefinition.permissions?: RolePermissions` is metadata carried on the definition (alongside `audit`, `concurrency`, `compliance`). Note the deliberate difference from the runtime type: governance levels are `"editable" | "readOnly" | "hidden" | "masked"` (adds `"masked"` for PII), while the runtime `FieldPermission` is `"edit" | "view" | "hidden"`. Mapping governance rules onto the runtime map (role resolution, `"masked"` rendering) is application responsibility. Full contract table: [./reference/04-DOMAIN_TYPES.md](./reference/04-DOMAIN_TYPES.md) section 10.5.

---

## Part B — Navigation guard

### 7. `FormNavigationGuard` and the `navigationGuard` prop

The component ([FormNavigationGuard.tsx](../../src/shared/ui/form/components/FormNavigationGuard.tsx)) intercepts router navigation while a form has unsaved edits. Both `Form` and the flow shell mount it automatically.

```ts
export interface FormNavigationGuardProps {
  guardConfig?: boolean | NavigationGuardConfig;
  formTitle?: string | TranslatedText;
  i18nNamespace?: string;
  isDirty: boolean;
  isSubmitting: boolean;
}
```

`NavigationGuardConfig` ([domain/definition.ts](../../src/core/form-core/domain/definition.ts)):

| Field | Type | Role |
|---|---|---|
| `enabled` | `boolean` | Defaults to `true` when an object config is provided without it |
| `domainName` | `string \| TranslatedText` | Entity name interpolated as `{{domain_name}}` into title/message/labels |
| `title` | `string \| TranslatedText` | Dialog title; default key `features/forms:navigationGuard.title` |
| `message` | `string \| TranslatedText` | Dialog body; default key `features/forms:navigationGuard.message` |
| `confirmLabel` / `confirm` | `string \| TranslatedText` | Confirm button (`confirmLabel` wins; `confirm` is the alias) |
| `cancelLabel` / `cancel` | `string \| TranslatedText` | Cancel button (`cancelLabel` wins; `cancel` is the alias) |
| `toastTitle` / `toastDescription` | `string \| TranslatedText` | Toast shown after the user confirms and navigation proceeds |
| `params` | `Record<string, string \| number>` | Extra interpolation parameters |

Trigger conditions, all verified in the component:

- The guard is armed only when `guardConfig` resolves to enabled **and** `isDirty` is `true` **and** `isSubmitting` is `false`.
- The blocker fires only when `currentLocation.pathname !== nextLocation.pathname` — same-path search/hash changes are not blocked.
- It requires a React Router data router (`useBlocker` plus `UNSAFE_DataRouterContext`); outside one it renders `null`.
- The prompt is an AlertDialog when one is available (`useOptionalAlertDialog`), otherwise `window.confirm`; with neither, navigation proceeds. A toast is emitted on confirm before `blocker.proceed()`.

Wiring on `<Form>` ([useFormCore.ts](../../src/shared/ui/form/hooks/useFormCore.ts)):

```ts
const effectiveGuardConfig =
  navigationGuard ?? definition.settings?.navigationGuard ?? false;
```

The `FormProps.navigationGuard?: boolean | NavigationGuardConfig` prop wins over `definition.settings.navigationGuard`; both default to `false` (guard off).

Intercepting route changes when the form is dirty:

```tsx
import React from "react";
import {
  Form,
  type FormDefinition,
  type NavigationGuardConfig,
} from "@ui/form";

const ORDER_DEFINITION: FormDefinition = {
  id: "purchase-order",
  title: "Purchase Order",
  sections: [
    {
      id: "section-general",
      title: "General",
      fields: [
        { id: "order_ref", name: "orderRef", type: "text", label: "Reference", required: true },
      ],
    },
  ],
};

const ORDER_GUARD: NavigationGuardConfig = {
  enabled: true,
  domainName: { en: "Purchase Order" },
  title: { en: "Unsaved changes" },
  message: { en: "Leave {{domain_name}}? Your edits will be lost." },
  confirmLabel: { en: "Leave" },
  cancelLabel: { en: "Stay" },
};

export function PurchaseOrderScreen(): React.ReactElement {
  return (
    <Form
      definition={ORDER_DEFINITION}
      navigationGuard={ORDER_GUARD}
      onSubmit={async (data) => {
        await fetch("/api/orders", { method: "POST", body: JSON.stringify(data) });
      }}
    />
  );
}
```

The component is also exported from `@ui/form` for custom shells that do not use `<Form>`:

```tsx
import React from "react";
import { FormNavigationGuard, useFormContext } from "@ui/form";

export function CustomFooter(): React.ReactElement {
  const form = useFormContext();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  return (
    <footer>
      <FormNavigationGuard
        guardConfig
        formTitle="Purchase Order"
        isDirty={form.isDirty}
        isSubmitting={isSubmitting}
      />
      <button
        type="button"
        onClick={async () => {
          setIsSubmitting(true);
          try {
            await form.submit();
          } finally {
            setIsSubmitting(false);
          }
        }}
      >
        Submit
      </button>
    </footer>
  );
}
```

---

### 8. Dirty-state interplay

`FormCore.isDirty` ([engine.ts](../../src/core/form-core/engine.ts)) is true when any **visible** field has `vitality.dirty === true`:

```ts
get isDirty(): boolean {
  const visibleIds = Object.keys(this.visibility).filter((id) => this.visibility[id]);
  return visibleIds.some((id) => this.vitality[id]?.dirty);
}
```

`useForm` and the `FormHandle` ref expose the same flag; `FormRuntimeTree` feeds `runtime.isDirty` into the guard. Details in [./reference/01-ENGINE.md](./reference/01-ENGINE.md).

Recommended UX:

- Leave the guard enabled on data-entry forms; keep it off on read-only or purely navigational screens (`mode="view"` forms rarely become dirty).
- Rely on the built-in `isSubmitting` interlock: while a submit is in flight the guard is inert, so post-submit redirects proceed without a prompt.
- After a successful submit, call `reset()` (via `FormHandle` or the form API) to clear vitality so subsequent navigation is silent.
- Always set `domainName` (or `title`/`message` strings) so the confirmation names the entity the user is leaving.

---

### 9. Wizard navigation pointer

Wizard step configuration is declared with `withWizard` (see [./CONTRACTS_AND_MDAP.md](./CONTRACTS_AND_MDAP.md)) and the in-form step chassis is `FormStepper` ([./reference/07-COMPONENTS.md](./reference/07-COMPONENTS.md)); `FormNavigationGuard` only intercepts router pathname changes, not internal wizard step transitions.

---

### 10. Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| No prompt on route change | Guard defaults to `false` | Pass `navigationGuard={true}` or a config object, or set `definition.settings.navigationGuard` |
| Guard works in the app but not in tests (or vice versa) | `useBlocker` requires a data router | Render under `createBrowserRouter`/`RouterProvider`; memory routers without a data router context render the guard as `null` |
| Prompt never appears although the user edited | Only **visible** fields contribute to `isDirty` | Check V3 visibility of edited fields; a field hidden by conditions does not mark the form dirty |
| Prompt appears while navigating after submit | Standalone usage passed a stale `isSubmitting` | Track submit state and pass it; the `<Form>` wiring does this automatically |
| Prompt skipped during submit-then-redirect | By design — guard is inert while `isSubmitting` | Expected; call `reset()` after success if you want the flag cleared permanently |
| `"view"` does not make a field read-only | Built-in drivers do not consume `useFieldPermission` | Apply `disabled={!canEdit}` in the component, or use `<Form mode="view">` for whole-form read-only |
| `"hidden"` value still appears in the submitted payload | Permissions reach the engine only when the form runtime receives the engine (`FormRuntimeProvider` `form` prop) | Use the `<Form>` runtime tree, or call `form.setHiddenFields([...])` manually; strip/mask server-side as defense in depth |
| Hidden field still shows validation errors | Validation keys off V3 visibility and the engine's hidden-field set, not `PermissionContext` directly | Ensure the permission→engine sync is active (see above), or pair `"hidden"` with a `visible` condition so the visibility pipeline clears errors |
| Permission map by field `name` has no effect | Map is keyed by field **id** | Use ids (fields using `key` set id and name identically) |
| Changes to the `permissions` prop after mount are ignored | Provider seeds state with `useState(initialPermissions)` | Call `updatePermissions`/`setPermissions` via `usePermissionManager`, or remount the provider with a `key` |
| Custom shell never blocks navigation | `FormNavigationGuard` not mounted | Mount it yourself with `isDirty`/`isSubmitting`, or use the `<Form>` runtime tree that mounts it |

---

**See also:**

- [ARRAYS_AND_REPEATERS.md](./ARRAYS_AND_REPEATERS.md) — dynamic list fields and row identity
- [./reference/01-ENGINE.md](./reference/01-ENGINE.md) — `isDirty`, visibility pipeline, `getPayload`
- [./reference/04-DOMAIN_TYPES.md](./reference/04-DOMAIN_TYPES.md) — governance contracts (section 10.5), `NavigationGuardConfig`
- [./reference/07-COMPONENTS.md](./reference/07-COMPONENTS.md) — `FormNavigationGuard`, `FormStepper`
- [./reference/09-PROVIDERS.md](./reference/09-PROVIDERS.md) — `PermissionContext` and `FormRuntimeProvider` reference
- [./QUICK_START.md](./QUICK_START.md) — form authoring patterns
