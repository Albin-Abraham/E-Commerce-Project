# The Constitution

> Status: Mandatory Engineering Contract
> Scope: Entire Frontend Runtime Platform
> Applies To: All Contributors, Features, Domains, Runtime Systems, and Shared Infrastructure

## 1. Architectural Philosophy

ZenOS is a deterministic, feature-oriented frontend runtime platform.
The system is designed around:

- feature autonomy
- runtime isolation
- deterministic rendering
- infrastructure-driven orchestration
- asynchronous resilience
- deep-link state recovery
- scalable domain ownership
- composable UI systems
- defensive execution
- governed architectural boundaries

The platform prioritizes:
explicitness > magic
composition > inheritance
contracts > assumptions
isolation > coupling
determinism > convenience

## 2. Core Runtime Principle

**Infrastructure Orchestrates. Features Encapsulate. Presenters Render.**

All frontend systems MUST follow this architectural hierarchy:
Router Runtime → Route Containers → Feature Composition → Feature Controllers → Feature ViewModels → Presenters → UI Primitives
Responsibilities MUST NOT leak across boundaries.

## 3. Complexity Escalation Policy

Architecture complexity MUST scale proportionally with feature complexity.

- Simple Components: Use presenters, local hooks.
- Medium Features: Use controllers, ViewModels, presenters.
- Enterprise Features: Use compositions, isolated feature modules, state machines, runtime synchronization, orchestration boundaries.
  Over-architecture and under-architecture are equally prohibited.

## 4. Final Doctrine

ZenOS is not a collection of pages. ZenOS is a governed frontend runtime platform composed of isolated, contract-driven feature systems operating within deterministic orchestration boundaries.
