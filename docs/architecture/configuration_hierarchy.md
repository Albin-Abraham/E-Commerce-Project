# ⚙️ Configuration Hierarchy & System Initialization

The Backend-RestFul platform employs a multi-layered configuration strategy that separates infrastructure concerns from product blueprints and business policies.

## 1. Runtime Environment (`.env`)
**Role**: Infrastructure & Security (Orchestration Layer).
- **Format**: Key-Value pairs.
- **Consumption**: Loaded via `django-environ` into `settings.py`.
- **Key Data**: Database URLs, Redis URLs, JWT Secrets, Debug flags.
- **Lifecycle**: Managed by DevOps/Docker; unique to each deployment environment.

---

## 2. Product Blueprint (`modules.yaml` & `module_config.yaml`)
**Role**: "Build Time" / Logical Structure (Domain Layer).
- **Format**: Hierarchical YAML.
- **Consumption**:
    - `modules.yaml`: Used by `ModuleRegistry` for dynamic runtime lookups (cached in Redis).
    - `module_config.yaml`: Seeded into `SystemModule` and `SystemFeature` relational models via `python manage.py seeds_data --section modules`.
- **Key Data**: System hierarchy (`hrms` -> `payroll`), feature flags, UI metadata (Icons, Colors), and model mappings.
- **Lifecycle**: Versioned in Git; changes reflect product-wide feature updates.

---

## 3. Business Policies (`system_config.yaml`)
**Role**: Hierarchical Defaults & Scoped Rules.
- **Format**: YAML list with **Scoping Metadata** (`scope: GLOBAL|SYSTEM|MODULE|FEATURE`).
- **Consumption**: Seeded into the `SystemConfig` database model.
- **Key Data**: Base currency (`₹`), system timezone (`Asia/Kolkata`), employee ID prefixes, and module-specific UI toggles.
- **Inheritance**: Supports a "Fallback" model where Feature Settings > Module Settings > Global Defaults.
- **Lifecycle**: Initialized during setup; can be overridden via the Admin UI at runtime.

---

## 🛠️ System Initialization Flow

When the system is first deployed or architecturally updated, the configuration is hydrated as follows:

1. **Environment Load**: Standard Django startup reads `.env`.
2. **Database Migration**: `python manage.py migrate` creates the configuration tables.
3. **Product Seeding**: `python manage.py seeds_data --section modules` hydrates the relational registry from `module_config.yaml`.
4. **Policy Seeding**: `python manage.py seeds_data --section system_config` hydrates system-wide defaults from `system_config.yaml`.
5. **Advanced Sync**: `python manage.py sync_modules` invokes the `ModuleSyncService`, which handles **Topological Sorting** for dependencies and a **Backtracking Solver** for logic predicates (see [Bootstrap Orchestration](bootstrap_orchestration.md)).
6. **Hierarchical Resolution**: The `SystemConfigurationMiddleware` provides an **Inheritance Resolver** that hydrates the system's runtime state based on these layered rules.
