from shared_domain.base.valuesets import ValueSet, ValueSetItem

ACCOUNT_ROOT_TYPE_VALUESET = ValueSet(
    name="ACCOUNT_ROOT_TYPE",
    domain="accounting",
    description="Fundamental financial account classification",
    items=[
        ValueSetItem(code="ASSET", label="Asset", is_active=True),
        ValueSetItem(code="LIABILITY", label="Liability", is_active=True),
        ValueSetItem(code="EQUITY", label="Equity", is_active=True),
        ValueSetItem(code="INCOME", label="Income / Revenue", is_active=True),
        ValueSetItem(code="EXPENSE", label="Expense", is_active=True),
    ],
)

ACCOUNT_TYPE_VALUESET = ValueSet(
    name="ACCOUNT_TYPE",
    domain="accounting",
    description="Detailed operational classification of chart of accounts",
    items=[
        ValueSetItem(code="BANK", label="Bank Account", is_active=True),
        ValueSetItem(code="CASH", label="Cash Account", is_active=True),
        ValueSetItem(code="RECEIVABLE", label="Accounts Receivable (AR)", is_active=True),
        ValueSetItem(code="PAYABLE", label="Accounts Payable (AP)", is_active=True),
        ValueSetItem(code="COST_OF_GOODS_SOLD", label="Cost of Goods Sold (COGS)", is_active=True),
        ValueSetItem(code="STOCK_IN_HAND", label="Stock in Hand (Inventory)", is_active=True),
        ValueSetItem(code="DIRECT_EXPENSE", label="Direct Expense", is_active=True),
        ValueSetItem(code="INDIRECT_EXPENSE", label="Indirect Expense", is_active=True),
        ValueSetItem(code="TAX", label="Tax / Duty Account", is_active=True),
        ValueSetItem(code="ACCUMULATED_DEPRECIATION", label="Accumulated Depreciation", is_active=True),
        ValueSetItem(code="RETAINED_EARNINGS", label="Retained Earnings", is_active=True),
    ],
)

JOURNAL_ENTRY_TYPE_VALUESET = ValueSet(
    name="JOURNAL_ENTRY_TYPE",
    domain="accounting",
    description="Classification of accounting journal vouchers",
    items=[
        ValueSetItem(code="JOURNAL_ENTRY", label="Standard Journal Entry", is_active=True),
        ValueSetItem(code="OPENING_ENTRY", label="Opening Balance Entry", is_active=True),
        ValueSetItem(code="DEPRECIATION_ENTRY", label="Depreciation Entry", is_active=True),
        ValueSetItem(code="BANK_ENTRY", label="Bank Transaction", is_active=True),
        ValueSetItem(code="CASH_ENTRY", label="Cash Transaction", is_active=True),
        ValueSetItem(code="CREDIT_NOTE", label="Credit Note", is_active=True),
        ValueSetItem(code="DEBIT_NOTE", label="Debit Note", is_active=True),
    ],
)

PAYMENT_TYPE_VALUESET = ValueSet(
    name="PAYMENT_TYPE",
    domain="accounting",
    description="Direction of payment entries",
    items=[
        ValueSetItem(code="RECEIVE", label="Payment Received (Customer)", is_active=True),
        ValueSetItem(code="PAY", label="Payment Sent (Vendor)", is_active=True),
        ValueSetItem(code="INTERNAL_TRANSFER", label="Internal Bank/Cash Transfer", is_active=True),
    ],
)

