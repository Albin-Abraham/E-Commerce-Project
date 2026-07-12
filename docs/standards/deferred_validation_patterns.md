# ⏳ Deferred Validation Patterns (Serializer & API View)

This guide explains how to strategically move complex or expensive business rules from the Model layer to the **Serializer** and **API View** levels.

---

## 1. Why Defer Validation?
"Deferred" validation is logic that is only executed after basic structural and format checks have passed. This is essential for:
- **Performance**: Avoiding expensive DB queries or external API calls on malformed requests.
- **Orchestration**: Validating logic that depends on multiple resources or "Ephemeral" state (like a user's current session or an active promotion).
- **Separation of Concerns**: Keeping the Domain Model "Lean" while the API handles "Conversational" business logic.

---

## 2. Implementation: The Serializer Tier (`validate()`)
The Serializer's `validate()` method is the best place for **Object-level** and **Expensive** checks.

```python
class CompanySerializer(SmartSerializerMixin, serializers.ModelSerializer):
    def validate(self, data):
        # 1. Structural checks handled by field_rules (Fast-Fail)
        
        # 2. Deferred Check: Expensive DB Lookup
        if not check_external_credit_registry(data.get('tax_id')):
             raise serializers.ValidationError({"tax_id": "Invalid tax registration."})
             
        # 3. Cross-Field Logic
        if data.get('plan') == 'gold' and not data.get('is_premium'):
             raise serializers.ValidationError("Gold plan requires premium status.")
             
        return data
```

## 3. Implementation: The API View Tier (`perform_create`)
The View is responsible for **Contextual Orchestration**—checks that depend on the `request` or the user's session.

```python
class CompanyCreateView(BaseApiView):
    def perform_create(self, serializer):
        # 1. Contextual Check: Quota Management
        user = self.request.user
        if user.company_count >= user.subscription.max_companies:
            raise PermissionDenied("You have reached your company quota.")
            
        # 2. Final Injection
        serializer.save(created_by=user)
```

---

## 🚦 Decision Matrix: Where to place the logic?

| Logic Type | Placement | Why? |
| :--- | :--- | :--- |
| **Field Format** | Model / Field | Type and basic structure constraints. |
| **Simple Uniqueness** | Mediator | Checked before transaction via `UniqueRule`. |
| **Complex Uniqueness** | Mediator | Multi-resource check handled in the validation phase. |
| **External API Call** | Mediator | "Side-effect" validation; decoupled from model persistence. |
| **Quota / Permissions** | API View / Mediator | Context-dependent; needs `request.user`. |

> [!TIP]
> **Mediated Validation**: By moving rules to the **ValidationMediator**, we ensure that business-critical "Absolute Integrity" is enforced without Row-Locking the database or coupling domain logic to the Django ORM.

---

## 🏛️ Seasoned Developer Perspective: The Strategic Deferral

For a senior architect, "Deferred Validation" is not about avoiding work in the model—it's about **Strategic Placement** of complexity.

### 1. Context Isolation (The Request Object)
A common mistake for junior developers is attempting to pass the `request` object into the Model or Rule Engine.
- **Seasoned View**: The Model should be "Request-Agnostic". Any validation that requires a user's session, IP address, or specific API-version logic belongs strictly in the **Serializer or View**. This keeps the domain core pure and testable in isolation.

### 2. Guarding Expensive Resources
Running a complex DB aggregation or an external API call for every validation attempt is a performance anti-pattern.
- **Seasoned View**: We use the **Serializer as a Firewall**. By the time a deferred check runs, we've already ensured the data types are correct and basic structural invariants are met. This "Fast-Fail" approach protects your most expensive resources from trash data.

### 3. Graceful Failure & Partial States
What happens when an external "Address Validation" service is down?
- **Seasoned View**: If this logic is in the Model, the data layer is now "Hard-Locked" to a 3rd party dependency. By deferring this to the Serializer/View, we have the flexibility to catch the exception, save the record as **"Pending Validation"**, and notify a background worker to retry later.

### 4. The "Pre-Flight" Advantage
Seasoned developers prioritize UX by implementing "Dry-Run" capabilities.
- **Seasoned View**: Handling complex logic in the Serializer allows us to expose a `?dry_run=true` API flag. This gives the frontend instant feedback on expensive business rules without actually mutating the database state.

> [!TIP]
> **Conclusion**: Use the **ValidationMediator** for "Absolute Integrity" and "Business Logic". The **Model** should remain a "Dumb" data container to ensure high-performance, non-blocking operations across the entire ERP ecosystem.

---

## 🛡️ Best Practices
1.  **Always Fast-Fail**: Put simple rules in the Model/Field level so they trigger first.
2.  **Idempotency**: Ensure deferred checks don't have permanent side effects (e.g., don't "Charge a Credit Card" in a validation step).
3.  **Async if needed**: For extremely expensive checks, consider making the validation "Asynchronous" (e.g., returning a 202 Accepted and validating in the background).
