# core/base_models/scoping_models.py
from django.db import models
from django.conf import settings

class TenantModelMixin(models.Model):
    """
    Mixin to add company-level isolation to models.
    """
    company = models.ForeignKey(
        "core_admin.Company",
        on_delete=models.CASCADE,
        related_name="%(class)s_related",
        db_index=True,
        null=True,
        blank=True
    )

    class Meta:
        abstract = True


class BusinessUnitModelMixin(TenantModelMixin):
    """
    Mixin to add business unit-level isolation (nested under company).
    """
    business_unit = models.ForeignKey(
        "core_admin.BusinessUnit",
        on_delete=models.CASCADE,
        related_name="%(class)s_related",
        db_index=True,
        null=True,
        blank=True
    )

    class Meta(TenantModelMixin.Meta):
        abstract = True


class BranchModelMixin(BusinessUnitModelMixin):
    """
    Mixin to add branch-level isolation (nested under business unit).
    """
    branch = models.ForeignKey(
        "core_admin.Branch",
        on_delete=models.CASCADE,
        related_name="%(class)s_related",
        db_index=True,
        null=True,
        blank=True
    )

    class Meta(BusinessUnitModelMixin.Meta):
        abstract = True
