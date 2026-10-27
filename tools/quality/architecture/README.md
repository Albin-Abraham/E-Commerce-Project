# ZenOS Architecture Integrity Module

This module protects the dependency boundaries, layered DAG structure, and isolation guarantees of ZenOS.

---

## 1. Architectural Layers

Rules are formally defined in [layers.yaml](rules/layers.yaml).

| Layer | Component | Description |
|:---:|---|---|
| **0** | `core.registry`, `core.configuration` | Pure engine registries & framework configuration |
| **1** | `core.base_models` | Foundational abstract models, base mixins, fields |
| **2** | `core.admin.models`, `core.admin.utils` | Low-level admin models & utilities |
| **3** | `core.admin.helpers`, `core.admin.services` | Core domain business services & helpers |
| **4** | `core.base_serializers` | Base DRF serialization contracts |
| **5** | `core.base_views` | Base API controller & viewset abstractions |
| **6** | `core.admin.views`, `core.admin.urls` | Admin routing, views, throttling, permissions |
| **7** | `apps.*` | Feature applications (shop, cart, inventory, etc.) |
| **8** | `core.admin.tasks` | Background Celery tasks & delayed orchestrations |

---

## 2. Enforcement Rules

1. **Direction**: Top-level imports may only flow downwards (`Layer N` $\rightarrow$ `Layer < N`).
2. **Cross-Feature Isolation**: Feature apps (`apps.<name>`) must interact through public service interfaces, not direct internal coupling.
3. **Suppression Policy**: Any unavoidable cross-layer dependency requires a specific suppression annotation (`# noqa: DAG`) with an explanatory comment.

---

## 3. Running the Architecture Check

```bash
python tools/quality/architecture/custom-checks/check_layered_dag.py
```
Or via the orchestrator:
```bash
./tools/quality/orchestrator/check.sh architecture.dag
```
