# apps/accounting/providers.py
"""
AccountingCurrencyProvider — Concrete implementation of ICurrencyProvider.
Registers with core.registry.provider_registry.ProviderRegistry at startup.
"""

from typing import Any

from core.registry.provider_registry import ICurrencyProvider


class AccountingCurrencyProvider(ICurrencyProvider):
    def get_base_currency(self, company_id: Any) -> Any | None:
        from apps.accounting.models.currency import CompanyCurrencySetting

        setting = (
            CompanyCurrencySetting.objects.filter(company_id=company_id)
            .select_related("base_currency")
            .first()
        )
        return setting.base_currency if setting else None

    def get_default_currency(self) -> Any | None:
        from apps.accounting.models.currency import Currency

        return Currency.objects.filter(is_active=True).first()

    def get_currency_by_code(self, code: str) -> Any | None:
        from apps.accounting.models.currency import Currency

        return Currency.objects.filter(code=code).first()
