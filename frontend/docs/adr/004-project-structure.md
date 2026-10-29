# ADR 0004: Folder Structure and Module Architecture for React + Vite Project

## Status

**Proposed**

## Date

**2025-11-06**

---

## Context

As the frontend application grows across multiple domains (Users, Billing, App Modules, Role Permissions, etc.), we need a **standardized and scalable folder structure**.

The architecture should:

- Support modular and domain-driven organization.
- Maintain clear separation between **UI**, **business logic**, **data services**, and **state management**.
- Integrate seamlessly with **Vite**, **React**, **TailwindCSS v4**, **ShadCN UI**, and **Zustand/React Query** (ADR 0003).
- Simplify maintenance, onboarding, and feature expansion.

A consistent folder and naming convention is critical for **team productivity**, **discoverability**, and **code governance**.

---

## Decision

Adopt a **modular, domain-driven folder structure** that aligns with React best practices and ShadCN conventions.

### 📁 Project Structure

```

src/
├─ app/                    # Application bootstrap and layout
│   ├─ main.tsx            # Entry point (ReactDOM.createRoot)
│   ├─ App.tsx             # Root app component with routing and providers
│   ├─ routes/             # Route definitions (React Router setup)
│   ├─ providers/          # Global context providers (AuthProvider, ThemeProvider)
│   └─ layout/             # Layout components (Sidebar, Navbar, ContentLayout)
│
├─ features/               # Domain-driven feature modules
│   ├─ users/              # Example domain (User management)
│   │   ├─ components/     # UI components specific to this module
│   │   ├─ hooks/          # Custom hooks
│   │   ├─ store/          # Zustand or context-based state store
│   │   ├─ services/       # API client functions for user module
│   │   ├─ pages/          # Page-level components (UserList, UserForm)
│   │   └─ index.ts        # Entry file exporting module exports
│   │
│   ├─ billing/            # Another domain (Billing)
│   │   ├─ components/
│   │   ├─ hooks/
│   │   ├─ store/
│   │   ├─ services/
│   │   ├─ pages/
│   │   └─ index.ts
│   └─ ...
│
├─ components/             # Shared, reusable UI components
│   ├─ ui/                 # ShadCN components (Button, Input, Dialog, etc.)
│   ├─ forms/              # Common form components
│   ├─ layout/             # Common layout patterns (Cards, Grids)
│   └─ icons/              # Lucide icon wrappers
│
├─ hooks/                  # Global reusable hooks (useMobile, useDebounce, etc.)
│
├─ context/                # App-wide context (AuthContext, UIContext)
│
├─ stores/                 # Global Zustand stores (ThemeStore, SidebarStore)
│
├─ services/               # API layer and HTTP clients
│   ├─ apiClient.ts        # Central Axios or Fetch wrapper
│   ├─ admin/              # Admin module API endpoints
│   ├─ user/               # User domain API endpoints
│   └─ ...
│
├─ lib/                    # Utility functions, constants, helpers
│   ├─ validators/         # Yup/Zod schema validations
│   ├─ utils.ts            # Shared utility functions
│   └─ constants.ts        # Enum-like constants, route maps
│
├─ styles/                 # Global CSS/Tailwind configs
│   ├─ globals.css
│   ├─ tailwind.css
│   └─ theme.css
│
├─ types/                  # Global TypeScript type definitions
│   ├─ api.ts
│   ├─ user.ts
│   └─ index.d.ts
│
├─ assets/                 # Static files (images, fonts, SVGs)
│
├─ tests/                  # Unit and integration tests
│
└─ index.html              # Vite entry template

```

---

## Rationale

- **Domain-first modularization** ensures each feature (User, Billing, etc.) encapsulates its own logic, making refactoring easier.
- **Separation of concerns** improves testability and scalability.
- **Consistent folder naming** (`components/`, `hooks/`, `store/`, `services/`) ensures predictable structure across domains.
- **ShadCN UI structure** (`components/ui`) aligns with industry-standard practices for reusable design systems.
- **Shared utilities and types** reduce duplication across modules.

This structure encourages **feature isolation**, enabling independent development, lazy loading, and domain-level ownership.

---

## Alternatives Considered

| Approach                           | Description                                                       | Reason Rejected                                             |
| ---------------------------------- | ----------------------------------------------------------------- | ----------------------------------------------------------- |
| **Flat structure**                 | All files under `/src/components`                                 | Hard to scale and maintain.                                 |
| **Layered architecture (by type)** | Folders like `/components`, `/services`, `/hooks` globally shared | Breaks modular boundaries; difficult dependency management. |
| **Monorepo (Nx/Turbo)**            | Splitting modules into packages                                   | Future possibility; too early for current scope.            |

---

## Consequences

### Positive

- 🧩 Clear modular boundaries by domain.
- 🧠 Easier onboarding for new developers.
- ⚙️ Simplifies unit testing and lazy loading.
- 💡 Enables scaling with minimal refactoring.

### Negative

- 📁 Slightly deeper folder nesting for small projects.
- 🔧 Requires discipline to maintain boundaries (avoid cross-imports).

---

## Governance Rules

- Use **PascalCase** for component and page names (e.g., `UserList.tsx`).
- Use **camelCase** for hooks, functions, and files (e.g., `useUserStore.ts`).
- Avoid importing across features — communicate via service APIs or shared hooks.
- All API calls must go through `/services/` layer.
- Shared UI components go under `/components/ui/` following ShadCN conventions.
- Global state (e.g., theme, auth) stays in `/context/` or `/stores/`, not in features.
- Type definitions should live in `/types/` and be reused across modules.

---

## References

- [React File Structure Best Practices](https://react.dev/learn/project-structure)
- [ShadCN UI Project Organization](https://ui.shadcn.com/docs/installation)
- [Zustand Architecture Guide](https://docs.pmnd.rs/zustand/guides/typescript)
- [Vite Official Docs](https://vitejs.dev/guide/)
- [Domain-Driven Folder Structures in React](https://feature-sliced.design/docs/get-started/overview)

---
