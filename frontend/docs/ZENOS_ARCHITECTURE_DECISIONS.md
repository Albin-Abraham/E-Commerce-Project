# ZenOS Architectural Decision Record: Micro-Frontends & React 19

**Date:** June 20, 2026  
**Status:** Approved  
**Context:** Scaling the ZenOS platform to support E-Commerce, HRMS, Email Services, and Video Streaming within a single unified ecosystem.

---

## 1. The Monolithic Challenge

Combining high-SEO B2C domains (E-Commerce) with heavy, interactive B2B internal domains (HRMS, Email) into a single Vite Single Page Application (SPA) creates an unmanageable JavaScript bundle size. This inherently degrades the initial paint times required for E-Commerce and search engine indexing.

## 2. The Dual-Architecture Strategy

To scale ZenOS, the platform must adopt a **Federated Dual-Architecture**:

- **The E-Commerce Layer:** Must be carved out into a Server-Side Rendering (SSR) framework (e.g., Next.js or React Router v7 SSR) to ensure pristine SEO and sub-second HTML delivery.
- **The B2B / Internal Layer (HRMS, Email, Video):** Retains the Vite + React 19 stack but transitions to a **Micro-Frontend Architecture** using Module Federation (`@originjs/vite-plugin-federation`).

## 3. The Micro-Frontend Host Shell

The `src/shell` module serves purely as an "Operating System" infrastructure host. It contains **zero business logic**. It is responsible for:

1.  **Authentication & Security**
2.  **Global Routing & Module Loading**
3.  **Theming (ZenOS Design Tokens)**

HRMS, Email, and Video players will be compiled as completely independent Vite applications ("Remotes") and loaded dynamically at runtime over the network.

## 4. Concurrent Queueing (React 19 vs Custom QueueManager)

Instead of building a complex custom JavaScript QueueManager to throttle the downloading of these massive Micro-Frontend bundles, ZenOS leverages **React 19 Concurrent Features**:

- **Boot Phase (`React.use`):** The application relies on a Server-Driven Config (`/platform-manifest.json`). The fetch request initiates outside the React tree for parallel network/parsing execution. The `RouterProvider` uses React 19's `use()` hook to elegantly suspend the tree and display a Splash Screen until the network resolves.
- **Navigation Phase (`useTransition`):** When users navigate between Micro-Frontends (e.g., clicking "HRMS"), navigation state updates are wrapped in `startTransition`. This forces the browser to download the HRMS JavaScript bundle in a background queue, preserving the current UI until the heavy payload is fully ready.

## 5. Storage Governance & Persistence

To maintain security, tenant isolation, and prevent performance bottlenecks, all browser storage APIs must be strictly governed via a `StorageService` adapter. Direct use of `window.localStorage` in components is forbidden.

| Storage Object       | ZenOS Architectural Purpose                                                | Expiration Strategy              |
| :------------------- | :------------------------------------------------------------------------- | :------------------------------- |
| **Zustand (Memory)** | The Source of Truth for the UI (progress bars, routing).                   | Clears on page refresh.          |
| **SessionStorage**   | Ephemeral Recovery State (multi-step forms, queue snapshots).              | Clears on tab close.             |
| **LocalStorage**     | Global User Preferences (Dark mode, sidebar collapse).                     | Explicit user clearing.          |
| **Cache API**        | Immutable Application Code (Micro-Frontend JS bundles via Service Worker). | Revalidated by hashed filenames. |
| **IndexedDB**        | Massive structured offline data (Video buffers, Cached catalogs).          | Automated LRU eviction script.   |
| **Cookies**          | Secure Authentication (`HttpOnly` JWTs).                                   | Managed by Backend.              |

## 6. Server-Driven Configuration (BFF Pattern)

ZenOS does not hardcode infrastructure URLs. The platform bootstraps via a backend manifest (`/platform-manifest.json`) that dictates:

- Remote bundle URLs for Micro-Frontends.
- Tenant-specific storage namespaces (`zenos:tenant-4829:v1`).
- Feature toggle kill switches (to dynamically hide broken modules).

By injecting this dynamically, the Frontend Shell remains completely decoupled from infrastructure deployments, enabling zero-downtime hot-swapping of enterprise modules.
