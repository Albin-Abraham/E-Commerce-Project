from enum import StrEnum
from core.registry.variable_registry import DomainVariableRegistry


class AccountingVariableKey(StrEnum):
    """
    App-Scoped Variable Keys for Accounting Module.
    """
    GROSS_AMOUNT = "gross_amount"
    NET_AMOUNT = "net_amount"
    TAX_AMOUNT = "tax_amount"
    GRAND_TOTAL = "grand_total"
    PAID_AMOUNT = "paid_amount"
    OUTSTANDING_AMOUNT = "outstanding_amount"


DomainVariableRegistry.register_app_variables("accounting", AccountingVariableKey)
