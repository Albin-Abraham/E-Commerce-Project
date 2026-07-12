# 🚀 Bootstrap Orchestration & Formal Logic

The Backend-RestFul platform employs a mathematically sound bootstrapping process that ensures system-wide structural integrity through formal verification and discrete algorithmic patterns. (See [Architectural Rigor](architectural_integrity.md) for its real-world feasibility).

## 🏛️ The Bootstrap Lifecycle

Initializing the system is a multi-phase process that transforms static YAML blueprints into a verified, relational state.

1.  **Blueprint Discovery**: The `ModuleSyncService` reads `modules.yaml` and `module_config.yaml`.
2.  **SaaS Tier Selection (Superset Selection)**:
    -   The system identifies the target **Plan** (e.g., `Default`, `Step-Up`, `Progressive`).
    -   Plans are treated as **Supersets** of features. An upgraded plan is a mathematical expansion of the base set.
3.  **Formal Verification**:
    -   **Topological Sorting**: Feature dependencies (e.g., `payroll` depends on `payroll_period`) are sorted.
    -   **Graph Invariants**: The system verifies the structure is a **DAG (Directed Acyclic Graph)**.
4.  **Conflict Resolution (Backtracking)**:
    -   A **Backtracking Solver** evaluating negations (e.g., *"Progressive Payroll replaces Basic Payroll-Period"*).
    -   **Proof of Conflict**: If a conflict is found (e.g., trying to enable a "Step-Up" feature without its "Default" requirement), the system generates a human-readable diagnostic:
        > ❌ **SYNC FAILED**: Cannot enable `ADVANCED_PAYROLL` because it negates `BASIC_PERIOD_LOCK`, but `BASIC_PERIOD_LOCK` is required by the active `CORE_HR` module.
4.  **Relational Hydration**: Verified data is committed atomically to `SystemModule`, `SystemFeature`, and `FeatureDependency` tables.
5.  **State Persistence**: A structural hash of the YAML is stored in `FeatureMigration` to track versioning and skip redundant processing.

---

## 🏗️ Discrete Math & Logic Structures

The system leverages several mathematical concepts to guarantee stability:

### 1. Superset Authorization (Set Theory)
Permissions are calculated using set-based operations:
- **Manifest = (UserRoles ∪ DirectPermissions) ∩ (DivisionCatalog)**
This ensures that no user can exceed the "Superset" of features allowed for their specific subsidiary or division.

### 2. Predicate Logic (Rules Engine)
Configurations support complex logical operators:
- **Negation (`NOT`)**: Used for mutually exclusive features.
- **Associativity**: Transitive dependencies are automatically resolved.
- **Toggles**: Features can be conditionally enabled based on global system states.

### 3. Tree-Based Inheritance (`Trie` Structure)
The foundation of the feature registry is a **Path-Materialized Trie** where:
- **Nodes**: Represent Systems, Modules, or Features.
- **Paths**: Encode the full inheritance chain (e.g., `base.hrms.payroll.settings`).
- **Invariants**: The system enforces **Reachability**—ensuring every enabled feature has a complete, valid path to its root dependencies.

## 🚀 Why the Tree Architecture?

Using a tree structure (specifically a Trie) provides two critical advantages:

1. **Deterministic Initialization (Bootstrapping)**:
   - During sync, the tree allows for a natural **Post-Order Traversal** (Bottom-up). This ensures that leaf-level configurations are validated against their parent module specifications before the database is committed.
2. **Instant Inheritance Resolution (Configuration)**:
   - When a service requests a setting (e.g., `currency`), the resolver "walks up" the trie. It starts at the **Feature** level and falls back to **Module**, **System**, and **Global** in O(K) time, where K is the depth of the tree (max 4). This eliminates complex joins and nested `if/else` logic at runtime.

---

## 🛠️ Developer & Admin Tools

### `python manage.py sync_modules`
The primary command for triggering the orchestrator. It performs an atomic, logic-checked synchronization of the product structure.

### `FeatureMigration`
A database-backed ledger that records every structural change to the system's registry, providing an audit trail for architectural shifts.
