
---

# **ADR-001: Choosing a Single `core/` App for Infrastructure Code**

**Status:** Accepted
**Date:** 2025-11-11
**Decision Type:** Architectural Structure — Django Application Layout

---

## **1. Context**

The project requires a place to store infrastructure-level (non–domain-specific) code, including:

* custom management commands
* base admin configurations
* shared mixins and abstract models
* middleware
* validators, utilities, exceptions
* platform-wide services

Two approaches were considered:

1. **Single `core/` app** containing all infrastructure code
2. **Multiple smaller infra apps** (e.g., `admin_core/`, `foundation/`, `utils/`, `commands/`, `platform/`)

Django apps incur overhead in terms of migrations, admin registration, testing isolation, discovery rules, and settings maintenance. Most Django projects use one infra app unless the codebase is extremely large.

---

## **2. Decision**

The project will use a **single `core/` Django app** as the centralized location for all infrastructure-level components.
The `core/` app will internally use a modular folder structure (e.g., `core/mixins`, `core/admin`, `core/utils`, `core/management/commands`) to maintain clarity and separation.

---

## **3. Rationale**

### ✔ Simplicity & Maintainability

A single app keeps the architecture predictable and reduces cognitive overhead for developers.

### ✔ Django Convention Alignment

Most Django codebases follow a “single core app” pattern. New contributors understand it immediately.

### ✔ Avoids Fragmentation

Splitting infra code across multiple apps can cause:

* unclear boundaries
* boilerplate duplication
* more migrations and import paths
* more INSTALLED_APPS entries

### ✔ Internal Modularity Is Sufficient

A structured internal layout (e.g., `core/mixins`, `core/services`) provides modularity without the cost of additional apps.

### ✔ Scales Well

Even large Django monoliths successfully use one core app with proper directories.

---

## **4. Consequences**

### **Positive**

* Clear, unified place for infrastructure code
* Low boilerplate: one app, one migrations folder
* Easy navigation and onboarding
* Fewer Django app registry complications
* Less noisy `INSTALLED_APPS`

### **Negative**

* `core/` may grow large over time
* Requires discipline to maintain internal substructure
* Future modularization may require refactoring if the system becomes extremely large

---

## **5. Alternatives Considered**

### **A. Multiple smaller infra apps**

**Rejected**, because:

* adds unnecessary overhead for this project size
* increases fragmentation and cognitive load
* complicates deployment, migrations, admin loading
* Django is optimized for domain-focused apps, not infra micro-apps

### **B. No dedicated infra app**

**Rejected**, because:

* would scatter infrastructure code into domain apps
* leads to tight coupling and poor architecture hygiene

---

## **6. Implementation Plan**

1. Create a `core/` Django app
2. Add a clear directory structure:

```
core/
    admin/
    mixins/
    models/
    management/commands/
    middleware/
    utils/
    services/
    exceptions.py
    signals.py
```

3. Register `core` in `INSTALLED_APPS`
4. Enforce standards for infra code placement in `core/`

---

## ✔ Final Summary

> We will adopt **a single, modular `core/` app** to centralize all system-level Django code.
> This approach provides clarity, simplicity, and conventional alignment while preserving modularity through internal folder organization.

---

