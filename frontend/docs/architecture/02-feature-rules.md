# Feature Operating Model

> Status: Mandatory Engineering Contract
> Scope: Feature Architecture and Controllers

## 1. Feature Architecture

Features are autonomous runtime systems.
Each feature MUST encapsulate:

- controllers
- ViewModels
- presenters
- hooks
- services
- local state
- feature contracts
- runtime coordination

Features MUST remain independently testable, composable, evolvable, and replaceable.
Pages compose features. Pages do not implement feature logic.

## 2. Controller Rules

Controllers are feature orchestration boundaries.
Controllers MAY:

- invoke hooks
- connect ViewModels
- coordinate interactions
- synchronize URL state
- synchronize feature state
- bind presenters

Controllers MUST NOT contain reusable UI primitives, styling systems, excessive JSX depth, or become rendering coordinators. Controllers orchestrate behavior, not appearance.
