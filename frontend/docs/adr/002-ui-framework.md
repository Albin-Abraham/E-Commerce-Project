# ADR 0002: Choose UI Framework for React Frontend Development

## Status

**Proposed**

## Date

**2025-11-06**

---

## Context

We need a consistent, scalable, and developer-friendly **UI framework** for our React frontend built with **Vite** and **TailwindCSS v4**.

The chosen framework should:

- Offer accessible, production-ready components.
- Integrate seamlessly with TailwindCSS and modern React patterns.
- Support custom themes and dark mode.
- Provide strong TypeScript support and tree-shakable modules.
- Have an active open-source community and long-term maintenance potential.

---

## Options Considered

| Library                      | Description                                                | Pros                                                                       | Cons                                                              |
| ---------------------------- | ---------------------------------------------------------- | -------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| **ShadCN UI + Lucide React** | Headless Tailwind-based components using Radix Primitives. | Full Tailwind integration, accessible, customizable, modern design system. | Manual setup & maintenance; not an npm package.                   |
| **Material UI (MUI)**        | Google’s Material Design system for React.                 | Mature ecosystem, extensive docs, many components.                         | Heavy theming layer; conflicts with Tailwind; opinionated design. |
| **Chakra UI**                | Simple, composable React components with theme support.    | Easy to use, themable, accessible, good DX.                                | Redundant with Tailwind; limited low-level styling control.       |
| **Ant Design (AntD)**        | Enterprise-grade UI kit from Alibaba.                      | Feature-rich, good table/forms, large community.                           | Large bundle size; opinionated styling; less flexible theming.    |
| **Mantine UI**               | React components + hooks library with good customization.  | Excellent DX, SSR support, Tailwind-friendly, modular.                     | Different styling system (Emotion); not purely Tailwind-first.    |
| **NextUI**                   | Modern UI library with minimalistic design.                | Lightweight, responsive, customizable.                                     | Smaller ecosystem; limited advanced components.                   |
| **Radix UI (raw)**           | Low-level accessible primitives.                           | High flexibility, composable base.                                         | Requires custom styling for every component.                      |
| **Headless UI**              | Tailwind Labs’ official headless components.               | Native Tailwind integration, flexible.                                     | Minimal prebuilt styling; smaller component set.                  |

---

## Decision

Adopt the following UI stack:

- **Primary Component Framework:** `ShadCN UI`
- **Icon System:** `Lucide React`
- **Styling System:** `TailwindCSS v4` (theme-based configuration)
- **Primitives:** `Radix UI` (used under the hood in ShadCN)

This combination provides a modern, composable, and accessible foundation that fits our design and development workflow.

---

## Rationale

- ShadCN UI aligns with **TailwindCSS philosophy** (utility-first, composable, themeable).
- Radix UI ensures **accessibility and unstyled primitives** for flexibility.
- Lucide React integrates smoothly into Tailwind-based designs.
- The ecosystem is **developer-friendly** and easy to extend with custom components.
- Avoids vendor lock-in (unlike MUI or AntD).

---

## Alternatives Rejected

1. **MUI / AntD** — Too opinionated and heavy for Tailwind-first design.
2. **Chakra UI** — Great DX but redundant with Tailwind.
3. **Mantine / NextUI** — Lightweight, but styling ecosystem conflicts with Tailwind utility workflow.
4. **Headless UI (alone)** — Limited components; would require building everything manually.

---

## Consequences

**Positive:**

- Lightweight, flexible, and consistent design system.
- Accessible, composable, and future-proof component structure.
- Faster development of reusable design tokens and themes.

**Negative:**

- Requires local maintenance of ShadCN components.
- Upgrading components may need manual merges.

---

## References

- [ShadCN UI Docs](https://ui.shadcn.com)
- [Lucide React Docs](https://lucide.dev)
- [Radix Primitives](https://www.radix-ui.com/primitives/docs/overview/introduction)
- [Mantine](https://mantine.dev)
- [NextUI](https://nextui.org)
- [Chakra UI](https://chakra-ui.com)
- [Material UI](https://mui.com)
- [Ant Design](https://ant.design)
