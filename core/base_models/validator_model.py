import sys
import threading
from functools import cached_property
from contextlib import contextmanager
from typing import Any
from django.db import models
from django.conf import settings
from django.utils import timezone
from django.core.exceptions import ValidationError
from core.base_models.permissions import PermissionPolicyMixin
from core.base_models.validators.deferred_validator import DeferredValidatorClass
from core.base_models.audit_mixin import AuditMixin
from core.base_models.exceptions import StructuralIntegrityError, OptimisticLockError

_mediator_state = threading.local()

@contextmanager
def bypass_mediator_guard():
    """Context manager to safely bypass validation guard in tests/scripts."""
    _mediator_state.bypass = True
    try:
        yield
    finally:
        _mediator_state.bypass = False

class ValidatorModelMixin:
    """
    GoF Strategy Pattern: Rule Engine for Domain Validation.
    Integrates with ValidationMediator to support context-aware rules.
    """
    _meta: Any

    @cached_property
    def _rules(self):
        rules_dict = {}
        raw_rules = list(getattr(self.__class__, "validation_rules", []))
        for rule in raw_rules:
            field_name = getattr(rule, "field_name", None)
            if field_name:
                if field_name not in rules_dict:
                    rules_dict[field_name] = []
                rules_dict[field_name].append(rule)
        
        for field in self._meta.fields:
            if field.name not in rules_dict and hasattr(field, "rules") and field.rules:
                rules_dict[field.name] = list(field.rules)
        
        class_rules = getattr(self.__class__, "_manual_rules", {})
        for field, rules in class_rules.items():
            if field not in rules_dict:
                rules_dict[field] = []
            rules_dict[field].extend(rules)
            
        return rules_dict

    def get_rule_manifest(self) -> dict:
        manifest = {}
        for field, rules in self._rules.items():
            manifest[field] = [
                {
                    "type": rule.__class__.__name__,
                    "error": rule.error_message,
                    "code": rule.error_code
                } for rule in rules
            ]
        return manifest

    def clean(self):
        super().clean()  # type: ignore


class IdentityMixin:
    """
    Industrialized Identity Protocol.
    Standardizes how a model identifies itself across the platform.
    """
    _identity_label_field = "name"
    _meta: Any
    id: Any
    pk: Any

    @property
    def identity(self) -> dict:
        label = getattr(self, self._identity_label_field, str(self))
        return {
            "id": str(self.id) if hasattr(self, 'id') else str(self.pk),
            "label": label,
            "type": self._meta.model_name,
            "display": f"{label} ({str(self.id)[:8]})" if hasattr(self, 'id') else label
        }

    @identity.setter
    def identity(self, value: Any):
        if isinstance(value, str):
            self._identity_label_field = value


class StructuralIntegrityMixin(models.Model):
    """Enforces architecture contracts on concrete models."""
    class Meta:
        abstract = True

    def __init_subclass__(cls, **kwargs):
        super().__init_subclass__(**kwargs)
        if not getattr(cls.Meta, 'abstract', False):
            if not hasattr(cls, '_meta'):
                return
            
            app_label = cls._meta.app_label
            expected_prefix = f"{app_label}_"
            legacy_whitelist = ["companies", "company_extensions", "branches", "business_units", "subscriptions", "audit_logs", "test_executions"]
            actual_table = cls._meta.db_table
            
            if actual_table not in legacy_whitelist and not actual_table.startswith(expected_prefix):
                raise ValueError(
                    f"Structural Integrity Error: Model '{cls.__name__}' defined db_table '{actual_table}'. "
                    f"To comply with the Public Contract, it MUST explicitly start with the app prefix: "
                    f"'{expected_prefix}' (e.g. db_table = '{expected_prefix}{actual_table}')"
                )

            if 'save' in cls.__dict__:
                raise TypeError(
                    f"Model '{cls.__name__}' is not allowed to override `save()`. "
                    f"To add custom save logic, override `_override_pre_save(is_creating)` or `_override_post_save(is_creating)` instead."
                )
            if 'delete' in cls.__dict__:
                raise TypeError(
                    f"Model '{cls.__name__}' is not allowed to override `delete()`. "
                    f"Override `_override_pre_delete()` or `_override_post_delete()` instead."
                )

class NumberSeriesModelMixin(models.Model):
    """
    Model Mixin for automatic Number Series sequence generation on creation.
    Hooks into pre-save lifecycle without overriding save().
    """

    _number_series_doc_type: str | None = None
    _number_series_field: str | None = None

    class Meta:
        abstract = True

    def _auto_generate_number_series(self):
        doc_type = getattr(self, "_number_series_doc_type", None)
        field_name = getattr(self, "_number_series_field", None)

        from core.base_models.services.number_series import (
            NumberSeriesRegistry,
            NumberSeriesService,
        )

        if not doc_type:
            model_name = self.__class__.__name__.lower()
            model_doc_map = {
                "requestforquotation": "rfq",
                "rfq": "rfq",
                "purchaserequest": "purchase_request",
                "pr": "purchase_request",
                "purchaseorder": "purchase_order",
                "po": "purchase_order",
                "goodsreceivednote": "grn",
                "grn": "grn",
                "purchaseinvoice": "purchase_invoice",
                "pi": "purchase_invoice",
                "salesorder": "sales_order",
                "so": "sales_order",
                "salesinvoice": "sales_invoice",
                "si": "sales_invoice",
                "deliverynote": "delivery_note",
                "dn": "delivery_note",
                "supplier": "vendor",
                "customer": "customer",
                "postransaction": "pos_transaction",
                "journalentry": "journal_entry",
                "jv": "journal_entry",
                "paymententry": "payment_entry",
                "pe": "payment_entry",
            }
            if model_name in model_doc_map:
                doc_type = model_doc_map[model_name]
            else:
                for dt, config in NumberSeriesRegistry._registry.items():
                    fname = config.get("field_name")
                    if fname and hasattr(self, fname):
                        doc_type = dt
                        field_name = fname
                        break

        if doc_type:
            if not field_name:
                field_name = NumberSeriesRegistry.get_field_name(doc_type)

            if field_name and hasattr(self, field_name) and not getattr(self, field_name):
                company = getattr(self, "company", None)
                series_number = NumberSeriesService.next(doc_type, company=company)
                setattr(self, field_name, series_number)


class CompanyCurrencyModelMixin(models.Model):
    """
    Model Mixin to auto-assign Company base currency during object creation.
    Hooks into pre-save lifecycle without overriding save().
    """

    class Meta:
        abstract = True

    def _auto_assign_currency(self):
        for field_name in ["currency", "valuation_currency"]:
            if hasattr(self, field_name) and not getattr(self, field_name):
                company_id = getattr(self, "company_id", None)
                currency_obj = None

                if company_id:
                    from apps.accounting.models.currency import CompanyCurrencySetting

                    setting = (
                        CompanyCurrencySetting.objects.filter(company_id=company_id)
                        .select_related("base_currency")
                        .first()
                    )
                    if setting and setting.base_currency:
                        currency_obj = setting.base_currency

                if not currency_obj:
                    from apps.accounting.models.currency import Currency

                    currency_obj = Currency.objects.filter(is_active=True).first()

                if currency_obj:
                    try:
                        field = self._meta.get_field(field_name)
                        if isinstance(field, models.CharField):
                            setattr(self, field_name, currency_obj.code)
                        else:
                            setattr(self, field_name, currency_obj)
                    except Exception:
                        setattr(self, field_name, currency_obj)


class LifecycleHookMixin(models.Model):
    """Provides safe pre/post save/delete hooks without overriding save."""
    class Meta:
        abstract = True

    def _override_pre_save(self, is_creating: bool): pass
    def _override_post_save(self, is_creating: bool): pass
    def _override_pre_delete(self): pass
    def _override_post_delete(self): pass

    def save(self, *args, **kwargs):
        is_creating = self._state.adding
        if is_creating:
            if hasattr(self, "_auto_generate_number_series"):
                self._auto_generate_number_series()
            if hasattr(self, "_auto_assign_currency"):
                self._auto_assign_currency()
        self._override_pre_save(is_creating)
        super().save(*args, **kwargs)
        self._override_post_save(is_creating)

    def delete(self, *args, **kwargs):
        self._override_pre_delete()
        super().delete(*args, **kwargs)
        self._override_post_delete()


class ValidationGuardMixin(models.Model):
    """Enforces that saves occur only through the ValidationMediator."""
    _validated_by_mediator = False

    class Meta:
        abstract = True

    def save(self, *args, **kwargs):
        bypass = getattr(_mediator_state, 'bypass', False) or getattr(settings, 'BYPASS_VALIDATION_GUARD', False)
        if not self._validated_by_mediator and not bypass:
             raise StructuralIntegrityError()
        super().save(*args, **kwargs)
        self._validated_by_mediator = False


class TimestampMixin(models.Model):
    """Automatically maintains created_at and updated_at."""
    created_at = models.DateTimeField(db_index=True, editable=False)
    updated_at = models.DateTimeField(db_index=True, editable=False)

    class Meta:
        abstract = True

    def save(self, *args, **kwargs):
        from core.admin.utils.integrity.time_registry import TimeRegistry
        now = TimeRegistry.get_local_now()
        if not self.pk or not self.created_at:
            self.created_at = now
        self.updated_at = now
        super().save(*args, **kwargs)


class AutoAuditLogMixin(models.Model):
    """Triggers AuditMixin logs securely after a save."""
    class Meta:
        abstract = True

    def save(self, *args, **kwargs):
        is_creating = self._state.adding
        super().save(*args, **kwargs)
        if hasattr(self, 'create_audit_log'):
            self.create_audit_log('create' if is_creating else 'update')


class OptimisticLockingMixin(models.Model):
    """Provides Optimistic Concurrency Control."""
    version = models.IntegerField(default=1)

    class Meta:
        abstract = True

    def save(self, *args, **kwargs):
        if not self._state.adding and isinstance(self.version, int):
            original_version = self.version
            self.version += 1
            
            updated = type(self)._base_manager.filter(pk=self.pk, version=original_version).update(
                version=self.version, 
                **{
                    f.name: getattr(self, f.name) 
                    for f in self._meta.fields 
                    if not f.primary_key and f.name not in ["version", "created_at"]
                }
            )
            
            if updated == 0:
                raise OptimisticLockError(
                    metadata={
                        "model": type(self).__name__,
                        "pk": str(self.pk),
                        "requested_version": original_version,
                    }
                )
            
            from django.db.models.signals import post_save
            post_save.send(sender=type(self), instance=self, created=False, update_fields=None)
        else:
            super().save(*args, **kwargs)


class BaseModel(
    StructuralIntegrityMixin,
    LifecycleHookMixin,
    NumberSeriesModelMixin,
    CompanyCurrencyModelMixin,
    ValidationGuardMixin,
    TimestampMixin,
    AutoAuditLogMixin,
    OptimisticLockingMixin,
    ValidatorModelMixin,
    IdentityMixin,
    AuditMixin,
    PermissionPolicyMixin,
    models.Model
):
    """
    Enhanced Base Model for the ERP system.
    Built with a Composite pattern using distinct mixins.
    """
    _default_ordering = ['-created_at']
    _base_permissions = (
        ('can_view_audit_logs', 'Can view audit logs'),
        ('can_export_data', 'Can export data'),
    )

    class Meta:  # type: ignore
        abstract = True


from django.db.models.signals import class_prepared

def _enforce_basemodel_meta(sender, **kwargs):
    # Avoid circular imports or issues with abstract models
    if getattr(sender._meta, 'abstract', False):
        return
        
    if issubclass(sender, BaseModel) and sender is not BaseModel:
        # 1. Merge Base Permissions dynamically from class variables
        base_perms = getattr(sender, '_base_permissions', ())
        current_perms = list(sender._meta.permissions)
        for perm in base_perms:
            if perm not in current_perms:
                current_perms.append(perm)
        sender._meta.permissions = tuple(current_perms)
        
        # 2. Merge Default Ordering
        # Allow child to define `_custom_ordering` directly on the class
        custom_ordering = getattr(sender, '_custom_ordering', None)
        if custom_ordering is not None:
            sender._meta.ordering = custom_ordering
        elif not sender._meta.ordering:
            sender._meta.ordering = getattr(sender, '_default_ordering', ['-created_at'])

class_prepared.connect(_enforce_basemodel_meta)
