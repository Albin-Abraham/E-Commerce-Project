# Inter-process Coordination

> Status: Mandatory Engineering Contract
> Scope: Feature Communication and Events

## 1. Feature Communication Rules

Features communicate ONLY through:

- explicit props
- domain events
- shared runtime services
- controlled contexts
- public contracts

Forbidden:

- direct feature mutation
- hidden shared stores
- internal feature imports
- implicit runtime coupling

All feature communication MUST remain explicit. This ensures schema validation, type safety, versioning, and runtime discovery for cross-domain communication.
