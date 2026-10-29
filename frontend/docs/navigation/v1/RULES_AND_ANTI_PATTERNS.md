# Navigation: Rules and Anti-Patterns

## 1. 🛑 Anti-Patterns

### 1.1. Re-inventing the Menu

**The Problem**: Building custom dropdowns with raw `div`s, `onMouseEnter`, and `onClick` handlers.
**Why it's bad**: Lacks accessibility (ARIA), keyboard support, and robust focus trapping.

### 1.2. Anchor Tag Abuse

**The Problem**: Using native `<a href="...">` tags for SPA navigation.
**Why it's bad**: Bypasses the application router, causing a full page reload and destroying application state.

## 2. ✅ Core Rules

### 2.1. Use React Aria Elements

Always build navigational overlays using the established `react-aria-components` to ensure screen-reader and keyboard compliance.

### 2.2. Integrate Prefetching

Use the `prefetchManager` within navigation links (e.g., on hover) to fetch assets and data early.
