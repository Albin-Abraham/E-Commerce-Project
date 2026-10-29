# 📖 ZenOS Frontend Contributions & Architecture Guide

Welcome! This guide outlines the core design systems and development standards of the ZenOS frontend platform. All developers must strictly adhere to these patterns to ensure optimal performance, robust type safety, defensive execution, and clean code-splitting.

---

## 🏛️ The Core Philosophy: Container / Presenter Decoupling

ZenOS operates on a strict **Framework-Level Container / Presenter Pattern**.

- **The Container**: Managed implicitly by the **Routing Compiler** (`route.utils.tsx` + wrappers). It orchestrates security, data loaders (TanStack Query), lifecycles, and parameters.
- **The Presenter**: Managed by **Page Components**. They are pure visual canvases with no static dependencies on parameters, routing redirects, or state synchronization.

```
┌────────────────────────────────────────────────────────┐
│           ROUTING COMPILER (Implicit Container)        │
│  - Executes Guards (Redirections occur in Loader)      │
│  - Prefetches Data (Warm Query Cache)                  │
│  - Fires Lifecycles (onEnter, onUpdate, onLeave)       │
└───────────────────────────┬────────────────────────────┘
                            │ (Injects warm cache & types)
                            ▼
┌────────────────────────────────────────────────────────┐
│           PAGE COMPONENT (Pure Presenter)              │
│  - Stateless UI Rendering                              │
│  - Receives warm cache data (0ms Spinner transition)    │
│  - No static cross-module imports                      │
└────────────────────────────────────────────────────────┘
```

---

## 🗺️ 1. How to Write Route Definitions

Routes are defined declaratively in route modules. They must **never** statically import the target component files. Instead, they use code-split dynamic lazy loading.

### Standard Route Definition (Loader Cache Resolution)

To maintain query cache coherence and prevent dual-source-of-truth mismatches, loaders pre-warm the TanStack query cache and **return the query's resolved cache data directly**.

```typescript
import { defineRoute } from "@/core/router";

export const patientRoutes = defineRoute({
  path: "/patients/:id",
  // ── 1. Code-split and lazy-load the page bundle ──
  lazy: async () => {
    const mod = await import("./pages/PatientDetailPage");
    return {
      Component: mod.PatientDetailPage,
      wrapper: mod.PatientPrefillWrapper, // Isolated module wrapper
    };
  },

  // ── 2. Asynchronous Loader Guards (Flicker-Free Security) ──
  guards: [authGuard, permissionGuard("view_patients")],

  // ── 3. Parallel Loader Data Pre-Warming ──
  loader: async (ctx) => {
    const queryKey = ["patient-detail", ctx.params.id];
    const queryFn = () =>
      ctx.services.public.get(`/patients/${ctx.params.id}`).then((r) => r.data);

    // Prefetch into global queryClient cache
    await ctx.services.queryClient.prefetchQuery({ queryKey, queryFn });

    // Return resolved cache data directly to act as single-source contract
    return ctx.services.queryClient.getQueryData(queryKey);
  },
});
```

---

## 🔌 2. How to Write Domain-Isolated Component Wrappers

If a page has specific parameter-based side-effects (such as appending `?prefillPatientId=uuid` or syncing query tokens), **do not pollute the global router manifest or page file with this logic**.

Create a dedicated **Wrapper Component** inside your module directory.

### Defensive Race-Condition Handled Wrapper (`PatientPrefillWrapper.tsx`)

Always configure an `AbortController` in effects to abort active API hydration calls during rapid user navigation or development `StrictMode` double-renderings.

```tsx
import React, { useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";

import { httpClient } from "@/services/http.instance";

import { localStore } from "../stores/localStore";

export const PatientPrefillWrapper: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [searchParams] = useSearchParams();
  const prevIdRef = useRef<string | null>(null);

  const prefillId = searchParams.get("prefillPatientId");

  useEffect(() => {
    if (!prefillId) return;
    if (prefillId === prevIdRef.current) return;

    console.log(`🔌 Isolated hydration triggered for: ${prefillId}`);
    const controller = new AbortController();

    httpClient
      .get(`/patients/prefill/${prefillId}`, { signal: controller.signal })
      .then((res) => {
        localStore.hydrateFields(res.data);
      })
      .catch((err) => {
        // Safe rejection discard
        if (err.name !== "CanceledError" && err.name !== "AbortError") {
          console.error("Hydration fetch failed:", err);
        }
      });

    prevIdRef.current = prefillId;

    return () => {
      // Discard pending request on rapid navigation or unmount!
      controller.abort();
    };
  }, [prefillId]);

  return <>{children}</>;
};
```

---

## 🎨 3. How to Write Presenter Page Components

Presenter components are highly visual, fully stateless, and type-safe. They leverage **Explicit Composable Hooks** instead of legacy HOC props.

### 🛡️ The Fail-Safe Query Principle (Deep-Link Resilience)

To prevent infinite loading states if a user deep-links, refreshes, or bookmarks the page directly, **all presenter `useQuery` calls MUST contain a queryFn fallback**. The router loader handles _pre-warming_, but the component handles _resilience_.

```tsx
import React from "react";
import { useParams } from "react-router-dom";

import { useQuery } from "@tanstack/react-query";

import { httpClient } from "@/services/http.instance";

import { PatientCard } from "../components/PatientCard";

export const PatientDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  // Consumes from query client with deep-link fallback resilience
  const {
    data: patient,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["patient-detail", id],
    queryFn: () => httpClient.get(`/patients/${id}`).then((r) => r.data),
  });

  if (isError) {
    throw new Error(`Failed to load patient dossier for record ID: ${id}`);
  }

  if (isLoading || !patient) {
    return <div className="animate-pulse h-96 bg-card rounded-lg" />;
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <h1 className="text-2xl font-bold tracking-tight">Patient Dossier</h1>
      <PatientCard patient={patient} />
    </div>
  );
};
```

---

## 🔄 4. Mastering Routing Lifecycles

For global context synchronization (like updating browser documents, establishing WebSockets, or tracking analytic records), utilize compiler-level lifecycle hooks:

| Routing Hook              | React Analogue         | Purpose                                                                          |
| :------------------------ | :--------------------- | :------------------------------------------------------------------------------- |
| **`onEnter(ctx)`**        | `componentDidMount`    | Fires **exactly once** on initial mount. Used to set up listeners or set themes. |
| **`onUpdate(ctx, prev)`** | `componentDidUpdate`   | Fires when URL params/search query changes. Used to sync query caches.           |
| **`onLeave(ctx)`**        | `componentWillUnmount` | Fires **exactly once** on exit. Used to clear timeouts, FCM, or cancel queries.  |

### Lifecycle Implementation Rules

- Return a cleanup function from `onEnter` to automatically register an active cleanup cache.
- Always inspect `prev.params` or `prev.search` inside `onUpdate` to block unnecessary network refetches on identical keys.

---

## 🎨 5. Component-Driven View Orchestration (Props & Presenters)

When building highly dynamic visual modules (such as master-detail dashboards, tabs, or modal overlays), adhere to the **Component-Driven View Pattern**.

### The Principle: Explicit View Selection Props

Rather than writing massive conditional logic block inside a single page, split visual states into **highly isolated presentational sub-views**. Each sub-view receives explicit controllers via props:

- `view`: Drives which visual state is selected (e.g. `"list" | "detail" | "create"`).
- `selectedId`: The active target entity reference.
- `onSelect` / `onViewChange`: Unified callback hooks to notify parent containers.

---

### Pattern A: Prop/URL-Driven View Selection (Deep-Linking Ready)

Perfect for dashboard states that should survive page refreshes and be completely deep-linkable.

#### Presenter Component (`PatientListView.tsx`)

```tsx
import React from "react";

import type { Patient } from "../types";

interface PatientListViewProps {
  patients: Patient[];
  selectedId?: string;
  onSelect: (id: string) => void;
}

export const PatientListView: React.FC<PatientListViewProps> = ({
  patients,
  selectedId,
  onSelect,
}) => {
  return (
    <ul className="divide-y divide-border rounded-lg border bg-card">
      {patients.map((p) => (
        <li
          key={p.id}
          className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors ${
            selectedId === p.id ? "bg-muted" : ""
          }`}
          onClick={() => onSelect(p.id)}
        >
          <div className="font-semibold text-sm">{p.name}</div>
          <div className="text-xs text-muted-foreground">{p.email}</div>
        </li>
      ))}
    </ul>
  );
};
```

#### Parent Switcher Coordinator (`PatientOnboardingView.tsx`)

```tsx
import React from "react";
import { useSearchParams } from "react-router-dom";

import { useQuery } from "@tanstack/react-query";

import { PatientDetailView } from "./PatientDetailView";
import { PatientListView } from "./PatientListView";

export const PatientOnboardingView: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // 1. Capture dynamic props directly from URL search parameters (deep-linkable!)
  const activeView = searchParams.get("view") || "list";
  const selectedId = searchParams.get("selectedId") || undefined;

  // 2. Load warm cache data
  const { data: patients = [] } = useQuery<Patient[]>({
    queryKey: ["patients"],
  });

  const handleSelect = (id: string) => {
    setSearchParams({ view: "detail", selectedId: id });
  };

  const handleBackToList = () => {
    setSearchParams({ view: "list" });
  };

  // 3. Coordinate Presenters cleanly via dynamic prop switching
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-1">
        <PatientListView
          patients={patients}
          selectedId={selectedId}
          onSelect={handleSelect}
        />
      </div>

      <div className="md:col-span-2">
        {activeView === "detail" && selectedId ? (
          <PatientDetailView id={selectedId} onBack={handleBackToList} />
        ) : (
          <div className="flex h-64 items-center justify-center border border-dashed rounded-lg">
            <p className="text-muted-foreground text-sm">
              Select a patient from the list to view details.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
```

---

### Pattern B: Context-Driven View Selection (Surviving Navigation & State Recovery)

For complex, nested dashboards where sub-views need to transition without drilling props, we implement a **URL-Synced Module Context**. This guarantees both **clean nesting** and **survival of navigation parameters**.

#### 1. Define Synced View Hook and Context (`ModuleViewContext.tsx`)

```tsx
import React, { createContext, useContext } from "react";
import { useSearchParams } from "react-router-dom";

type ViewState = "list" | "detail" | "edit";

interface ModuleViewContextType {
  view: ViewState;
  selectedId: string | null;
  setView: (view: ViewState) => void;
  selectEntity: (id: string | null) => void;
}

const ModuleViewContext = createContext<ModuleViewContextType | undefined>(
  undefined
);

export const ModuleViewProvider: React.FC<{
  children: React.ReactNode;
  namespace: string;
}> = ({ children, namespace }) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const view = (searchParams.get(`${namespace}_view`) as ViewState) || "list";
  const selectedId = searchParams.get(`${namespace}_id`);

  const setView = (newView: ViewState) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set(`${namespace}_view`, newView);
    setSearchParams(nextParams);
  };

  const selectEntity = (id: string | null) => {
    const nextParams = new URLSearchParams(searchParams);
    if (id) {
      nextParams.set(`${namespace}_view`, "detail");
      nextParams.set(`${namespace}_id`, id);
    } else {
      nextParams.set(`${namespace}_view`, "list");
      nextParams.delete(`${namespace}_id`);
    }
    setSearchParams(nextParams);
  };

  return (
    <ModuleViewContext.Provider
      value={{ view, selectedId, setView, selectEntity }}
    >
      {children}
    </ModuleViewContext.Provider>
  );
};

export const useModuleView = () => {
  const context = useContext(ModuleViewContext);
  if (!context)
    throw new Error("useModuleView must be used within a ModuleViewProvider");
  return context;
};
```

#### 2. Local Context Coordinator Page (`PatientDashboard.tsx`)

```tsx
import React from "react";

import { ModuleViewProvider, useModuleView } from "./ModuleViewContext";
import { PatientDetailView } from "./PatientDetailView";
import { PatientListView } from "./PatientListView";

const DashboardContent: React.FC = () => {
  const { view, selectedId, selectEntity } = useModuleView();

  return (
    <div className="grid grid-cols-3 gap-6 p-6">
      <div className="col-span-1">
        <PatientListView onSelect={(id) => selectEntity(id)} />
      </div>
      <div className="col-span-2">
        {view === "detail" && selectedId ? (
          <PatientDetailView id={selectedId} />
        ) : (
          <p className="text-sm text-muted-foreground">
            Select a patient card to load details.
          </p>
        )}
      </div>
    </div>
  );
};

export const PatientDashboard: React.FC = () => {
  return (
    // Unique namespace guarantees state recovery and survives page navigation natively!
    <ModuleViewProvider namespace="patients_panel">
      <DashboardContent />
    </ModuleViewProvider>
  );
};
```

---

## 🎛️ 6. The ViewStateManager Pattern (Single-Page Resource Management)

The **ViewStateManager** is a centralized, state-machine-inspired controller designed for single-page resource management. It manages sub-view transitions (`LIST`, `CREATE`, `UPDATE`, `DETAIL`), dynamic permissions, and parent-child callbacks inside localized boundaries without altering the browser route.

### Decoupled ViewStateManager Blueprint

#### A. Define View Context (`MedicineViewContext.tsx`)

```tsx
import React, { createContext, useContext, useReducer } from "react";

export type ViewType = "LIST" | "CREATE" | "UPDATE" | "DETAIL";

interface State {
  view: ViewType;
  selectedId: string | null;
  permissions: { can_add: boolean; can_edit: boolean; can_view: boolean };
}

type Action =
  | { type: "SWITCH_VIEW"; payload: { view: ViewType; id?: string | null } }
  | { type: "SET_PERMISSIONS"; payload: State["permissions"] };

const medicineReducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "SWITCH_VIEW":
      // Declarative state-level permission guard
      if (action.payload.view === "CREATE" && !state.permissions.can_add)
        return state;
      if (action.payload.view === "UPDATE" && !state.permissions.can_edit)
        return state;
      return {
        ...state,
        view: action.payload.view,
        selectedId: action.payload.id || null,
      };
    case "SET_PERMISSIONS":
      return { ...state, permissions: action.payload };
    default:
      return state;
  }
};

const MedicineViewContext = createContext<
  | {
      state: State;
      dispatch: React.Dispatch<Action>;
    }
  | undefined
>(undefined);

export const MedicineViewProvider: React.FC<{
  children: React.ReactNode;
  initialPermissions: State["permissions"];
}> = ({ children, initialPermissions }) => {
  const [state, dispatch] = useReducer(medicineReducer, {
    view: "LIST",
    selectedId: null,
    permissions: initialPermissions,
  });

  return (
    <MedicineViewContext.Provider value={{ state, dispatch }}>
      {children}
    </MedicineViewContext.Provider>
  );
};

export const useMedicineView = () => {
  const context = useContext(MedicineViewContext);
  if (!context)
    throw new Error(
      "useMedicineView must be used within a MedicineViewProvider"
    );
  return context;
};
```

---

## 🛡️ 7. The Multi-Layer Permission Security Contract

To prevent confusion and ensure consistent authorization checks across the platform, developers must follow the **ZenOS Permission Matrix**:

```
[User Navigates] ──> [Layer 1: Router Guard (Coarse)] ──> Block Page Mount entirely
                          │
                          ▼
                 [Layer 2: Reducer Guard (Fine)]   ──> Block unauthorized local actions
                          │
                          ▼
                 [Layer 3: BFF/Backend (Absolute)] ──> Cryptographically sign header auth
```

1.  **Layer 1 (Coarse-Grained Router Guards)**: Prevents unauthorized users from mounting the entire route module chunk (`guards: [permissionGuard("view_medicines")]`).
2.  **Layer 2 (Fine-Grained Reducer Guards)**: Protects discrete action transitions _inside_ the active page (e.g. blocking `SWITCH_VIEW` to `UPDATE` if `can_edit` is false).
3.  **Layer 3 (Backend Cryptographic Guard)**: The final server check. Enforces strict HTTP status returns (e.g., `401` or `403`) on requests containing forged payloads.

---

## 🛑 8. Defenses: Error Boundaries & Recovery UI

Every domain module in ZenOS must be shielded against unexpected run-time rendering exceptions and API lookup failures using defensive **Error Boundaries**.

### Route-Level Error Boundary Component (`MedicineErrorBoundary.tsx`)

```tsx
import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class MedicineErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(
      "🚨 Unhandled Medicine Exception captured:",
      error,
      errorInfo
    );
  }

  private handleRecover = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-8 border border-destructive/20 bg-destructive/5 rounded-lg text-center gap-4">
          <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
            🛑
          </div>
          <h3 className="text-lg font-bold text-destructive">
            Record Operations Error
          </h3>
          <p className="text-sm text-muted-foreground max-w-md">
            {this.state.error?.message ||
              "An unexpected error occurred while loading this medicine dashboard."}
          </p>
          <button
            onClick={this.handleRecover}
            className="text-xs bg-destructive text-destructive-foreground px-4 py-2 rounded-lg font-semibold hover:bg-destructive/90 transition-colors"
          >
            Attempt Dashboard Recovery
          </button>
        </div>
      );
    }

    return this.state.children;
  }
}
```

---

## 📚 9. Architectural Folder Reference & Prescriptions

To align feature modules correctly with **Clean Domain Architecture** and standard project structuring, conform strictly to the following directory layout:

```
src/modules/patient/
  ├── components/                 # Presentational primitive widgets (Cards, Tables)
  │     ├── PatientCard.tsx
  │     └── PatientPrefillWrapper.tsx
  ├── pages/                      # Decoupled presenters (Dumb view coordinators)
  │     └── PatientDetailPage.tsx
  ├── views/                      # Sub-views driven by local ViewStateManager
  │     ├── PatientListView.tsx
  │     └── PatientDetailView.tsx
  ├── context/                    # Isolated Module state/URL-Sync providers
  │     └── ModuleViewContext.tsx
  ├── services/                   # Pure API fetches and business mutations
  │     └── patient.api.ts
  ├── stores/                     # Local module-specific UI state stores (Zustand/reducers)
  │     └── localStore.ts
  ├── types/                      # Module type interface definitions
  │     └── index.ts
  └── routes.ts                   # Route loader definitions and dynamic bindings
```
