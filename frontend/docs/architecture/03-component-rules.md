# Rendering Governance

> Status: Mandatory Engineering Contract
> Scope: Presenters, Primitives, and Feature Composition

## 1. Feature Composition Rules

Feature composition defines visual orchestration.
Composition MAY place features, coordinate layouts, define visual regions, and establish rendering hierarchy.
Composition MUST NOT fetch remote data, perform mutations, derive business state, or contain feature internals. Composition behaves as a visual operating system.

## 2. Presenter Rules

Presenters are pure rendering systems.
Presenters MAY render UI, animate UI, style UI, and emit callbacks.
Presenters MUST NOT fetch data, mutate backend resources, coordinate workflows, synchronize routing, access stores directly, import services, import query hooks, or import reducers.
A Presenter must be fully renderable from props alone.

## 3. Primitive Component Rules

Primitive components are reusable visual foundations (e.g., Button, Input, Modal, Card, Tabs, Table, Skeleton).
Primitive components MUST remain domain-agnostic, composable, reusable, and behaviorally predictable.
Primitive components MUST NOT understand business domains, fetch data, or orchestrate features.

## 4. Primitive Prop Contract (The Rest/Forwarding Rule)

All primitive components in `src/shared/ui/` MUST:

1. Extend the native HTML attributes for their underlying element (e.g., `interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>`).
2. Spread remaining `...rest` or `...props` to the root DOM element.
3. Forward refs (`React.forwardRef`) if the primitive acts as a leaf node.

This guarantees that standard accessibility (`aria-*`), testing (`data-testid`), and native event handlers (`onFocus`, `onBlur`) never require custom prop drilling.
