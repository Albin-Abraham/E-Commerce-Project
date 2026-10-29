# Acceptance Criteria Guidelines

## Purpose
Acceptance criteria (AC) define the boundaries of a user story and confirm when the feature is working as intended from both a business and technical perspective.

---

## 1. Preferred Formats

### Format A: Given-When-Then (Scenario-Based)
Best for behavioral logic, state transitions, workflows, and edge cases.

```gherkin
Scenario: Employee Attendance Correction Approval
  Given an employee has submitted an attendance correction request with status "PENDING"
  And the current user is an authorized HR Manager with tenant permission "attendance.approve"
  When the manager sends a POST request to "/api/v1/attendance/corrections/{id}/approve/"
  Then the correction status transitions to "APPROVED"
  And an audit log record is created with the manager's user ID and timestamp
  And a notification is dispatched to the employee via Celery background task.

Scenario: Unauthorized Approval Attempt
  Given an authenticated employee without "attendance.approve" permission
  When the employee sends a POST request to "/api/v1/attendance/corrections/{id}/approve/"
  Then the response status is 403 Forbidden
  And the correction status remains "PENDING".
```

### Format B: Rule-Based Checklist
Best for form validation, data display, filters, and UI constraints.

```markdown
- [ ] Shift time selection must validate that `end_time` > `start_time`.
- [ ] Reason field is mandatory and must not exceed 500 characters.
- [ ] Table list defaults to descending order by `submitted_at`.
- [ ] Pagination allows 10, 25, 50 rows per page.
- [ ] Error toasts display specific field-level validation errors returned by the API.
```

---

## 2. Best Practices for ZenOS Stories
1. **Be Specific, Not Generic:** Avoid vague statements like "The form should be fast". Specify "API response must return within 200ms under standard payload".
2. **Include Error States:** Always specify what happens when input is invalid, duplicate, unauthorized, or network fails.
3. **Traceability:** Each automated test should map directly to one or more Acceptance Criteria.
