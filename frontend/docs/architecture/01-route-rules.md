# The Runtime Kernel Rules

> Status: Mandatory Engineering Contract
> Scope: Router and Runtime Infrastructure

## 1. Router Runtime Rules

The router runtime is infrastructure-only.
Responsibilities:

- route resolution
- authentication
- authorization
- lifecycle orchestration
- query prewarming
- cleanup registration
- transition coordination
- dependency injection

The router runtime MUST NOT:

- contain feature rendering
- contain business presentation logic
- contain feature orchestration
- contain reusable visual systems

## 2. Route Container Rules

Route containers are runtime assembly boundaries.
Responsibilities:

- route param extraction
- provider mounting
- composition registration
- runtime bridge initialization

Containers MUST remain thin. Containers MUST NOT orchestrate business logic, contain large rendering trees, contain feature workflows, or contain styling systems.

## 3. URL Synchronization Rules

URL state is a first-class runtime contract.
URL synchronization SHOULD be used for deep linking, selection persistence, filter persistence, dashboard restoration, and navigation recovery.
Recoverable state SHOULD remain URL-addressable.

## 4. Runtime Kernel Centralization

Platform infrastructure MUST remain centralized.
Required runtime kernel structure: `core/` (e.g. `router/`, `runtime/`, `query/`, `telemetry/`, `auth/`, `permissions/`, `lifecycle/`, `error-handling/`).
Business domains MUST NOT implement infrastructure redundantly.
