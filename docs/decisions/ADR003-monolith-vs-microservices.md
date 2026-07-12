# **ADR-003: Monolith vs. Microservices**

**Status:** Accepted
**Date:** 2025-11-11
**Decision Type:** System Architecture

---

## **1. Context**

The system contains multiple business areas (Users, Modules, Pages, Billing, App Permissions).
The team must choose between:

* **One Django monolith**
* **Multiple Django microservices**
* **Modular monolith** (monolith with clear boundaries)

Operational constraints:

* Small-to-medium team
* Shared database interactions
* Tight coupling between billing and medical modules
* Deployment simplicity preferred

---

## **2. Decision**

Adopt a **Modular Monolith Architecture** using Django.
All domain modules live in one codebase but are separated logically into apps with clearly defined boundaries.

Not adopting microservices at this stage.

---

## **3. Rationale**

* Django excels as a monolith
* Lower operational complexity
* Microservices require high DevOps maturity
* Centralized transactions and permissions are easier
* Faster development speed

---

## **4. Consequences**

### Positive

* Faster iteration
* Simple deployment
* Simplified database consistency
* Internal communication is cheap (no network layer)

### Negative

* Future scaling requires careful modular boundaries
* Large monolith requires monitoring & discipline to avoid coupling

---

## **5. Alternatives Considered**

### A. Full Microservices

Rejected → complex infrastructure, premature scaling.

### B. Single-layer Monolith Without Modular Apps

Rejected → code becomes harder to maintain and scale.

---

## **6. Implementation Plan**

* Maintain one Django project
* Maintain multiple domain apps + one `core/` app
* Add boundaries via services, policies, and folder structure
* Prepare future extraction points if microservices become necessary

---
