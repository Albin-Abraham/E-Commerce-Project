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
                company_id = None
                if hasattr(request, "session"):
                    company_id = request.session.get("company_id")
                if not company_id:
                    from core.admin.utils.context import RequestContext

                    company_id = RequestContext.get_company_id()

                company = None
                if company_id:
                    from core.admin.models.company import Company

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
            company_id = None
            if hasattr(request, "session"):
                company_id = request.session.get("company_id")
            if not company_id:
                from core.admin.utils.context import RequestContext

                company_id = RequestContext.get_company_id()
            currency_code = None

            from core.registry.provider_registry import ProviderRegistry

            provider = ProviderRegistry.get_currency_provider()
            if provider:
                if company_id:
                    base_curr = provider.get_base_currency(company_id)
                    if base_curr:
                        currency_code = getattr(base_curr, "code", str(base_curr))
                if not currency_code:
                    default_curr = provider.get_default_currency()
                    if default_curr:
                        currency_code = getattr(default_curr, "code", str(default_curr))

            if currency_code:
                data[field_name] = currency_code
                logger.debug(f"[CurrencyInjectionMixin] Injected {field_name}={currency_code}")

        return data

    def pre_create(self, request, data):
        parent_pre_create = getattr(super(), "pre_create", None)
        if callable(parent_pre_create):
            data = parent_pre_create(request, data)
        return self.inject_currency(request, data)
