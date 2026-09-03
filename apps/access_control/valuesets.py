from shared_domain.base.valuesets import ValueSet, ValueSetItem, ValueSetRegistry

POLICY_EFFECT_VALUESET = ValueSet(
    name="policy_effect",
    domain="access_control",
    items=[
        ValueSetItem(code="allow", label="Allow"),
        ValueSetItem(code="deny", label="Deny"),
    ],
)
ValueSetRegistry.register(POLICY_EFFECT_VALUESET)

POLICY_CONFIG_STATUS_VALUESET = ValueSet(
    name="policy_config_status",
    domain="access_control",
    items=[
        ValueSetItem(code="draft", label="Draft"),
        ValueSetItem(code="pending_approval", label="Pending Approval"),
        ValueSetItem(code="active", label="Active"),
        ValueSetItem(code="archived", label="Archived"),
    ],
)
ValueSetRegistry.register(POLICY_CONFIG_STATUS_VALUESET)

AUTO_SET_ACTION_VALUESET = ValueSet(
    name="auto_set_action",
    domain="access_control",
    items=[
        ValueSetItem(code="null", label="Level Based"),
        ValueSetItem(code="approve", label="Auto Approve"),
        ValueSetItem(code="reject", label="Auto Reject"),
    ],
)
ValueSetRegistry.register(AUTO_SET_ACTION_VALUESET)

APPROVAL_BY_VALUESET = ValueSet(
    name="approval_by_type",
    domain="access_control",
    items=[
        ValueSetItem(code="specific_user", label="Specific User"),
        ValueSetItem(code="role", label="Role"),
    ],
)
ValueSetRegistry.register(APPROVAL_BY_VALUESET)

APPROVAL_ACTION_TYPE_VALUESET = ValueSet(
    name="approval_action_type",
    domain="access_control",
    items=[
        ValueSetItem(code="none", label="Do Nothing"),
        ValueSetItem(code="auto_approve", label="Auto Approve"),
        ValueSetItem(code="auto_reject", label="Auto Reject"),
        ValueSetItem(code="escalate", label="Escalate to Next Level"),
    ],
)
ValueSetRegistry.register(APPROVAL_ACTION_TYPE_VALUESET)

APPROVAL_REQUEST_STATUS_VALUESET = ValueSet(
    name="approval_request_status",
    domain="access_control",
    items=[
        ValueSetItem(code="pending", label="Pending"),
        ValueSetItem(code="approved", label="Approved"),
        ValueSetItem(code="rejected", label="Rejected"),
        ValueSetItem(code="cancelled", label="Cancelled"),
        ValueSetItem(code="escalated", label="Escalated"),
    ],
)
ValueSetRegistry.register(APPROVAL_REQUEST_STATUS_VALUESET)

APPROVAL_ACTION_CHOICES_VALUESET = ValueSet(
    name="approval_action_choices",
    domain="access_control",
    items=[
        ValueSetItem(code="approve", label="Approve"),
        ValueSetItem(code="reject", label="Reject"),
        ValueSetItem(code="escalate", label="Escalate"),
        ValueSetItem(code="comment", label="Comment"),
    ],
)
ValueSetRegistry.register(APPROVAL_ACTION_CHOICES_VALUESET)
