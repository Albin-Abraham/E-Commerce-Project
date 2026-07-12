# 🔗 Cross-App Communication & Integrations

In our **Modular Monolith** architecture, managing how vertical slices talk to each other is critical for maintaining long-term flexibility and preventing dependency hell.

## 1. The "Inversion of Coupling" Principle

Apps should never talk to each other's database models directly for write operations.

- **❌ BAD**: `App A` imports `Model B` and calls `Model B.objects.create(...)`.
- **✅ GOOD**: `App A` calls `Service B.create_resource(...)`.

### Why?
1. **Encapsulation**: App B should be the sole owner of its own business logic and invariants.
2. **Decoupling**: If App B changes its internal data structure, App A shouldn't break as long as the Service interface remains consistent.

---

## 2. Shared Registry (The Common Ground)

The `core` layer provides the **ModuleRegistry** and `modules.yaml`, which serve as the configuration foundation for all integrations.

- **Feature Dependencies**: Defined relationships in the registry ensure that one system doesn't start before its dependencies are healthy.
- **SaaS Scoping**: The discovery of which apps are active happens through `core`, allowing for a single entry point for multi-tenant awareness.

---

## 3. Communication Patterns

### Synchronous (Service-to-Service)
Used for immediate feedback loops or when a transaction must span multiple domains.
- **Pattern**: Direct method call on a Service class in another app.
- **Risk**: Increases temporal coupling.

### Asynchronous (Task-based)
Used for side effects or long-running processes (e.g., sending emails, generating reports).
- **Pattern**: App A triggers a Celery task that is handled by App B.
- **Benefit**: Best for scalability and decoupling.

---

## 4. Integration via `core`

Certain integrations are handled globally via `core`:
- **Auditing**: Shared `AuditLog` structure for all apps.
- **Permissions**: Every app registers its `SystemFeature` in the global registry.
- **Health Checks**: `SystemHealth` monitoring aggregates data from all apps to provide a single platform-health dashboard.
