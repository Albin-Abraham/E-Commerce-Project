# Field Design System & Styling Specification

**Status:** Approved & Implemented  
**Domain:** Form & Detail UI Field Ecosystem  
**Target Architecture:** ZenOS Design Component System (DCS)  
**Standard:** Token-First (Zero Inline Tailwind in Controls), WAI-ARIA 1.2+  

---

## 1. Executive Summary & Design System Vision

The ZenOS Field System enforces a strict **Token-First Architecture** across all form control components (`RadioGroup`, `RadioControl`, `SwitchControl`, `SwitchField`, `CheckboxControl`, `CheckboxField`).

### Core Mandates:
1. **Zero Inline Tailwind Strings**: Field atoms must never contain arbitrary or ad-hoc Tailwind utility classes directly in their TSX templates. All layout, spacing, border, foreground, background, and opacity values derive exclusively from centralized tokens defined in `src/shared/theme/tokens/forms.ts`.
2. **Deterministic Optical Baseline Alignment**: Binary and selection controls must align flawlessly with adjacent typography across single-line and multi-line (title + description) states without unanchored vertical floating or baseline mismatch.
3. **Semantic HTML Compliance**: Eliminate illegal nested `<label>` tags. Control atoms render as semantic `<span>` or direct `<input>` tags, delegating click-focus forwarding to a single parent `<label>`.
4. **WAI-ARIA 1.2+ Accessibility**: Full keyboard roving tabIndex, boundary-wrapping arrow navigation, home/end keys, and accurate ARIA attributes (`role="switch"`, `aria-checked`, `indeterminate`).

---

## 2. The Optical Alignment Architecture

### 2.1 The Problem: Cap-Height vs. Control Box Physics
In standard web typography, a standard 14px font (`text-sm`) with a 20px line-height (`leading-snug` or `leading-relaxed`) places the font's optical cap-height between $y = 3\text{px}$ and $y = 17\text{px}$ within the 20px line box.

When paired with a control box (e.g. an 18px Radio circle, 20px Checkbox square, or 24px Switch track):
- **Single-line labels**: Applying `items-center` creates symmetrical vertical balance between the single text line and the control atom.
- **Multi-line labels (Title + Description)**: If `items-center` is retained, the control atom is vertically centered across the combined height of the title and description ($40\text{px}+$), causing the switch or radio button to float unanchored in the middle of nowhere.
- **Naïve `items-start`**: If plain `items-start` is applied, the top of the control aligns at $y = 0\text{px}$, while the text cap-height starts at $y \approx 3\text{px}$. The control appears visibly "pushed up" relative to the text heading.

```
Multi-line Optical Alignment:
┌─────────────────────────────────────────────────────────────────┐
│ [ Control Atom ] ── mt-0.5 (2px optical nudge)                  │
│   ↓                                                             │
│ ┌────┐  Title Heading (cap-height aligned with control top)     │
│ └────┘  Description text flows naturally beneath               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 The Token-First Solution
We resolve this with adaptive alignment tokens in `tokens.form.controls.layout`:

| Token | Class Definition | Usage Context |
|---|---|---|
| `layout.singleLine` | `group relative flex items-center gap-3 cursor-pointer select-none` | Default label without description |
| `layout.multiLine` | `group relative flex items-start gap-3 cursor-pointer select-none` | Label with description or help text |
| `layout.controlOffset` | `mt-0.5 shrink-0` | Control atom top offset in multi-line layouts |
| `layout.controlCenter` | `shrink-0` | Control atom in single-line layouts |
| `layout.labelStack` | `flex flex-col min-w-0 flex-1` | Container for title + description |
| `layout.labelRow` | `flex items-center gap-2` | Row container for icon + title |

### 2.3 Compounded Gap Bug Eradication
In legacy implementations, parent `<label>` containers utilized `space-x-3` while child text wrappers added `ml-2.5`. In Tailwind CSS, `space-x-3` injects `margin-left: 0.75rem` (12px) on all children after the first. Combined with `ml-2.5` (10px), the effective spacing was:
$$\text{Effective Gap} = 12\text{px} + 10\text{px} = 22\text{px}$$

Conversely, Card mode omitted `space-x-3`, leaving only `ml-2.5` (10px). This resulted in an unpredictable 12px discrepancy between Default and Card variants.

**Resolution**: Both `space-x-*` and `ml-*` were completely eliminated and replaced with a uniform `gap-3` (12px) on the parent flex container and zero margin on `layout.labelStack`.

---

## 3. Design Token Reference (`src/shared/theme/tokens/forms.ts`)

### 3.1 Control Layout & Typography Tokens

```typescript
// tokens.form.controls.layout
layout: {
  singleLine: "group relative flex items-center gap-3 cursor-pointer select-none",
  multiLine: "group relative flex items-start gap-3 cursor-pointer select-none",
  disabled: "opacity-50 cursor-not-allowed pointer-events-none",
  controlOffset: "mt-0.5 shrink-0",
  controlCenter: "shrink-0",
  labelStack: "flex flex-col min-w-0 flex-1",
  labelRow: "flex items-center gap-2",
}

// tokens.form.controls.typography
typography: {
  title: "text-sm font-medium transition-colors select-none leading-snug",
  titleChecked: "font-semibold text-foreground",
  titleUnchecked: "text-foreground/80 group-hover:text-foreground",
  description: "text-xs text-muted-foreground mt-0.5 leading-relaxed",
  icon: "transition-colors shrink-0",
  iconChecked: "text-primary",
  iconUnchecked: "text-foreground/50",
}
```

### 3.2 Checkbox Tokens

```typescript
// tokens.form.controls.checkbox
checkbox: {
  container: "relative inline-flex items-center justify-center h-5 w-5 shrink-0 select-none",
  input: "peer h-5 w-5 rounded-md border-2 transition-all duration-200 cursor-pointer appearance-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  unchecked: "border-border/70 bg-transparent group-hover:border-primary/60",
  checked: "checked:bg-primary checked:border-primary",
  indeterminate: "bg-primary border-primary",
  icon: "absolute inset-0 h-5 w-5 text-primary-foreground pointer-events-none p-1 transition-opacity duration-200",
  iconCheck: "opacity-0 peer-checked:opacity-100",
  iconIndeterminate: "opacity-100",
  card: "group relative flex items-start p-3.5 rounded-xl border w-full transition-all duration-200 cursor-pointer select-none gap-3",
  cardChecked: "border-primary bg-primary/5 dark:bg-primary/10 shadow-xs",
  cardUnchecked: "border-border/70 bg-surface/40 hover:bg-surface-elevated/70 hover:border-primary/40 dark:bg-surface/20 dark:hover:bg-surface-elevated/40",
}
```

### 3.3 Switch (Toggle) Tokens

```typescript
// tokens.form.controls.switch
switch: {
  container: "relative inline-flex items-center cursor-pointer select-none shrink-0 transition-opacity duration-200",
  sizes: {
    sm: { track: "w-8 h-4.5", thumb: "w-3.5 h-3.5 top-0.5 left-0.5", thumbChecked: "translate-x-3.5" },
    md: { track: "w-11 h-6", thumb: "w-5 h-5 top-0.5 left-0.5", thumbChecked: "translate-x-5" },
    lg: { track: "w-14 h-7.5", thumb: "w-6 h-6 top-0.5 left-0.5", thumbChecked: "translate-x-6.5" },
  },
  track: "relative shrink-0 rounded-full transition-colors duration-200 bg-muted/70 peer-checked:bg-primary peer-focus-visible:ring-2 peer-focus-visible:ring-primary/40 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background",
  thumb: "absolute rounded-full bg-background shadow-md transition-transform duration-200 pointer-events-none",
  card: "group relative flex items-center justify-between p-4 rounded-xl border w-full transition-all duration-200 cursor-pointer select-none gap-4",
  cardChecked: "border-primary bg-primary/5 dark:bg-primary/10 shadow-xs",
  cardUnchecked: "border-border/70 bg-surface/40 hover:bg-surface-elevated/70 hover:border-primary/40 dark:bg-surface/20 dark:hover:bg-surface-elevated/40",
}
```

### 3.4 Radio Tokens

```typescript
// tokens.form.controls.radio
radio: {
  group: {
    vertical: "flex flex-col space-y-3 w-full",
    horizontal: "flex flex-row flex-wrap gap-4 items-center w-full",
    grid: "grid grid-cols-1 gap-2.5 sm:grid-cols-2 w-full",
    segmented: "inline-flex p-1 bg-muted/40 rounded-xl border border-border/50 gap-1 flex-wrap",
  },
  indicator: {
    base: "relative flex items-center justify-center shrink-0 w-4.5 h-4.5 rounded-full border-2 transition-all duration-200 peer-focus-visible:ring-2 peer-focus-visible:ring-primary/40 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background",
    checked: "border-primary bg-primary/10",
    unchecked: "border-border/70 group-hover:border-primary/60 bg-transparent",
    dot: "w-2 h-2 rounded-full bg-primary transition-transform duration-200",
    dotChecked: "scale-100",
    dotUnchecked: "scale-0",
  },
  card: {
    base: "group relative flex items-start p-3.5 rounded-xl border w-full transition-all duration-200 cursor-pointer select-none gap-3",
    checked: "border-primary bg-primary/5 dark:bg-primary/10 shadow-xs",
    unchecked: "border-border/70 bg-surface/40 hover:bg-surface-elevated/70 hover:border-primary/40 dark:bg-surface/20 dark:hover:bg-surface-elevated/40",
  },
  segmented: {
    item: "relative inline-flex items-center justify-center px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-200 cursor-pointer select-none",
    itemChecked: "bg-background text-foreground shadow-xs border border-border/60",
    itemUnchecked: "text-foreground/70 hover:text-foreground hover:bg-background/40",
  },
}
```

---

## 4. Visual State Matrix (Border, Opacity, Background, Foreground)

| State | Border | Background (Light) | Background (Dark) | Foreground / Accent | Opacity |
|---|---|---|---|---|---|
| **Default (Unchecked)** | `border-border/70` | `bg-surface/40` or `bg-transparent` | `dark:bg-surface/20` | `text-foreground/80` | `100%` |
| **Hover** | `border-primary/60` | `hover:bg-surface-elevated/70` | `dark:hover:bg-surface-elevated/40` | `group-hover:text-foreground` | `100%` |
| **Focus-Visible** | Ring: `ring-primary/40` Offset: `ring-offset-background` | Same as state | Same as state | Same as state | `100%` |
| **Checked / Active** | `border-primary` | `bg-primary/5` (Card) / `bg-primary` (Input) | `dark:bg-primary/10` | `text-foreground font-semibold` | `100%` |
| **Indeterminate** | `border-primary` | `bg-primary` | `dark:bg-primary` | `text-primary-foreground` | `100%` |
| **Disabled** | `border-border/40` | Muted background | Dark muted | `text-muted-foreground` | `opacity-50` (`pointer-events-none`) |

---

## 5. WAI-ARIA 1.2+ Accessibility & Keyboard Invariants

### 5.1 Switch (`SwitchControl`)
- **Role**: `role="switch"` natively assigned to the hidden input.
- **State**: `aria-checked="true" | "false"`.
- **Keyboard**: Native spacebar activates the switch. Focus ring appears on the visual track via `peer-focus-visible:ring-2`.

### 5.2 Checkbox (`CheckboxControl`)
- **Indeterminate Support**: DOM `input.indeterminate` property is dynamically synchronized via `useEffect`.
- **Error States**: Integrates `aria-invalid` and `aria-errormessage`.
- **Label Association**: Click on parent `<label>` activates the checkbox without event collisions.

### 5.3 Radio Group (`RadioGroup`)
- **Role**: `role="radiogroup"` on root container.
- **Roving `tabIndex`**:
  - The checked radio option has `tabIndex=0`.
  - All unchecked radio options have `tabIndex=-1`.
  - If no radio is checked, the first enabled option receives `tabIndex=0`.
- **Keyboard Navigation**:
  - `ArrowDown` & `ArrowRight`: Moves focus and selection to next option (wraps from last to first).
  - `ArrowUp` & `ArrowLeft`: Moves focus and selection to previous option (wraps from first to last).
  - `Home`: Immediately selects first enabled option.
  - `End`: Immediately selects last enabled option.

---

## 6. Testing & Conformance Standards

Every field component adheres to automated verification gates:
1. **A11y Tests (`src/shared/ui/form/tests/ControlAtomsA11y.test.tsx`)**:
   - Validates roving tabIndex, keyboard navigation, and ARIA roles.
2. **Live Conformance Tests (`src/shared/ui/form/tests/StorybookLiveConformance.test.tsx`)**:
   - Validates that Storybook stories instantiate all variants (Default, Card, Segmented, Error, Disabled) without throwing.
3. **Architecture Boundary Tests (`src/shared/ui/form/tests/ArchitectureBoundary.test.tsx`)**:
   - Confirms Tier 1 atoms do not import form-level stores or schemas.
4. **Storybook Build**:
   - Zero compilation errors during `pnpm build-storybook`.

---

## 7. Modular Export System & Package Architecture

The form module abandons monolithic flattened barrels in favor of a strictly partitioned, modular architecture across 6 decoupled sub-index domains:

```
src/shared/ui/form/
├── fields/
│   ├── primitive/
│   │   ├── index.ts          ── Primitive Input Atoms (btn, radio, codeinput, text, etc.)
│   │   └── controls/         ── Pure visual controls (RadioControl, SwitchControl, CheckboxControl)
│   ├── structure/
│   │   └── index.ts          ── Structural layout fields (Card, Container, Tabs, Accordion, Repeater)
│   └── index.ts              ── Aggregates Tier 1-4 fields and runtime registries
├── structure/
│   └── index.ts              ── Wrapper Trinity (FieldShell, InputWrapper, OuterWrapper/FieldSurface)
├── components/
│   └── index.ts              ── High-level @form-ui components (FormShell, Skeletons, Error/Empty states)
├── context/
│   └── index.ts              ── Reactive state orchestration (22 isolated context providers and hooks)
└── index.ts                  ── Clean partitioned composition root
```

### Module Responsibilities:
1. **`@ui/form/fields/primitive`**: Independent input primitives and atoms (`ButtonField`, `RadioField`, `CodeInputField`, `TextField`, `CheckboxField`, `SwitchField`, etc.).
2. **`@ui/form/fields/structure`**: Container layouts that nest child fields (`CardField`, `ContainerField`, `TabsField`, `AccordionField`, `RepeaterField`).
3. **`@ui/form/structure`**: The **Wrapper Trinity** providing outer chrome, floating labels, counters, clear buttons, and validation feedback.
4. **`@ui/form/components`**: Structural form UI primitives (`FormShell`, `FormSkeleton`, `FormValidationSummary`, `FormNavigationGuard`).
5. **`@ui/form/context`**: Headless form state, event orchestration, and multi-step wizard state engines.
6. **`@ui/form`**: Root entry point cleanly partitioned into distinct named namespaces.

---

## 8. Isolated & Standalone Control Styling (Zero-Context Fallback)

Form inputs must maintain design integrity both when orchestrated within a `FieldShell` / `OuterWrapper` and when consumed as standalone, unmanaged React controls.

### 8.1 Standalone Input Tokens (`tokens.form.controls.standaloneInput`)
When an input component (`TextField`, `NumberInputField`, `TextareaField`) detects an isolated environment (`!isManaged` and `composition.mode !== "managed"`), it switches from transparent/borderless mode to standalone styling:

```typescript
// tokens.form.controls.standaloneInput
standaloneInput: {
  base: "w-full rounded-xl border border-border/80 dark:border-border-strong bg-surface/60 dark:bg-surface/30 px-3.5 py-2.5 text-sm font-medium text-foreground transition-all duration-200 outline-none shadow-2xs placeholder:text-foreground/40",
  hover: "hover:border-primary/50 hover:bg-surface-elevated/50",
  focus: "focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-background",
  error: "border-destructive focus:border-destructive focus:ring-destructive/20",
  disabled: "opacity-50 cursor-not-allowed bg-muted/20 border-border/40 pointer-events-none",
}
```

- **Inside `OuterWrapper` (`isManaged === true`)**: Renders with `bg-transparent border-none shadow-none focus:ring-0` to let the outer surface handle borders, states, and elevation without duplicate borders or clipping.
- **Isolated / Unmanaged (`isManaged === false`)**: Applies `standaloneInput` tokens directly to guarantee complete visual styling (border, border-style, hover, focus ring, padding, background).

### 8.2 Verification Code & OTP Tokens (`tokens.form.controls.codeInput`)
`CodeInputField` utilizes isolated digit box styling that bypasses outer wrapper resets:
- **6-Digit OTP Grouping**: Automatically splits into two 3-digit clusters separated by a rounded divider (`[ ][ ][ ] — [ ][ ][ ]`) for enhanced optical readability.
- **4-Digit PIN Grouping**: Centered cluster with uniform spacing.
- **Tokens**:
  - `codeInput.box`: Rounded corners (`rounded-xl`), crisp border (`border-border/80`), elevation (`shadow-2xs`), bold centered text (`text-xl font-bold`).
  - `codeInput.boxHover`: `hover:border-primary/50 hover:bg-surface-elevated/50`.
  - `codeInput.boxFocused`: `border-primary ring-4 ring-primary/15 bg-background shadow-xs scale-105 z-10`.
  - `codeInput.boxFilled`: `border-primary/60 bg-primary/5 dark:bg-primary/10 text-foreground font-extrabold`.
  - `codeInput.boxError`: `border-destructive ring-4 ring-destructive/15 text-destructive`.

