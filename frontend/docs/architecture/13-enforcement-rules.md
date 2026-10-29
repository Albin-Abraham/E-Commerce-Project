# Automated Governance

> Status: Mandatory Engineering Contract
> Scope: Tooling and Architectural Linting

## 1. Architectural Enforcement

Architectural boundaries MUST be enforced through tooling.
Required enforcement:

- ESLint boundary rules
- import restrictions
- dependency graph validation
- layer enforcement
- circular dependency prevention

Documentation alone is insufficient governance.

## 2. Import Direction Rules

Architectural flow is strictly unidirectional.
Allowed:
Composition → Controller → ViewModel → Hooks → Services.
Presenter → UI Primitives.

Forbidden reverse imports. Lower layers MUST NEVER depend on upper orchestration layers. Circular dependencies are prohibited.
