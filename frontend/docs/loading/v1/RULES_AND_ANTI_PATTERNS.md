# Loading: Rules and Anti-Patterns

## 1. 🛑 Anti-Patterns

### 1.1. Local Full-Screen Spinners

**The Problem**: Creating local `<div className="fixed inset-0 ...">` spinners in individual pages or components.
**Why it's bad**: Leads to overlapping spinners, z-index wars, and disjointed user experiences.

### 1.2. Boolean Loading Props Hell

**The Problem**: Passing `isLoading` props down 5 levels of components.
**Why it's bad**: Litters the component tree. Use the singleton service for global blocking loads.

## 2. ✅ Core Rules

### 2.1. Use the Loading Service

Dispatch loading states via `LoadingService` (or interceptors) so the centralized `LoaderOverlay` can handle it gracefully.

### 2.2. Skeleton Loaders for Sections

Use the global `LoaderOverlay` only for critical blocking operations (e.g. Submitting a form, major route change). For data fetching inside widgets, prefer non-blocking Skeleton loaders instead.
