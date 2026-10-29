# ViewModel Governance

> Status: Mandatory Engineering Contract
> Scope: ViewModels and Hooks

## 1. ViewModel Rules

ViewModels are deterministic interaction coordinators.
Responsibilities:

- derived state
- mutation coordination
- optimistic synchronization
- async orchestration
- permission validation
- transformation logic
- interaction coordination
- workflow transitions

ViewModels MUST NOT render JSX, manipulate DOM, contain styling concerns, or contain layout concerns. ViewModels are orchestration engines. This prevents God Objects.

## 2. Hook Architecture Rules

Hooks are behavioral isolation systems.
Categories: query hooks, mutation hooks, synchronization hooks, effect hooks, utility hooks.
Hooks MUST isolate reusable behavior, remain composable, and remain deterministic.
Hooks MUST NOT render UI, become orchestration monoliths, or coordinate entire pages.
