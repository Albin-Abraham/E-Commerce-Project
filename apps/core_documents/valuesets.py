from shared_domain.base.valuesets import ValueSet, ValueSetItem, ValueSetRegistry

DOCUMENT_STATUS_VALUESET = ValueSet(
    name="document_status",
    domain="core_documents",
    items=[
        ValueSetItem(code="DRAFT", label="Draft"),
        ValueSetItem(code="SUBMITTED", label="Submitted"),
        ValueSetItem(code="UNDER_REVIEW", label="Under Review"),
        ValueSetItem(code="APPROVED", label="Approved"),
        ValueSetItem(code="REJECTED", label="Rejected"),
    ],
)
ValueSetRegistry.register(DOCUMENT_STATUS_VALUESET)

WORKFLOW_STATUS_VALUESET = ValueSet(
    name="document_workflow_status",
    domain="core_documents",
    items=[
        ValueSetItem(code="PENDING", label="Pending"),
        ValueSetItem(code="APPROVED", label="Approved"),
        ValueSetItem(code="REJECTED", label="Rejected"),
    ],
)
ValueSetRegistry.register(WORKFLOW_STATUS_VALUESET)

LEVEL_STATUS_VALUESET = ValueSet(
    name="document_level_status",
    domain="core_documents",
    items=[
        ValueSetItem(code="PENDING", label="Pending"),
        ValueSetItem(code="APPROVED", label="Approved"),
        ValueSetItem(code="REJECTED", label="Rejected"),
    ],
)
ValueSetRegistry.register(LEVEL_STATUS_VALUESET)

APPROVAL_ACTION_VALUESET = ValueSet(
    name="approval_action",
    domain="core_documents",
    items=[
        ValueSetItem(code="APPROVED", label="Approved"),
        ValueSetItem(code="REJECTED", label="Rejected"),
    ],
)
ValueSetRegistry.register(APPROVAL_ACTION_VALUESET)
