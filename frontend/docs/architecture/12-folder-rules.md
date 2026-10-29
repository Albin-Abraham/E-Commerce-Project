# Filesystem Governance

> Status: Mandatory Engineering Contract
> Scope: File and Directory Organization

## 1. Runtime Domains

ZenOS is organized by runtime domains. Domains are top-level ownership boundaries (e.g., `patient/`, `pharmacy/`, `billing/`, `analytics/`).
Domains own features, domain contracts, domain orchestration, domain communication, and domain state boundaries.
Cross-domain coupling MUST remain explicit and contract-driven.

## 2. Feature Structure

Approved structure separates public and internal boundaries:

```
features/
  patient-list/
    public/
    internal/
```

This governance layer prevents folder entropy by enforcing runtime domains, public/internal split, and compositional boundaries.
