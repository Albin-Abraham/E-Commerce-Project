# Form Tooling

Practical tooling for the Zenith Form Architecture: the scaffold generator, the dev-tools components, the engine test utilities, and the visual builder. Commands and props below are taken from `frontend/package.json` and from source; links are relative to `frontend/docs/form/`.

---

## 1. Scaffold generator

### 1.1 Entry points

| Script | Command | Effect |
|---|---|---|
| `scaffold` | `pnpm scaffold` | Full interactive CLI: prompts for generator type, then runs that generator's prompts |
| `scaffold:form` | `pnpm scaffold:form` | Runs the `zenos-form` generator directly |

Both are defined in [package.json](../../package.json) and delegate to [scripts/scaffold.js](../../scripts/scaffold.js), which loads [plopfile.cjs](../../plopfile.cjs). `plopfile.cjs` registers `zenos-form` and an alias `form` for the same blueprint.

### 1.2 What it asks

[scaffold.js](../../scripts/scaffold.js) accepts `[type] [name]` plus `-m, --includeMutations` and `-u, --includeUrlParams` (consumed only by the `zenos-module` blueprint).

For `pnpm scaffold:form` the type is supplied, so the only prompt is the name ([scripts/factories/generatorFactory.cjs](../../scripts/factories/generatorFactory.cjs)):

```text
? Form / Entity name (e.g. user-profile, create-branch):
```

Passing the name as an argument skips every prompt: `pnpm scaffold:form user-profile`. Running bare `pnpm scaffold` first asks "What would you like to generate?" with the registered generators: `feature`, `zenos-module`, `zenos-repository`, `zenos-facade`, `zenos-presenter`, `zenos-form`, `form`.

### 1.3 Files it writes

Base path is `src/features/{{kebabCase name}}/`. Three files per run:

| Target | Template | Generates |
|---|---|---|
| `configs/<name>-logical.ts` | [form-logical.ts.hbs](../../plop-templates/zenos/form-logical.ts.hbs) | `build<Pascal>Entity()` returning `EntityDefinition` over `<Pascal>FormData` — content layer with one `general` section (`name`, `status`, `description` fields) plus the `<Pascal>FormData` interface |
| `configs/<name>-surface.ts` | [form-surface.ts.hbs](../../plop-templates/zenos/form-surface.ts.hbs) | `build<Pascal>Surface(): SurfaceDefinition` (card shell node) and `build<Pascal>Presentation(): PresentationDefinition` (variant, intent, action/submit class names) |
| `configs/<name>-schema.ts` | [form-schema.ts.hbs](../../plop-templates/zenos/form-schema.ts.hbs) | `build<Pascal>Schema()` returning `FormDefinition` for `<Pascal>FormData` — assigns surface and presentation onto the entity, then calls `compileEntityToFormDef(entity, "<name>-form", "Save <Pascal>")` |

The generated schema file imports the compiler from the subpath, not the barrel:

```ts
import { compileEntityToFormDef } from "@ui/form/utils/mdap-compiler";

export function buildUserProfileSchema(): FormDefinition<UserProfileFormData> {
  const entity = buildUserProfileEntity();
  entity.surface = buildUserProfileSurface();
  entity.presentation = buildUserProfilePresentation();

  return compileEntityToFormDef(entity, "user-profile-form", "Save User Profile");
}
```

That is the positional signature documented in [CONTRACTS_AND_MDAP.md](./CONTRACTS_AND_MDAP.md) section 4.

### 1.4 Session example

```text
$ pnpm scaffold:form

Missing arguments detected. Falling back to interactive prompts...

? Form / Entity name (e.g. user-profile, create-branch): user-profile

Scaffolding zenos-form...
Scaffolding successful!
   + src/features/user-profile/configs/user-profile-logical.ts
   + src/features/user-profile/configs/user-profile-surface.ts
   + src/features/user-profile/configs/user-profile-schema.ts
```

The CLI prefixes these lines with status glyphs; they are omitted here. Action failures abort the run before the success banner.

### 1.5 Failure safety

[scaffold.js](../../scripts/scaffold.js) snapshots untracked files through `captureGitState()` before running and calls `performRollback()` from [scripts/utils/gitRollback.js](../../scripts/utils/gitRollback.js) on `SIGINT` (Ctrl+C) and on any fatal error. Rollback deletes every file created during the run, leaving the workspace as it was.

---

## 2. DevTools components

### 2.1 `FormDevTools`

Source: [FormDevTools.tsx](../../src/shared/ui/form/tools/FormDevTools.tsx).

| Prop | Type | Default | Meaning |
|---|---|---|---|
| `form` | `FormCore<any>` | — | Engine instance to inspect; pass `form.engine` from `useForm` |
| `open` | `boolean` | `false` | Initial panel state |

| Tab | Shows |
|---|---|
| `values` | Collapsible JSON of `state.values`, with per-field dirty/touched/error badges |
| `vitality` | `state.vitality` (touched/dirty/active flags) |
| `validity` | `state.validity`, with an error-count banner or "all fields valid" banner |
| `visibility` | `state.visibility` |
| `styles` | Field picker plus `FormStyleDebugger` for the selected field |
| `performance` | `lastSubmissionDurationMs`, `lastValidationDurationMs`, engine version |
| `debug` | Diagnostics including `state.debug.renderCount` |

Shared controls: property filter, expand/collapse, copy current tab as JSON, refresh snapshot, field count footer.

Command bus: the panel subscribes to `commandBus.on(PlatformCommand.ToggleFormDevTools, ...)` and restores focus to the previously focused element on close. Keybinding `ctrl+shift+d` / `meta+shift+d` comes from [settings.json](../../src/core/events/config/settings.json); emit it programmatically with `commandBus.emit(PlatformCommand.ToggleFormDevTools)` ([CommandBus.ts](../../src/core/events/CommandBus.ts), [shortcuts.ts](../../src/core/events/config/shortcuts.ts)).

Mounting:

```tsx
import { useForm } from "@ui/form";
import { FormDevTools } from "@ui/form/tools/FormDevTools";

export function InspectorPage() {
  const { form } = useForm<ContactFormValues>(definition, { priority: "medium" });

  return <FormDevTools form={form.engine} open={false} />;
}
```

Mount points in the app: [FormShell.tsx](../../src/shared/ui/form/components/FormShell.tsx) renders `<FormDevTools form={form.engine} />` and `<FormDebugOverlay enabled={debug} />` when the `debug` prop is set; [FormDebugPage.tsx](../../src/shell/pages/static-pages/FormDebugPage.tsx) mounts `<FormDevTools form={form.engine} />` under a `FormComposer` debug schema.

### 2.2 `FormStyleDebugger`

Source: [FormStyleDebugger.tsx](../../src/shared/ui/form/tools/FormStyleDebugger.tsx).

| Prop | Type | Meaning |
|---|---|---|
| `field` | `FormField` | Field to trace |

Runs `buildHeroUIClasses(field, false, false, theme, true)` and renders `trace.metadata.sources`, one group per contributor: `base`, `theme`, `intent`, `heuristic`, `explicit`, `magic` (plus the `magic.density.isCompact` badge). Each group lists its class tokens; slots are shown for grouped sources.

`buildHeroUIClasses` is `@deprecated` ([form-styles.ts](../../src/shared/ui/form/utils/form-styles.ts)) in favour of `adapter.buildFieldStyles()` via `useStyleAdapter()` (exported from `@ui/form`). The debugger remains the supported way to see source attribution inside the `styles` tab of `FormDevTools`.

### 2.3 `FormDebugOverlay` and `FieldDebugWrapper`

Source: [FormDebugOverlay.tsx](../../src/shared/ui/form/tools/FormDebugOverlay.tsx).

| Component | Props | Behavior |
|---|---|---|
| `FormDebugOverlay` | `enabled: boolean` | Fixed full-screen 12-column grid inspector with a "Debug Mode: Active" label; returns `null` when `enabled` is `false` |
| `FieldDebugWrapper` | `children`, `id: string`, `type: string`, `enabled?: boolean` | Dashed outline with a hover label `id | type` around one field; passthrough when disabled |

Mounting: [FormShell.tsx](../../src/shared/ui/form/components/FormShell.tsx) mounts the overlay alongside `FormDevTools`; [FieldRouter.tsx](../../src/shared/ui/form/FieldRouter.tsx) wraps every field in `FieldDebugWrapper`. Both are gated by the same `debug` flag — `<Form debug />` flows through `useFormCore` into the shell context and the field registry, so one prop turns the whole apparatus on.

### 2.4 Where they surface

| Surface | Location | Notes |
|---|---|---|
| `<Form debug />` | [FormProps.ts](../../src/shared/ui/form/FormProps.ts) | Auto-mounts `FormDevTools` + `FormDebugOverlay`; enables per-field wrappers |
| `FormDebugPage` | [FormDebugPage.tsx](../../src/shell/pages/static-pages/FormDebugPage.tsx) | Standalone debug schema (text, number, email, select, conditions) + `FormDevTools` |
| Builder page | `/builder` ([FormBuilderPage.tsx](../../src/shell/pages/static-pages/FormBuilderPage.tsx)) | Schema and canvas tabs; no dev-tools panel of its own |
| Storybook | `FormShowcase.stories.tsx`, `RegistryInjection.stories.tsx`, `ResilienceTest.stories.tsx` | Set `debug: true` on the story form |

`FormDebugPage` is **not registered** in [RouterProvider.tsx](../../src/core/providers/RouterProvider.tsx) — no route resolves to it as of this writing. Import it directly if you need the page, or mount `FormDevTools` yourself.

---

## 3. Testing utilities

### 3.1 Engine test helpers

Source: [test-utils.ts](../../src/core/form-core/test-utils.ts), documented in [./reference/02-REGISTRIES.md](./reference/02-REGISTRIES.md) section 8.

| Export | Purpose |
|---|---|
| `createFormCore(definition, initialData?, _onSubmit?)` | Constructs `new FormCore(definition, initialData)` |
| `createTestFormCore(options)` | Minimal one-section, one-text-field form merged with `options.definition` |
| `createMockFormDefinition(overrides?)` | Mock form with required `name` (text) and `email` (email) fields |
| `createAsyncMockFormDefinition(overrides?)` | Mock form with a `select` field using `remoteOptions` |
| `mockOnSubmit`, `mockOnChange`, `mockOnBlur`, `resetFormMocks()` | `vi.fn` mocks for submit/change/blur |
| `waitForFormState(formCore, predicate, timeout = 5000)` | Polls `formCore.state` every 10 ms until `predicate` passes |
| `expectFormValid(formCore, expected = true)` | Throws with the validity dump on mismatch |
| `expectFieldValue(formCore, fieldName, expectedValue)` | Asserts `formCore.values[fieldName]` |
| `expectFieldError(formCore, fieldName, expectedMessage?)` | Resolves the field and asserts a joined error message |

Import through the alias configured in [tsconfig.app.json](../../tsconfig.app.json) and [vitest.config.base.ts](../../vitest.config.base.ts):

```ts
import { createFormCore, createMockFormDefinition } from "@form-core/testing";
```

For DOM tests use `renderWithProviders` from `src/shared/testing/test-utils.tsx` (alias `@testing`), which wraps render in the provider tree.

### 3.2 Verified example

```ts
import { describe, expect, it } from "vitest";

import {
  createFormCore,
  createMockFormDefinition,
  expectFieldValue,
  waitForFormState,
} from "@form-core/testing";

describe("contact form", () => {
  it("flags an emptied required field", async () => {
    const form = createFormCore(createMockFormDefinition(), {
      name: "Ada Lovelace",
    });

    expectFieldValue(form, "name", "Ada Lovelace");

    await form.setValue("name", "");
    await form.validateFields(["name"]);
    await waitForFormState(form, (state) => state.validity.name?.valid === false);

    expect(form.validity.name?.errors?.[0]?.code).toBe("required");
  });
});
```

Two behaviors worth knowing: `validity` is keyed by **both** field id and field name (the fresh result lands on the name key after `validateFields`), and `form.isValid` aggregates over field ids.

`expectFieldError` is currently stale — it calls `formCore.resolver.resolve(...)`, while [resolver.ts](../../src/core/form-core/modules/resolver.ts) exposes `resolveField(identifier)` — so it throws `formCore.resolver.resolve is not a function`. Assert against `form.validity[<name or id>]` until the helper is updated.

### 3.3 Commands

| Command | What runs |
|---|---|
| `pnpm test:form-core` | `vitest run --project form-core` (script name `test:form-core`) |
| `pnpm test:form-core:coverage` | `vitest run -c projects/form-core/vitest.config.ts --coverage` |
| `pnpm test:watch:form` | `vitest --project form-core --watch` |
| `pnpm test:mdap` | `vitest run --project mdap` (compiler and layer suites under `src/shared/ui/form/tests/mdap/`) |
| `pnpm test:integration` | includes `FormDevTools.test.tsx` and `Debug.test.tsx` |

`npm run test:form-core` resolves the same script, but [package.json](../../package.json) enforces pnpm via `"preinstall": "npx only-allow pnpm"` — prefer `pnpm`.

### 3.4 Doctrine and coverage gates

The four-tier doctrine (unit, system, regression, coverage) is specified in [../architecture/10-testing-rules.md](../architecture/10-testing-rules.md).

Enforced thresholds in [projects/form-core/vitest.config.ts](../../projects/form-core/vitest.config.ts):

| Metric | Threshold |
|---|---|
| Statements | 70 |
| Branches | 70 |
| Functions | 60 |
| Lines | 70 |

Coverage includes `src/core/form-core/**/*.{ts,tsx}` and excludes `*.test.*`, `__tests__/**`, and `test-utils.ts` itself. The `mdap` project enforces lower gates (statements 35, branches 30, functions 35, lines 35).

---

## 4. Visual builder

### 4.1 Entry and route

Builder symbols are exported from `@ui/form/builder` ([builder/index.ts](../../src/shared/ui/form/builder/index.ts)) — not from the `@ui/form` barrel:

| Export | Kind |
|---|---|
| `FormBuilder` | Drag-and-drop builder UI component |
| `FormSchemaBuilder` | Fluent class (declared as `class FormBuilder<TFormData>` in [FormSchemaBuilder.ts](../../src/shared/ui/form/builder/FormSchemaBuilder.ts)) |
| `useBuilderStore` | Zustand store with `immer` middleware |

Route: `AppPaths.Builder` (`"/builder"`) renders `FormBuilderPage` lazily in [RouterProvider.tsx](../../src/core/providers/RouterProvider.tsx). [FormBuilderPage.tsx](../../src/shell/pages/static-pages/FormBuilderPage.tsx) has two tabs — `schema` renders `MetadataSchemaForm`, `canvas` renders `<FormBuilder />`.

### 4.2 Panes and drag-drop

Built on `@hello-pangea/dnd`; `FormBuilder` wires `DragDropContext` to `useBoardAsViewModel().onDragEnd`.

| Pane | Source | Behavior |
|---|---|---|
| Toolbar | [FormBuilder.tsx](../../src/shared/ui/form/builder/FormBuilder.tsx) | `preview`/`json` view modes and `board`/`canvas` canvas modes; title opens the form properties modal |
| Component palette | [ComponentPanel.tsx](../../src/shared/ui/form/builder/palette/ComponentPanel.tsx) | `Droppable droppableId="PALETTE"`; items drag as `PALETTE-<type>` |
| Board / canvas | [Board.tsx](../../src/shared/ui/form/builder/board/Board.tsx), [FormCanvas.tsx](../../src/shared/ui/form/builder/board/FormCanvas.tsx), [CanvasSection.tsx](../../src/shared/ui/form/builder/board/CanvasSection.tsx) | Sections drag as `type: "SECTION"`, fields as `type: "FIELD"`; `EMPTY_CANVAS` accepts a palette drop that creates a section plus its first field |
| Properties | [PropertiesModal.tsx](../../src/shared/ui/form/builder/hooks/PropertiesModal.tsx), [panels/](../../src/shared/ui/form/builder/panels/) | Form, section, and field property editors plus validation-rule and condition-group editors |
| Preview | [FormComposer](../../src/shared/ui/form/FormComposer.tsx) | Live rendering of the current definition in `preview` mode |

`onDragEnd` dispatches `addSectionWithField`/`addField` for palette drops, `moveSection` for section reorders, and `moveField`/`moveFieldToSection` for field moves ([useBoardAsViewModel.tsx](../../src/shared/ui/form/builder/hooks/useBoardAsViewModel.tsx)).

### 4.3 Undo/redo history

[builder.store.ts](../../src/shared/ui/form/builder/store/builder.store.ts) keeps `history: FormDefinition[]` and `historyIndex`, capped by `MAX_HISTORY = 50`. Every mutating action truncates redo, pushes a deep clone of the current definition, shifts the oldest entry past 50, then applies the mutation with Immer. `undo()` and `redo()` walk the index and restore snapshots.

No control in the builder UI currently calls `undo`/`redo` — the pair is store-only. Reach it directly: `useBuilderStore.getState().undo()`.

### 4.4 Programmatic definitions with `FormSchemaBuilder`

```ts
import { FormSchemaBuilder } from "@ui/form/builder";

interface InvoiceForm {
  customer: string;
  total: number;
  notes?: string;
}

const definition = new FormSchemaBuilder<InvoiceForm>("invoice", "Invoice")
  .setDescription("Create a new invoice")
  .setSubmitLabel("Create Invoice")
  .addSection({ id: "main", title: "Invoice Details" })
  .addField({ id: "customer", name: "customer", type: "text", label: "Customer" })
  .addField({ id: "total", name: "total", type: "number", label: "Total" })
  .addField({ id: "notes", name: "notes", type: "textarea", label: "Notes" })
  .build();

const checkout = new FormSchemaBuilder("checkout", "Checkout")
  .setDescription("Three-step checkout")
  .addSection({ id: "cart", title: "Cart" })
  .addSection({ id: "shipping", title: "Shipping" })
  .addSection({ id: "payment", title: "Payment" })
  .enableWizardMode({ stepperType: "top", linear: true })
  .build();
```

Chainable mutators: `setDescription`, `setSubmitLabel`, `addSection`, `addField`, `enableWizardMode(options?)`, `setLayoutMode(mode)`, `onInit(handler)`, `onSubmit(handler)`, `injectValidation(fieldId, rules)`, `build()`. `build()` throws when `id` or `title` is missing; both are set by the constructor (`new FormSchemaBuilder(id, title)`).

### 4.5 `useBuilderStore` actions

| Group | Actions |
|---|---|
| State | `formDefinition`, `selection`, `isModalOpen` |
| Selection | `setSelection`, `setModalOpen` |
| Form | `updateForm` |
| Sections | `addSection`, `updateSection`, `removeSection`, `moveSection` |
| Fields | `addField`, `addSectionWithField`, `updateField`, `removeField`, `moveField`, `moveFieldToSection` |
| Validation rules | `addValidationRule`, `updateValidationRule`, `removeValidationRule`, `reorderValidationRules` |
| Conditions | `setFieldConditions`, `addConditionGroup`, `updateConditionGroup`, `removeConditionGroup` |
| History | `undo`, `redo` (`history`, `historyIndex`, `MAX_HISTORY = 50`) |

---

## 5. Debugging recipes

### 5.1 Inspect engine state

`useForm` returns the `Form` facade ([form.ts](../../src/core/form-core/form.ts)), which exposes a 5V snapshot and a subscription:

```tsx
const { form } = useForm<ContactFormValues>(definition, initialData);

const snapshot = form.state;

const unsubscribe = form.subscribe((state) => {
  console.log(state.values, state.validity, state.visibility);
});

return () => unsubscribe();
```

`form.state` is `InternalFormState<T>` ([int-types.ts](../../src/core/form-core/int-types.ts)): `values`, `validity`, `visibility`, `view`, `vitality`, plus `uiState`, `businessState`, `debug`, and `performance`. `subscribe` returns its own unsubscribe function; always return it from the effect to avoid leaks.

### 5.2 Turn on the overlays

```tsx
<Form definition={definition} debug onSubmit={handleSubmit} />
```

`debug` mounts `FormDevTools` and `FormDebugOverlay` in the shell and enables `FieldDebugWrapper` around every field. For an ad-hoc panel outside `<Form>`, mount `<FormDevTools form={form.engine} />` directly; for a one-off class trace, render `<FormStyleDebugger field={form.engine.registry.definition.fields.email} />`.

### 5.3 Common commands

| Command constant | Value | Keybinding |
|---|---|---|
| `PlatformCommand.ToggleFormDevTools` | `platform:toggle-form-devtools` | `ctrl+shift+d` / `meta+shift+d` |
| `PlatformCommand.OpenBuilder` | `platform:open-builder` | — |
| `PlatformCommand.FocusSearch` | `platform:focus-search` | `ctrl+k` / `meta+k` |
| `PlatformCommand.ToggleSidebar` | `platform:toggle-sidebar` | `ctrl+b` / `meta+b` |
| `PlatformCommand.GoHome` | `platform:go-home` | `alt+h` |
| `PlatformCommand.Logout` | `platform:logout` | `alt+q` |

Constants: [shortcuts.ts](../../src/core/events/config/shortcuts.ts). Keys: [settings.json](../../src/core/events/config/settings.json).

---

## 6. Related scripts

| Script | Command | Relevance |
|---|---|---|
| `scaffold` | `node scripts/scaffold.js` | Interactive generator CLI (1.1) |
| `scaffold:form` | `node scripts/scaffold.js zenos-form` | Form scaffold (1) |
| `test:form-core` | `vitest run --project form-core` | Engine, contract, and layout suites |
| `test:form-core:coverage` | `vitest run -c projects/form-core/vitest.config.ts --coverage` | 70/70/60/70 gates (3.4) |
| `test:watch:form` | `vitest --project form-core --watch` | Watch mode for form-core |
| `test:mdap` | `vitest run --project mdap` | MDAP compiler and layer suites |
| `test:core` | `pnpm test:form-core && pnpm test:table-core` | Core package gate |
| `test:integration` | `vitest run --project integration` | Includes `FormDevTools.test.tsx` |
| `test:all` | unit, form-core, table-core, component, integration, mdap, shared-testing | Full platform gate |
| `test:changed` | `node --import=tsx scripts/test/test-changed.ts` | Runs only affected tests |
| `test:quality-gates` | `node --import=tsx scripts/test/quality-gates.ts` | PR quality gate |
| `typecheck` | `tsc -b` | Type gate (currently reports pre-existing errors in tests and MDAP helpers) |

---

**See also:**

- [CONTRACTS_AND_MDAP.md](./CONTRACTS_AND_MDAP.md) — typed contracts, wizard contracts, MDAP compilation
- [QUICK_START.md](./QUICK_START.md) — form authoring patterns
- [./reference/07-COMPONENTS.md](./reference/07-COMPONENTS.md) — `Form`, `FormStepper`, debug tooling, and builder briefs
- [./reference/02-REGISTRIES.md](./reference/02-REGISTRIES.md) — `FlowProxy`, schema registry, backend normalizer, test utilities
- [./reference/06-HOOKS.md](./reference/06-HOOKS.md) — `useForm`, `useFormFacade`, and engine access hooks
- [./reference/10-SHARED_UTILS.md](./reference/10-SHARED_UTILS.md) — `fuseSchema`, `createSimpleForm`, `MetaSchemaBridge`
- [../architecture/10-testing-rules.md](../architecture/10-testing-rules.md) — four-tier testing doctrine and coverage gates
