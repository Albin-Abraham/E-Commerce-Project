# Zenith Architectural Manifesto

This document outlines the core principles for maintaining and extending the Zenith Design System within this project.

## 🧠 The Mental Model

Modern web layout is governed by four synchronized layers:

1. **Responsive Foundations**: Fluid typography and mobile-first logic.
2. **Modern Layout Design**: Intrinsic grids and atomic component structures.
3. **Advanced Adaptation**: Adaptive density based on data/viewport context.
4. **Performance Layer**: Layout shift boundaries and virtualized rendering.

---

## 📐 Breakpoint Management

We move beyond static Tailwind prefixes by using a programmatic **Breakpoint Engine**:

- **Media Queries (`mq`)**: Use `mq.up('md')` or `mq.between('sm', 'lg')` for global viewport logic.
- **Container Queries (`cq`)**: Use `cq(400)` for component-level responsiveness that ignores the viewport and responds to its parent container.
- **Fluid Thresholds**: Use `fluid(min, max)` for continuous scaling rather than discrete jumps.

---

## ✅ Extensibility Checklist

Before adding a new feature or component, ask:

1. **Is it tokenized?**
   - Does it live in `tokens.ts`? Avoid magic numbers in CSS/TSX.
2. **Is it fluid?**
   - Does it scale gracefully using `clamp()` or percentages without breaking?
3. **Is it stable?**
   - Does it have a defined layout boundary (CLS prevention)?
4. **Is it performant?**
   - Does it use `LazyMotion` for animations? Does it trigger via `Intersection Observer`?

---

## 🎬 Animation Defaults (Standard Motion)

We use a **Motion-First** approach where animations are semantic, not decorative:

- **Swipe In (Bottom)**: Standard entrance for cards and sections.
- **Swipe In (Side)**: Used for staggered grid items.
- **Elastic**: High-tension feedback for interactive elements (buttons/toggles).
- **Fade**: Subtle entrance for background elements.

All animations must use `framer-motion` with the `LazyMotion` provider to maintain zero-latency interaction.

---

## 🏗️ Organizational Principles

### 1. Domain-Driven Design (DDD)

We organize code by **Business Domain** rather than **Technical Layer**:

- **Features (`src/features/`)**: Self-contained modules like `products` or `checkout`.
- **Shared (`src/shared/`)**: Domain-agnostic infrastructure (Theme, Utils, Base UI).
- **Hooks (`src/hooks/`)**: Reusable logic that bridges domains.

### 2. Component-Driven Architecture (CDA)

Build from the bottom up. A page is simply an orchestration of **Organisms** and **Molecules**.

- If a component does too much, split it into smaller, stateless primitives.

### 3. The 255-Line Rule

To maintain extreme readability and focus:

- **Max File Length**: 255 lines.
- **Action**: If a file exceeds this, extract logic into a custom hook or decompose the UI into sub-components. This forces a cleaner "Separation of Concerns."

### 4. Public APIs (`index.ts`)

Each module folder must export its "Public Interface" via `index.ts`.

- **Rule**: Never import deep into a module (e.g., `import X from "@/features/auth/ui/Button"`).
- **Correct**: `import { Button } from "@/features/auth"`.
- This ensures that internal refactoring doesn't cause cascading breaks across the codebase.
