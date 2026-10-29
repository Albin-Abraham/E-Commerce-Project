# Field System Architecture: Atoms, Static, Structures & Wrapped Fields

**Status:** Approved  
**Domain:** Form & Detail UI Field Ecosystem  
**Target Architecture:** ZenOS Design Component System (DCS)  

---

## 1. Overview & Architectural Intent

The ZenOS field ecosystem bridges two core requirements:
1. **Interactive Form Input & Mutation**: Collecting, validating, and submitting user data without full-tree re-render bottlenecks.
2. **Formless Detail Presentation**: Inspecting and formatting entity data into responsive, accessible sheets with zero `<form>` overhead.

To maintain clean separation of concerns and high composability, all field components are organized into a **4-Tier Taxonomy**. For an in-depth audit of native behavior vs. UI presentation separation and the full rendering pipeline, see [FIELD_PRESENTATION_AND_RENDERING_ARCHITECTURE.md](./FIELD_PRESENTATION_AND_RENDERING_ARCHITECTURE.md). For optical alignment, design tokens, and WAI-ARIA standards, see [FIELD_DESIGN_SYSTEM_AND_STYLING_SPEC.md](./FIELD_DESIGN_SYSTEM_AND_STYLING_SPEC.md).

```
┌────────────────────────────────────────────────────────────────────────┐
│                        4-TIER FIELD TAXONOMY                           │
├───────────────┬────────────────────────────────────────────────────────┤
│ Tier 4        │ Wrapped Fields (FormTextField, FormSelectField, etc.)  │
│               │ Pre-composed with `withAtom` + Wrapper Trinity         │
├───────────────┼────────────────────────────────────────────────────────┤
│ Tier 3        │ Structures & Containers                                │
│               │ OuterWrapper, InputWrapper, FieldShell, CardField,     │
│               │ TabsField, AccordionField, RepeaterField, SlotField    │
├───────────────┼────────────────────────────────────────────────────────┤
│ Tier 2        │ Static Fields (HeaderField, DividerField, Callouts)   │
│               │ Non-input schema presentation and visual hierarchy    │
├───────────────┼────────────────────────────────────────────────────────┤
│ Tier 1        │ Atoms (Primitive Inputs & Detail Value Formatters)     │
│               │ TextField, SwitchField, DetailValueDisplay             │
└───────────────┴────────────────────────────────────────────────────────┘
```

---

## 2. Tier 1: Atoms (Primitive Inputs vs. Detail Value Displays)

Atoms represent the rawest unit of data interaction.

### Form UI: Primitive Input Atoms (`src/shared/ui/form/fields/primitive/`)
- **Components**: `TextField`, `NumberInputField`, `SelectField`, `RadioField`, `CheckboxField`, `SwitchField`, `TextareaField`, `RangeField`, `FileField`, `PhoneField`, `ImageField`, `CodeInputField`, `AutocompleteField`, `SearchInputField`.
- **Styling**: Tokenized CSS variables (`var(--radius)`, `var(--border)`).
  - Heights: 32px (`compact`), 40px (`comfortable`), 48px (`spacious`).
  - Interactive states: `:hover`, `:focus-visible` (primary glow ring), `:disabled` (opacity-50, cursor-not-allowed), `:invalid` (danger border).
- **State Lifecycle**: Atomic state management via React standard props (`value`, `defaultValue`, `onChange`, `onBlur`).

### Detail UI: Detail Value Display (`DetailValueDisplay`)
- **Responsibility**: Pure functional transformation of entity data into styled badges and semantic text.
- **Visual Mapping**:
  - `boolean / switch / checkbox`: Status pills with `Check` or `X` micro-icons.
  - `select / radio`: Resolved option label with tag pills and category icons.
  - `currency`: Locale-formatted currency (`formatCurrencyValue`).
  - `date`: Locale-formatted dates (`formatDateValue`).
  - `email / phone / url`: Clickable anchor tags with external security flags (`rel="noopener noreferrer"`).
  - `empty / null / undefined`: Muted fallback token (`—`).
- **State Lifecycle**: Stateless projection (`(value, type, options) => JSX`).

---

## 3. Tier 2: Static Fields (`StaticFields.tsx`)

Static fields provide visual rhythm, grouping, and explanatory context without taking user input.

- **`HeaderField`**:
  - Maps to semantic HTML heading tags (`<h1>` through `<h6>`).
  - Typography variants: `h1` (4xl-5xl font-extrabold), `h2` (3xl font-semibold), `h3` (2xl font-semibold), `h4` (xl), `h5` (lg), `h6` (base).
  - Text alignments: `left`, `center`, `right`.
  - Secondary helper text: `field.properties.description`.
- **`DividerField`**:
  - Semantic horizontal rules (`<hr className="border-t border-border/60 my-4" />`).
- **`Alert` / `Callout`**:
  - Feedback surfaces: `info`, `warning`, `danger`, `success`.

In `DetailRenderer`, static fields are rendered cleanly via `DetailHeader` and divider rows, separating sections without form baggage.

---

## 4. Tier 3: Structures & The Wrapper Trinity

Structures govern spatial layout, accessibility, and supplemental UI around inputs.

### The Wrapper Trinity
Every wrapped input field is surrounded by three orchestrated layers:

```
┌────────────────────────────────────────────────────────────────────────┐
│ OuterWrapper                                                          │
│  - Prefix icon (startContent / startIcon)                             │
│  - Suffix icon (endContent / endIcon)                                 │
│  - Action slots (password reveal, clear button, custom action)        │
│  - Field tooltip popover                                              │
│ ┌────────────────────────────────────────────────────────────────────┐ │
│ │ InputWrapper                                                       │ │
│ │  - Field label (<FieldLabel />) with required asterisk (*)         │ │
│ │  - Description helper text                                         │ │
│ │  - Accessibility wiring (aria-describedby, aria-invalid)           │ │
│ │  - Validation feedback (<FieldFeedback />)                        │ │
│ │ ┌────────────────────────────────────────────────────────────────┐ │ │
│ │ │ Box (Primitive Input Atom)                                     │ │ │
│ │ │  - Density tokens, CSS variables, native input control         │ │ │
│ │ └────────────────────────────────────────────────────────────────┘ │ │
│ └────────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
```

### Layout Wrappers
- **`FieldShell`**:
  - Handles responsive column spans (`col-span-12 md:col-span-6`).
  - Manages `labelPlacement`: `"top"` (standard stacked), `"left"` (two-column horizontal), or `"floating"`.
  - Reserves error spacing (`reserveErrorSpace`) to prevent layout shifts (CLS) when validation messages trigger.

### Structural Containers
- **`CardField` / `DetailKeyDetailsCard`**: Elevated card container (`bg-card border border-border rounded-2xl shadow-xs`).
- **`TabsField`**: Pill tab navigation with smooth transition indicators.
- **`AccordionField`**: Collapsible container with animated chevrons.
- **`RepeaterField`**: Dynamic sub-form collection with row add/remove actions.
- **`SlotField`**: Inversion-of-control container rendering custom client components.

---

## 5. Tier 4: Wrapped Fields (`wrapped-fields.ts`)

Wrapped fields are the primary building blocks for application developers:
- `FormTextField`, `FormSelectField`, `FormNumberInputField`, `FormSwitchField`, `FormCheckboxField`, `FormRadioField`, `FormRangeField`, `FormTextareaField`, `FormButtonField`.

### The `withAtom` HOC (DCS Layer)
Wrapped fields are created via `withAtom(PrimitiveComponent, options)`:
1. **Direct Props & Schema Invocation**: Can be invoked as JSX (`<FormTextField name="email" label="Email" />`) or compiled automatically by `FormComposer` from schema JSON.
2. **Micro-Subscription Architecture** (`useFieldAtom`):
   - Rather than forcing the parent form to re-render on every keystroke, the field subscribes directly to `FormCore` state atoms.
   - Updates only re-render the single input atom that changed.

---

## 6. Form UI vs. Detail UI: Detailed Comparison Matrix

| Dimension | Form UI (`FormComposer` / `wrapped-fields`) | Detail UI (`DetailRenderer` / `DetailRenderers`) |
| :--- | :--- | :--- |
| **Primary Intent** | User data capture, interactive validation, API mutations. | Entity inspection, specification sheets, audit inspection. |
| **DOM Root** | `<form role="form" onSubmit={...}>` | Semantic `<article data-detail-renderer="true">` |
| **Field Rendering** | Interactive editable inputs with focus rings and error states. | Formatted read-only values (`DetailValueDisplay`) and key-value rows. |
| **Empty State** | Empty input box with placeholder (`placeholder="Enter SKU..."`). | Standardized muted fallback token (`—`). |
| **Validation** | Active validation engine (Zod/Yup, error messages, touch state). | Zero validation pipeline; data is assumed canonical. |
| **Density Control** | Modifies input height (32px / 40px / 48px). | Modifies padding (`py-1.5` / `py-3` / `py-4`) and font scale. |
| **Action Areas** | Submit button (`type="submit"`), reset, save draft. | Sticky action bar (`DetailBottomActions`): Export, Share, Duplicate. |
| **Interactive Mode** | Default mode of operation. | Optional (`mode="interactive"`): Renders standalone widgets without `<form>`. |

---

## 7. UX/UI & Ergonomics Standards

1. **Touch-Safe Targets**: Minimum 48px touch targets for mobile action buttons, accordion toggles, and switches.
2. **Zero Form Pollution**: Screen readers and password managers do not mistake read-only detail sheets for editable login or payment forms.
3. **Contrast Ratios**: All label-to-value pairings meet WCAG AA standards (>4.5:1 contrast).
4. **Resilient Slots**: Structural slots (`headerSlot`, `mediaSlot`, `actionSlot`, `footerSlot`) allow embedding live graphs, image galleries, and audit timelines without breaking schema flow.
