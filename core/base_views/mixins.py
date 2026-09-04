import logging
from typing import Any

logger = logging.getLogger(__name__)


class NumberSeriesInjectionMixin:
    """
    API View Mixin: Automatically injects sequential document numbers/codes
    into request payloads during `pre_create` if omitted by API clients.
    """

    document_type: str | None = None
    number_series_field: str | None = None

    def inject_number_series(self, request, data: Any) -> Any:
        if not isinstance(data, dict):
            return data

        doc_type = getattr(self, "document_type", None)
        if not doc_type and hasattr(self, "model") and self.model:
            doc_type = getattr(self.model, "_number_series_doc_type", None)

        if doc_type:
            from core.base_models.services.number_series import (
                NumberSeriesRegistry,
                NumberSeriesService,
            )

            field_name = getattr(
                self, "number_series_field", None
            ) or NumberSeriesRegistry.get_field_name(doc_type)

            if field_name and not data.get(field_name):
                company_id = (
                    request.session.get("company_id")
                    if hasattr(request, "session")
                    else None
                )

                company = None
                if company_id:
                    from core.admin.models.admin import Company

                    company = Company.objects.filter(pk=company_id).first()

                data[field_name] = NumberSeriesService.next(doc_type, company=company)
                logger.debug(
                    f"[NumberSeriesInjectionMixin] Injected {field_name}={data[field_name]} for {doc_type}"
                )

        return data

    def pre_create(self, request, data):
        parent_pre_create = getattr(super(), "pre_create", None)
        if callable(parent_pre_create):
            data = parent_pre_create(request, data)
        return self.inject_number_series(request, data)


class CurrencyInjectionMixin:
    """
    API View Mixin: Automatically injects default or tenant base currency
    into request payloads during `pre_create` if omitted by API clients.
    """

    currency_field: str = "currency"

    def inject_currency(self, request, data: Any) -> Any:
        if not isinstance(data, dict):
            return data

        field_name = getattr(self, "currency_field", "currency")
        if field_name and not data.get(field_name):
            company_id = (
                request.session.get("company_id")
                if hasattr(request, "session")
                else None
            )
            currency_code = None

            if company_id:
                from apps.accounting.models.currency import CompanyCurrencySetting

                setting = (
                    CompanyCurrencySetting.objects.filter(company_id=company_id)
                    .select_related("base_currency")
                    .first()
                )
                if setting and setting.base_currency:
                    currency_code = setting.base_currency.code

            if not currency_code:
                from apps.accounting.models.currency import Currency

                default_curr = Currency.objects.filter(is_active=True).first()
                if default_curr:
                    currency_code = default_curr.code

            if currency_code:
                data[field_name] = currency_code
                logger.debug(f"[CurrencyInjectionMixin] Injected {field_name}={currency_code}")

        return data

    def pre_create(self, request, data):
        parent_pre_create = getattr(super(), "pre_create", None)
        if callable(parent_pre_create):
            data = parent_pre_create(request, data)
        return self.inject_currency(request, data)
