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

CHARGE_TYPE_VALUESET = ValueSet(
    name="CHARGE_TYPE",
    domain="accounting",
    description="Direction a charge affects a transaction grand total",
    items=[
        ValueSetItem(code="ADDITIONAL", label="Additional / Surcharge (Adds To Total)", is_active=True),
        ValueSetItem(code="DISCOUNT", label="Discount (Reduces Total)", is_active=True),
        ValueSetItem(code="TAX_SURCHARGE", label="Tax Surcharge (Levied With Tax)", is_active=True),
    ],
)

CHARGE_BASED_ON_VALUESET = ValueSet(
    name="CHARGE_BASED_ON",
    domain="accounting",
    description="Basis used to compute a charge amount from a definition",
    items=[
        ValueSetItem(code="FIXED_AMOUNT", label="Fixed Amount", is_active=True),
        ValueSetItem(code="PERCENTAGE", label="Percentage Of Document Total", is_active=True),
        ValueSetItem(code="PER_UNIT", label="Fixed Amount Per Unit", is_active=True),
    ],
)

CHARGE_SCOPE_VALUESET = ValueSet(
    name="CHARGE_SCOPE",
    domain="accounting",
    description="Document types a charge definition may be applied to",
    items=[
        ValueSetItem(code="ALL", label="All Documents", is_active=True),
        ValueSetItem(code="SALES_ORDER", label="Sales Orders", is_active=True),
        ValueSetItem(code="PURCHASE_ORDER", label="Purchase Orders", is_active=True),
        ValueSetItem(code="SALES_INVOICE", label="Sales Invoices", is_active=True),
        ValueSetItem(code="PURCHASE_INVOICE", label="Purchase Invoices", is_active=True),
        ValueSetItem(code="POS", label="POS Transactions", is_active=True),
        ValueSetItem(code="SHOP_ORDER", label="E-Commerce Shop Orders", is_active=True),
    ],
)

DISCOUNT_TYPE_VALUESET = ValueSet(
    name="DISCOUNT_TYPE",
    domain="accounting",
    description="How a discount configuration computes its discount",
    items=[
        ValueSetItem(code="PERCENTAGE", label="Percentage Of Subtotal", is_active=True),
        ValueSetItem(code="FIXED_AMOUNT", label="Fixed Amount", is_active=True),
    ],
)

DISCOUNT_OPERATOR_VALUESET = ValueSet(
    name="DISCOUNT_OPERATOR",
    domain="accounting",
    description="Comparator evaluating a runtime attribute against a condition value",
    items=[
        ValueSetItem(code="EQUAL_TO", label="Equal To", is_active=True),
        ValueSetItem(code="NOT_EQUAL_TO", label="Not Equal To", is_active=True),
        ValueSetItem(code="GREATER_THAN", label="Greater Than", is_active=True),
        ValueSetItem(code="LESS_THAN", label="Less Than", is_active=True),
        ValueSetItem(code="GREATER_THAN_OR_EQUAL", label="Greater Than Or Equal To", is_active=True),
        ValueSetItem(code="LESS_THAN_OR_EQUAL", label="Less Than Or Equal To", is_active=True),
        ValueSetItem(code="BETWEEN", label="Between Value 1 And Value 2", is_active=True),
    ],
)

TAX_PACK_DIRECTION_VALUESET = ValueSet(
    name="TAX_PACK_DIRECTION",
    domain="accounting",
    description="Which sales/purchase side a tax pack applies to within its branch/country",
    items=[
        ValueSetItem(code="SALES", label="Sales Taxes", is_active=True),
        ValueSetItem(code="PURCHASE", label="Purchase Taxes", is_active=True),
        ValueSetItem(code="ITEM", label="Item Taxes", is_active=True),
        ValueSetItem(code="BOTH", label="Sales And Purchase", is_active=True),
    ],
)

TAX_JURISDICTION_VALUESET = ValueSet(
    name="TAX_JURISDICTION",
    domain="accounting",
    description="Governing jurisdiction of a tax code (federal, state, local)",
    items=[
        ValueSetItem(code="FEDERAL", label="Federal / National", is_active=True),
        ValueSetItem(code="STATE", label="State / Province / Emirate", is_active=True),
        ValueSetItem(code="LOCAL", label="Local / Municipal", is_active=True),
    ],
)

TAX_PACK_GROUP_VALUESET = ValueSet(
    name="TAX_PACK_GROUP",
    domain="accounting",
    description="Structural grouping of components inside a tax pack",
    items=[
        ValueSetItem(code="FEDERAL", label="Federal Group", is_active=True),
        ValueSetItem(code="STATE", label="State Group", is_active=True),
        ValueSetItem(code="LOCAL", label="Local Group", is_active=True),
        ValueSetItem(code="ENVIRONMENTAL", label="Environmental / Fee", is_active=True),
        ValueSetItem(code="EXEMPT", label="Exempt / Zero Rated", is_active=True),
        ValueSetItem(code="OTHER", label="Other Group", is_active=True),
    ],
)

