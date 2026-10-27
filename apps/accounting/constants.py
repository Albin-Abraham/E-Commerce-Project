from enum import StrEnum


class AccountingKeys(StrEnum):
    VOUCHER_JOURNAL_ENTRY = "Journal Entry"
    VOUCHER_PAYMENT_ENTRY = "Payment Entry"
    VOUCHER_GRN = "Goods Received Note"
    ACCOUNT_TYPE_ASSET = "ASSET"
    ACCOUNT_TYPE_LIABILITY = "LIABILITY"
    ACCOUNT_TYPE_EQUITY = "EQUITY"
    ACCOUNT_TYPE_INCOME = "INCOME"
    ACCOUNT_TYPE_EXPENSE = "EXPENSE"
    PAYMENT_TYPE_RECEIVE = "RECEIVE"
    PAYMENT_TYPE_PAY = "PAY"
    GROSS_AMOUNT = "gross_amount"
    NET_AMOUNT = "net_amount"
    TAX_AMOUNT = "tax_amount"
    GRAND_TOTAL = "grand_total"
    PAID_AMOUNT = "paid_amount"
    OUTSTANDING_AMOUNT = "outstanding_amount"
