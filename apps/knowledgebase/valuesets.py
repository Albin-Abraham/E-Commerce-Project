from shared_domain.base.valuesets import ValueSet, ValueSetItem, ValueSetRegistry

ARTICLE_STATUS_VALUESET = ValueSet(
    name="kb_article_status",
    domain="knowledgebase",
    items=[
        ValueSetItem(code="DRAFT", label="Draft"),
        ValueSetItem(code="PUBLISHED", label="Published"),
        ValueSetItem(code="ARCHIVED", label="Archived"),
    ],
)
ValueSetRegistry.register(ARTICLE_STATUS_VALUESET)

LINK_TYPE_VALUESET = ValueSet(
    name="product_knowledge_link_type",
    domain="knowledgebase",
    items=[
        ValueSetItem(code="USER_MANUAL", label="User Manual"),
        ValueSetItem(code="TROUBLESHOOTING", label="Troubleshooting Guide"),
        ValueSetItem(code="CASHIER_PITCH", label="POS Cashier Sales Pitch"),
        ValueSetItem(code="COMPLIANCE_CERT", label="Procurement Compliance Certificate"),
        ValueSetItem(code="ASSEMBLY_BOM", label="Assembly / BOM Diagram"),
        ValueSetItem(code="SPEC_SHEET", label="Technical Spec Sheet"),
    ],
)
ValueSetRegistry.register(LINK_TYPE_VALUESET)
