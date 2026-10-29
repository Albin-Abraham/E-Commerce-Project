# MVC, MVP, and MVVM Mapping in ZenOS V2

This document critiques and maps the modern **ZenOS V2 Architecture** to classic software engineering design patterns: **Model-View-Controller (MVC)**, **Model-View-Presenter (MVP)**, and **Model-View-ViewModel (MVVM)**.

---

## 🗺️ Conceptual Mapping Matrix

| Design Pattern                    | Component      | ZenOS V2 Architectural Equivalent                                       | Alignment Score    |
| :-------------------------------- | :------------- | :---------------------------------------------------------------------- | :----------------- |
| **MVC** _(Model-View-Controller)_ | **Model**      | Repositories & Zod Entities (`src/features/*/services/*.repository.ts`) | 🟡 Moderate (5/10) |
|                                   | **View**       | Dumb Presentational UI Components (`src/shared/ui/`)                    |                    |
|                                   | **Controller** | React Router (Loaders, Guards, and Route Definitions)                   |                    |
| **MVP** _(Model-View-Presenter)_  | **Model**      | Gateway Repositories & DTO translation layers                           | 🟢 Perfect (10/10) |
|                                   | **View**       | Presentational Layout Components (completely dumb)                      |                    |
|                                   | **Presenter**  | Orchestration Layer / Pages (`src/shell/pages/`)                        |                    |
| **MVVM** _(Model-View-ViewModel)_ | **Model**      | Server REST State & Raw Database Structures                             | 🟢 Perfect (10/10) |
|                                   | **View**       | React Declarative JSX Templates (Rendering Engine)                      |                    |
|                                   | **ViewModel**  | Custom Facades, Zustand Stores, & **TanStack Query**                    |                    |

---

## 🏛️ 1. Model-View-Presenter (MVP): _The Orchestration Standard_

The **Orchestration Layer** of ZenOS is a textbook implementation of the **Passive View MVP** pattern.

```text
┌─────────────────┐             ┌─────────────────────┐             ┌─────────────────┐
│      MODEL      │  ────────►  │      PRESENTER      │  ────────►  │      VIEW       │
│ (Repositories / │  ◄────────  │   (Page Component)  │  ◄────────  │ (Pure UI Component│
│  DTO Translators│             │  Coordinates State  │             │   Render/DOM)   │
└─────────────────┘             └─────────────────────┘             └─────────────────┘
```

### How ZenOS follows MVP:

- **The View (Passive & Dumb)**: Under ADR-010, the rendering layer (`src/shared/ui/`) must remain pure visual elements. They are passive; they do not fetch data, do not know about network layers, and do not track core business states. They simply render inputs and fire clean callbacks when clicked.
- **The Presenter (The Coordinator)**: Page-level components (such as `PayrollManagementPage` or `ProductDetailComponent`) serve as Presenters. They:
  1. Retrieve the Model (invoke Repository fetch queries).
  2. Map the data structure.
  3. Orchestrate layouts, slots, and side-panel states.
  4. Inject clean inputs into the Passive Views.
- **Why it shines**: This guarantees complete separation of layout semantics from data retrieval, allowing you to rewrite your entire dashboard layout without breaking data contracts.

---

## 🔄 2. Model-View-ViewModel (MVVM): _The Facade Standard_

React's reactive render loop makes it naturally fit the **MVVM** pattern, and the inclusion of **Facades** and **TanStack Query** elevates this connection.

```text
┌───────────────────┐           ┌─────────────────────────┐           ┌───────────────────┐
│       MODEL       │           │        VIEWMODEL        │           │       VIEW        │
│ (Zod Schemas /    │ ◄───────► │ (TanStack Query Caches, │ ◄───────► │  (Declarative JSX │
│  Server State)    │           │  Facades & Stores)      │           │   Templates)      │
└───────────────────┘           └─────────────────────────┘           └───────────────────┘
```

### How ZenOS follows MVVM:

- **The ViewModel (TanStack Query, Facades, & Stores)**:
  - **TanStack Query** acts as a highly sophisticated caching ViewModel. It manages derived state (`isPending`, `isError`, `data`) and automatically synchronizes with the Server State (the true Model).
  - **Custom Facades** like `useAuthFacade` or `useModal` wrap raw state values, loading trackers, and actions into a unified bindable interface.
- **The View (Declarative JSX)**: The rendering template binds directly and declaratively to the properties exposed by the hook:

  ```tsx
  // The View binds declaratively to ViewModel properties
  const { data, isPending } = useProductsQuery();

  <Button onClick={refresh} disabled={isPending}>
    {isPending ? "Loading..." : "Refresh Catalog"}
  </Button>;
  ```

  React's virtual DOM automatically synchronizes ViewModel properties with physical DOM updates.

- **Why it shines**: By keeping the ViewModel completely isolated, you can unit-test data retrieval, derivations, and state transitions independently of the browser DOM.

---

## 🚧 3. Model-View-Controller (MVC): _The Router Controller_

While some developers use the terms MVC and MVVM interchangeably on the web, ZenOS deviates from classic **MVC** except at the uppermost routing layer:

### How ZenOS interprets MVC:

- **Controller as Router Layer**: In modern React, the closest thing to a traditional "Controller" is the **React Router**. Loaders, Guards, and Route definitions handle the initial incoming request, coordinate authentication, prewarm necessary data, and determine which Presenter (Page) to mount.
- **Unidirectional vs Bidirectional Sync**: Classic MVC relies on a Controller pushing a populated model container to a static template. Modern web frameworks rely on local caches and reactive views.
- **No Controller Renderers**: Controllers (Routes) in ZenOS do not directly manipulate the visual nodes. They merely resolve the path and delegate rendering to the Presenter layer.

---

## 🏆 Verdict

The ZenOS project is a hybrid engineering masterpiece. It successfully fuses **Model-View-Presenter (MVP)** at the page layout orchestration level with **Model-View-ViewModel (MVVM)** at the component facade and caching level.

By leveraging the strengths of both patterns—and utilizing the Router as a strict entry Controller—it establishes a frontend platform that remains clean, type-safe, and highly maintainable under scale.
