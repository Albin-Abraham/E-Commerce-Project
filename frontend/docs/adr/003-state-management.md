# ADR 0003: Choose State Management Strategy for React Frontend

## Status

**Proposed**

## Date

**2025-11-06**

---

## Context

As the application grows in complexity, we need a **consistent, scalable, and predictable state management solution** for our React frontend.

The chosen approach should:

- Handle both **local component state** and **global shared state**.
- Integrate smoothly with **React 18+**, **TypeScript**, and **Vite**.
- Be lightweight, modular, and compatible with **server-driven UI** patterns.
- Support **async data fetching**, **persisted state**, and **middleware extensions** when required.

React’s built-in state management (via `useState` and `useReducer`) works well for small components, but does not scale well across complex domains like:

- User authentication and roles
- Permission-based UI rendering
- Multi-module data coordination (Billing, Users, App Modules, etc.)

We need a structured solution that balances simplicity, performance, and long-term maintainability.

---

## Decision

We will adopt a **hybrid state management architecture**:

- **Context API + useReducer** — for application-level shared state (auth, UI theme, sidebar visibility, etc.).
- **Zustand** — for modular, feature-level state (Doctor, Billing, User Management, etc.) requiring fine-grained updates.
- **React Query (TanStack Query)** — for server-side data caching and synchronization with APIs.

### State Layers

| Layer             | Library                    | Responsibility                                                  |
| ----------------- | -------------------------- | --------------------------------------------------------------- |
| **Global State**  | React Context + useReducer | Authentication, UI preferences, layout state.                   |
| **Feature State** | Zustand                    | Local domain logic (e.g., billing, appointments).               |
| **Server State**  | React Query                | API data caching, pagination, invalidation, optimistic updates. |

---

## Rationale

- **React Context + useReducer** is native, predictable, and fits small global state needs without adding dependencies.
- **Zustand** provides a minimal API and efficient state updates without the boilerplate of Redux.
- **React Query** manages async API state (loading, caching, error) effectively, reducing manual data management.
- The combination supports **scalability**, **testability**, and **separation of concerns** between server and client state.
- Avoids overengineering while ensuring flexibility for future migrations (e.g., Redux Toolkit if required).

---

## Alternatives Considered

| Option               | Description                                    | Pros                                         | Cons                                       |
| -------------------- | ---------------------------------------------- | -------------------------------------------- | ------------------------------------------ |
| **Redux Toolkit**    | Industry-standard predictable state container. | Centralized, structured, good dev tools.     | Verbose setup, overkill for smaller apps.  |
| **MobX**             | Observable-based reactive state management.    | Simple for small apps, fast.                 | Harder to debug and test in large apps.    |
| **Jotai / Recoil**   | Atomic state management (Recoil by Meta).      | Simple mental model, good for scoped states. | Less community adoption, weaker dev tools. |
| **Context API only** | Native, simple to reason about.                | No dependencies, great for small apps.       | Inefficient re-renders at scale.           |

---

## Consequences

### Positive

- 🧠 Clean separation between local, global, and async state.
- ⚡ Improved performance with minimal re-renders using Zustand.
- 📦 Reduced boilerplate compared to Redux.
- 🧩 Easier to test and maintain isolated feature stores.
- 🌐 First-class integration with React Query for API-driven UIs.

### Negative

- 🧾 Slight learning curve for mixing three state layers (Context, Zustand, Query).
- 🔧 Requires consistent conventions for naming, store structure, and context usage.

---

## Implementation Guidelines

1. **Context API**
   - Store global UI states under `/context/` (e.g., `AuthContext`, `UIContext`).
   - Use `useReducer` for predictable state transitions.

2. **Zustand Stores**
   - Define each domain’s store under `/stores/` (e.g., `useBillStore`, `useUserStore`).
   - Use middleware like `persist` for caching and `devtools` for debugging.

3. **React Query**
   - Configure a single `QueryClient` provider in `App.tsx`.
   - Use custom hooks (`useFetchUsers`, `useFetchBills`) for API integration.

4. **Naming Convention**
   - Global: `AppContext`
   - Domain: `use<X>Store`
   - Server: `use<X>Query`

---

## References

- [React Context Docs](https://react.dev/reference/react/useContext)
- [Zustand Documentation](https://docs.pmnd.rs/zustand/getting-started/introduction)
- [TanStack Query (React Query)](https://tanstack.com/query/latest)
- [Redux Toolkit](https://redux-toolkit.js.org/)
- [Jotai](https://jotai.org/)
- [Recoil](https://recoiljs.org/)
