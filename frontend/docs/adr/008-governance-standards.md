# ADR 008: ZenOS Architecture Governance & Scaffolding Standards

- **Status**: Accepted
- **Owner**: Principal Architect & Antigravity
- **Decided**: 2026-05-22

## Context

As the ZenOS V2 architecture reaches **platform-level complexity**, protecting it against architectural decay is paramount. Enterprise React frameworks typically drift due to a lack of clear boundaries, leading to:

1. Primitives (components) importing heavy business logic and repositories.
2. Services/Repositories getting coupled with React components, router manifests, or visual contexts.
3. Views and Presenters bypassing the designated data layers and importing global HTTP clients directly.
4. Scaffolding drift because developers construct modules manually from memory, leading to inconsistent structures.

To solve this permanently, ZenOS architecture must transition from **merely documented** into **mechanically enforced**.

---

## Decisions

We have implemented two powerful automated governance mechanisms to maintain architectural purity at scale:

### 1. Automated Dependency Direction Rules (`import/no-restricted-paths`)

We have integrated strict static dependency limits into the flat ESLint configuration (`eslint.config.js` and `eslint_rules.js`). This permanently guards our Directed Acyclic Graph (DAG) layer boundaries at compile-time:

```
┌────────────────────────────────────────┐
│               COMPONENTS               │
│     (Must remain pure presentational)  │
└───────────────────┬────────────────────┘
                    │
                    ▼ [BLOCKED BY LINTER]
┌────────────────────────────────────────┐
│         REPOSITORIES / SERVICES        │
│     (Pure data boundaries - No React)   │
└────────────────────────────────────────┘
```

#### Enforced Boundaries:

- **Rule A (Components Isolation)**: Files in `**/components/**` are strictly forbidden from importing repositories, services, or stores.
- **Rule B (Pure Data Boundary)**: Repositories and data-fetching services in `**/services/**` are strictly forbidden from importing React, UI components, layouts, or router managers.
- **Rule C (Presenter Boundary)**: Views and presentational pages are strictly forbidden from directly importing core `http` clients, forcing them to use the defined query/mutation boundaries.

---

### 2. Standardized Module Scaffolding Engine (Plop Generator CLI)

To reduce onboarding friction and enforce consistency from line one, we have modernized the **Module Generator CLI**.

We introduced the `zenos-module` generator inside the local scaffolding system:

```bash
# How to run the scaffolding command
npx plop zenos-module
```

#### Generated Assets Structure:

```
src/features/{{module_name}}/
  ├── services/
  │     ├── {{module_name}}.repository.ts   # Conforms to Repository & DTO mapping
  │     └── {{module_name}}.keys.ts         # Centralized Query Keys & Queries V2
  ├── pages/
  │     └── {{PascalCase}}DetailPage.tsx    # Dumb presenter with deep-link resilience
  ├── routes.ts                             # Lazy code-split routing with pre-warming
  └── index.ts                              # Standard barrel export manifest
```

---

## SOLID & GoF Pattern Alignment Summary

| Axiom / Design Pattern        | Implementation                      | Benefit                                                                                                |
| :---------------------------- | :---------------------------------- | :----------------------------------------------------------------------------------------------------- |
| **Dependency Inversion (D)**  | ESLint `import/no-restricted-paths` | UI components are structurally blocked from importing repositories directly, keeping interfaces clean. |
| **Builder Pattern (GoF)**     | `plopfile.cjs` Generator            | Automates construction of standard feature modules to eliminate pattern variation.                     |
| **Single Responsibility (S)** | ESLint Service Isolation            | Repositories remain clean data transformations, decoupled from browser rendering engines.              |

---

## Consequences

- **Local Development Freedom**: Developers retain full creative layout flexibility inside Presenters and dumb components, while the linter rigorously checks macro execution boundaries.
- **CI/CD Integration**: These lint rules run automatically in CI. Any pull request introducing circular references or layer leaks will be rejected before review.
