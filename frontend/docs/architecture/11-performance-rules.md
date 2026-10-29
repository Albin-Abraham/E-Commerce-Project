# Rendering/Runtime Performance Governance

> Status: Mandatory Engineering Contract
> Scope: Performance Optimization

## 1. Performance Doctrine

Performance is a mandatory architectural concern.
Required strategies:

- route-level code splitting
- lazy feature loading
- query prewarming
- rendering isolation
- cache-first rendering
- minimal hydration waterfalls

Rendering boundaries MUST remain localized.
State changes SHOULD rerender the smallest possible ownership boundary.
This governance handles render budgets, memoization, virtualization, and transition management.
