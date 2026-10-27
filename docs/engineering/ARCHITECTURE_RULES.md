# ZenOS Engineering: Architecture Rules

Defines the architectural boundaries, dependency flows, and isolation guarantees across the ZenOS system.

---

## 1. The Layered Directed Acyclic Graph (DAG)

The codebase strictly enforces 9 hierarchical layers (0 through 8). A layer may import only from layers below it:

```text
Layer 0: core.registry / core.configuration / stdlib / 3rd-party
   ▲
Layer 1: core.base_models (fields, base mixins, abstract entities)
   ▲
Layer 2: core.admin.models / core.admin.utils
   ▲
Layer 3: core.admin.helpers / core.admin.services (business logic)
   ▲
Layer 4: core.base_serializers
   ▲
Layer 5: core.base_views
   ▲
Layer 6: core.admin.views / core.admin.urls / throttling / permissions
   ▲
Layer 7: apps.* (Feature Applications)
   ▲
Layer 8: core.admin.tasks (Celery asynchronous tasks)
```

### Prohibited Directions
- `core/base_models/` MUST NOT import from `core/admin/*` or `apps/*`.
- `apps/*` MUST NOT import `core/admin/tasks/*` directly at top-level.
- Direct circular imports between distinct apps are rejected.

---

## 2. Enforcement

The DAG is automatically verified on every commit and CI run via:
```bash
./tools/quality/orchestrator/check.sh architecture.dag
```
Rules are declaratively defined in `tools/quality/architecture/rules/layers.yaml`.
