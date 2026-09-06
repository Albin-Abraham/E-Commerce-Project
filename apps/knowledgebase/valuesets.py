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
        ValueSetItem(code="USER_MANUAL", label="User Manual", metadata={"section": "descriptions"}),
        ValueSetItem(code="TROUBLESHOOTING", label="Troubleshooting Guide", metadata={"section": "descriptions"}),
        ValueSetItem(code="CASHIER_PITCH", label="POS Cashier Sales Pitch", metadata={"section": "cashier_pitches"}),
        ValueSetItem(code="COMPLIANCE_CERT", label="Procurement Compliance Certificate", metadata={"section": "compliance_certificates"}),
        ValueSetItem(code="ASSEMBLY_BOM", label="Assembly / BOM Diagram", metadata={"section": "assembly_diagrams"}),
        ValueSetItem(code="SPEC_SHEET", label="Technical Spec Sheet", metadata={"section": "specifications"}),
        ValueSetItem(code="FACILITY_SOP", label="Facility Standard Operating Procedure (SOP)", metadata={"section": "descriptions"}),
        ValueSetItem(code="BIN_SAFETY_RULE", label="Storage Location & Bin Safety Rules", metadata={"section": "descriptions"}),
        ValueSetItem(code="HAZMAT_HANDLING", label="Hazardous Material Handling Guide", metadata={"section": "descriptions"}),
    ],
)
ValueSetRegistry.register(LINK_TYPE_VALUESET)
