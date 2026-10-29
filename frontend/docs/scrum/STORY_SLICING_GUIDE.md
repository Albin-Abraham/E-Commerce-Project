# Story Slicing Guide

## Purpose
Large, monolithic user stories are the primary cause of blocked sprints, delayed reviews, and high-risk releases. This guide outlines proven patterns to slice stories into vertical, independently deliverable increments of 1 to 3 days.

---

## 1. Principles of Vertical Slicing

```text
❌ Horizontal Slicing (Bad):
   Layer 3: UI only (cannot function without backend)
   Layer 2: API only (no user value)
   Layer 1: Database tables only

✅ Vertical Slicing (Good):
   Increment 1: Minimal end-to-end slice (Happy path: create & view simple record)
   Increment 2: Enhanced validation, filters, and edge cases
   Increment 3: Bulk operations or asynchronous processing
```

---

## 2. Recommended Slicing Patterns

### Pattern 1: Workflow Step Slicing
Divide a multi-step user journey into progressive steps:
- **Slice A:** Employee draft & submission of request.
- **Slice B:** Manager review and decision (Approve / Reject).
- **Slice C:** Escalation or automated expiration after 7 days.

### Pattern 2: Happy Path vs Edge Cases / Exceptions
- **Slice A:** Basic happy-path submission with valid inputs.
- **Slice B:** Validation handling (conflict detection, leave balance exhaustion, shift overlap).

### Pattern 3: Simple vs Complex Operations
- **Slice A:** Single item creation / inline update.
- **Slice B:** CSV bulk import via asynchronous Celery queue.

### Pattern 4: Data Variation / Entity Slicing
- **Slice A:** Standard salaried employee shift tracking.
- **Slice B:** Hourly contractor / overtime calculation adjustments.

---

## 3. Sizing Rules of Thumb
- A story should be small enough to complete within **1 to 3 days** of active development.
- If a story requires more than 5 pull requests or touches more than 25 files, it is a candidate for slicing.
- Every slice must deliver tangible, demonstrable value (API endpoint testable or UI element usable).
