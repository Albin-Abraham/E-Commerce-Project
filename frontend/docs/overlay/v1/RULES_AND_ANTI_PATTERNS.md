# Overlay: Rules and Anti-Patterns

## 1. 🛑 Anti-Patterns

### 1.1. Unmanaged Z-Index

**The Problem**: Hardcoding `z-index: 9999` in inline styles or bespoke CSS classes.
**Why it's bad**: Causes stacking context bugs (e.g., tooltips appearing behind modals). Always use the standard `--z-*` variables.

### 1.2. Manual State Toggling

**The Problem**: Using basic `const [isOpen, setIsOpen] = useState(false)` for complex modals.
**Why it's bad**: Fails to coordinate focus or scroll-locking.

## 2. ✅ Core Rules

### 2.1. Always use `useModal`

Use the provided `useModal` hook to toggle overlays predictability. It standardizes open/close handlers across the app.

### 2.2. Keep Overlays High in the Tree

Do not render a `Modal` deeply nested inside a small component unless it relies on React Portals. Rendering it high in the DOM tree avoids weird overflow clipping issues.
