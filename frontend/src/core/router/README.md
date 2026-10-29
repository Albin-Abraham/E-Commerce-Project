# Custom Routing Framework

This repository contains a routing system built on top of **React Router v6**, using a configuration-based approach.
It supports modular route grouping, lazy loading, layouts, wrappers, permission flags, and basic navigation/breadcrumb extraction.

---

## Structure

```
src/
└─ routers/
   ├─ router.types.ts                # Type definitions (Route, Module, Breadcrumb, Nav)
   ├─ router.route.wrapper.tsx       # Component wrapper + lazy handling
   ├─ utils/
   │   ├─ routeRoute.tsx             # renderRouteTree() → <Route/> generator
   │   └─ routeToNav.ts              # Convert AppRoute → NavItem
   └─ AppRouter.tsx                  # Router entry
```

---

## Basic Route Definition

```ts
const DashboardPage = React.lazy(() => import("@/pages/Dashboard"));

export const dashboardRoutes: AppRoute = {
  path: "/dashboard",
  label: "Dashboard",
  layout: DashboardLayout,
  requiredPermissions: ["view_dashboard"],
  component: DashboardPage,

  children: [
    {
      index: true,
      component: OverviewPage,
    },
    {
      path: "analytics",
      label: "Analytics",
      component: AnalyticsPage,
    },
  ],
};
```

---

## Route Module

```ts
export const DashboardModule: RouteModule = {
  key: "dashboard",
  label: "Dashboard",
  routes: [dashboardRoutes],
};
```

---

## Usage

```tsx
export function AppRouter({ modules }: { modules: RouteModule[] }) {
  const list = modules.flatMap((m) => m.routes);

  return (
    <Suspense>
      <Routes>
        {list.map((route) => renderRouteTree(route))}
        <Route path="/404" element={<NotFound />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </Suspense>
  );
}
```

---

## Features (Implemented)

- Lazy components using `React.lazy` + `Suspense`
- Nested routing via recursion
- Route-level layouts
- Optional wrapper HOC per route
- Route modules for grouping
- Generates navigation structure from route config
- Basic metadata fields for future extensions

---

## Features (Available but require custom logic)

| Field                             | Purpose                                                |
| --------------------------------- | ------------------------------------------------------ |
| `requiredPermissions`             | No enforcement included. Use wrapper or guard.         |
| `loader(ctx)`                     | Provided for integration with QueryClient or prefetch. |
| `preload()`                       | Optional. Not automatically executed.                  |
| `pendingElement` / `errorElement` | Not wired in current render function.                  |
| Breadcrumb support                | Data exists. Builder not included.                     |

---

## Internal Processing Order

```
AppRoute
 → wrapLazy(component)
 → withWrapper()
 → Layout injection
 → <Route element={…}>
 → children rendered recursively
```

---

## Notes / TODO

- Index route rendering should be implemented (`route.index === true`)
- Permission guard middleware required to enforce access
- Breadcrumb builder helper can be added using `path`/`label`
- `loader` can be integrated into React Router loader API
- Optional hover prefetch can be implemented using `preload()`

---

## Goal of the Code

Provide a simple routing abstraction where:

- All routes are defined in a single config format
- Rendering, navigation menus, and metadata are derived from it
- No file-based routing assumptions or build-time tooling required

This is intended for teams that prefer explicit configuration over filesystem routing.
