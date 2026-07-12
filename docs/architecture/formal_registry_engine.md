# 🧠 Formal Registry Engine

The **`FormalRegistryEngine`** is the logical orchestrator of the Backend-RestFul platform. It treats the system's product structure not just as data, but as a set of mathematical constraints that must be proven sound during the bootstrapping phase.

## 🗝️ Core Responsibilities

### 1. Precedence Resolution (`PrecedentsOrder`)
The engine uses **Topological Sorting** to determine the exact order in which features must be initialized. 
- **Rule**: If Feature A depends on Feature B, B *must* precede A in the activation sequence.
- **Scalability**: This prevents "Initialization Race Conditions" even when the graph reaches hundreds of deeply nested features.

### 2. Logic Predicate Evaluation
The engine implements **Predicate Logic** to handle complex business rules:
- **Negation (XOR/Conflicts)**: `NOT ADVANCED_PAYROLL` ensures that the "Step-Up" feature cannot coexist with the "Legacy" version.
- **Associativity (Transitivity)**: If `A -> B` and `B -> C`, the engine automatically injects `C` when `A` is requested, minimizing YAML redundancy.

### 3. Backtracking Search (Satisfiability)
Before a database transaction is committed during `sync_modules`, the engine performs a **Backtracking Search**:
- **Simulation**: It simulates the resulting system state.
- **Satisfiability Check**: It proves that all dependencies are satisfied and no negations are violated.
- **Predictive Error**: If a conflict is found, it provides a precise traceback of the logical contradiction (e.g., *"Contradiction found: Feature X is requested by Plan Gold, but it negates Feature Y which is required by System Core"*).

---

## 🧬 Data Integration

The engine orchestrates the lifecycle across four primary models:

1.  **`SystemFeature`**: The primary nodes in the graph.
2.  **`FeatureDependency`**: The edges defining the `PrecedentsOrder`.
3.  **`FeatureMigration`**: The ledger recording structural shifts and hashing the YAML state.
4.  **`SystemConfig`**: The leaf configurations that are validated against the active feature-set invariants.

## 🚦 Execution Workflow

1.  **Parse**: Extract rules from `module_config.yaml`.
2.  **Verify**: Built the Graph and check for **Cycles** and **Invariants**.
3.  **Solve**: Run the **Backtracking Solver** to ensure the SaaS Plan is a valid subset of the total registry.
4.  **Ledger**: Record the successful sync in `FeatureMigration`.

---
> [!IMPORTANT]
> This engine ensures that the system is **Self-Healing**. If a developer pushes a YAML change that introduces a circular dependency or a logical contradiction, the `FormalRegistryEngine` will reject the sync in the CI/CD pipeline, preventing production breakage.
