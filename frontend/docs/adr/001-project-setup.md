# ADR 0001: Use React with Vite for Frontend Development

## Status

**Accepted**

## Date

**2025-11-06**

---

## Context

We are building a **modern frontend** for our application that requires:

- Fast development server with **HMR (Hot Module Reloading)**
- Simple configuration with **TypeScript** support
- Compatibility with **modern ES modules**
- Easy integration with **TailwindCSS**, **ShadCN UI**, and **Lucide Icons**
- A developer-friendly ecosystem that supports **linting**, **formatting**, and **governance rules**

Legacy tools like **Create React App (CRA)** are being deprecated, and **Webpack** introduces unnecessary complexity for our use case.  
**Vite** provides faster builds, native ESM support, and an optimal setup for modular and scalable frontend architecture.

---

## Decision

We will use **React with Vite** as the base setup for our frontend.

This stack provides:

- ⚡ **Vite** — lightning-fast dev server and build system.
- ⚛️ **React 18+** — component-based architecture and ecosystem familiarity.
- 🎨 **TailwindCSS v4** — utility-first styling framework.
- 🧩 **ShadCN UI** + **Radix Primitives** — composable, accessible UI components.
- 🔧 **Lucide React** — modern, lightweight icon system.

---

## Governance and Tooling Setup

To ensure maintainability and code consistency across teams, we will enforce the following development standards:

### Code Quality

- **ESLint** for linting and enforcing code standards.
- **Prettier** for consistent code formatting.
- **TypeScript strict mode** enabled for type safety.

### Repository Rules

- **Commitlint + Husky** for commit message validation and pre-commit hooks.
- **Directory-based module structure** for domain separation.
- **Component guidelines**:
  - Each component must follow functional pattern with `tsx`.
  - Prefer composition over inheritance.
  - Use `props` typing via TypeScript interfaces.

### UI Consistency

- Centralized theme tokens in Tailwind’s theme config.
- Follow ShadCN component conventions (`ui/` folder for shared components).
- Use Lucide icons for visual consistency across modules.

---

## Alternatives Considered

| Option                     | Description                                             | Decision                                                    |
| -------------------------- | ------------------------------------------------------- | ----------------------------------------------------------- |
| **Next.js**                | Excellent SSR/SSG framework, but not needed for SPA.    | ❌ Rejected – Overkill for current architecture.            |
| **Create React App (CRA)** | Legacy scaffolding, slow build times, poor ESM support. | ❌ Rejected – Deprecated by React community.                |
| **Parcel**                 | Zero-config bundler with good performance.              | ⚠️ Considered – Less ecosystem support and plugin maturity. |

---

## Consequences

### Positive

- ⚡ Extremely fast development experience with hot reloads.
- 🧩 Modular architecture that scales easily.
- 🛠️ Strong TypeScript and TailwindCSS integration.
- 🧹 Enforced governance (ESLint, Prettier, Husky) ensures maintainable codebase.

### Negative

- 🚫 No built-in SSR (can integrate later via Remix or Next.js if needed).
- ⚙️ Requires manual setup for linting, formatting, and CI/CD pipeline configuration.

---

## References

- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [TailwindCSS v4](https://tailwindcss.com/)
- [ShadCN UI](https://ui.shadcn.com/)
- [Lucide React](https://lucide.dev/)
- [ESLint](https://eslint.org/)
- [Prettier](https://prettier.io/)
