from shared_domain.base.valuesets import ValueSet

ACCOUNT_ROOT_TYPE_VALUESET = ValueSet(
    code="ACCOUNT_ROOT_TYPE",
    name="Account Root Type",
    description="Fundamental financial account classification",
    items=[
        {"code": "ASSET", "label": "Asset", "is_active": True},
        {"code": "LIABILITY", "label": "Liability", "is_active": True},
        {"code": "EQUITY", "label": "Equity", "is_active": True},
        {"code": "INCOME", "label": "Income / Revenue", "is_active": True},
        {"code": "EXPENSE", "label": "Expense", "is_active": True},
    ],
)

ACCOUNT_TYPE_VALUESET = ValueSet(
    code="ACCOUNT_TYPE",
    name="Account Type",
    description="Detailed operational classification of chart of accounts",
    items=[
        {"code": "BANK", "label": "Bank Account", "is_active": True},
        {"code": "CASH", "label": "Cash Account", "is_active": True},
        {"code": "RECEIVABLE", "label": "Accounts Receivable (AR)", "is_active": True},
        {"code": "PAYABLE", "label": "Accounts Payable (AP)", "is_active": True},
        {"code": "COST_OF_GOODS_SOLD", "label": "Cost of Goods Sold (COGS)", "is_active": True},
        {"code": "STOCK_IN_HAND", "label": "Stock in Hand (Inventory)", "is_active": True},
        {"code": "DIRECT_EXPENSE", "label": "Direct Expense", "is_active": True},
        {"code": "INDIRECT_EXPENSE", "label": "Indirect Expense", "is_active": True},
        {"code": "TAX", "label": "Tax / Duty Account", "is_active": True},
        {"code": "ACCUMULATED_DEPRECIATION", "label": "Accumulated Depreciation", "is_active": True},
        {"code": "RETAINED_EARNINGS", "label": "Retained Earnings", "is_active": True},
    ],
)

JOURNAL_ENTRY_TYPE_VALUESET = ValueSet(
    code="JOURNAL_ENTRY_TYPE",
    name="Journal Entry Type",
    description="Classification of accounting journal vouchers",
    items=[
        {"code": "JOURNAL_ENTRY", "label": "Standard Journal Entry", "is_active": True},
        {"code": "OPENING_ENTRY", "label": "Opening Balance Entry", "is_active": True},
        {"code": "DEPRECIATION_ENTRY", "label": "Depreciation Entry", "is_active": True},
        {"code": "BANK_ENTRY", "label": "Bank Transaction", "is_active": True},
        {"code": "CASH_ENTRY", "label": "Cash Transaction", "is_active": True},
        {"code": "CREDIT_NOTE", "label": "Credit Note", "is_active": True},
        {"code": "DEBIT_NOTE", "label": "Debit Note", "is_active": True},
    ],
)

PAYMENT_TYPE_VALUESET = ValueSet(
    code="PAYMENT_TYPE",
    name="Payment Type",
    description="Direction of payment entries",
    items=[
        {"code": "RECEIVE", "label": "Payment Received (Customer)", "is_active": True},
        {"code": "PAY", "label": "Payment Sent (Vendor)", "is_active": True},
        {"code": "INTERNAL_TRANSFER", "label": "Internal Bank/Cash Transfer", "is_active": True},
    ],
)
