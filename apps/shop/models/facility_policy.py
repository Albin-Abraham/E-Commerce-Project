from django.db import models
from core.base_models.validator_model import BaseModel
from core.base_models.fields.short_ui_fields import CustomShortUUIDField
from core.base_models.fields.char_fields import CustomCharField, CustomTextField
from core.base_models.validators.rules import RequiredRule, UniqueRule
from shared_domain.base.valuesets import ValueSet

DELIVERY_PARTNER_TYPE_VALUESET = ValueSet(
    code="DELIVERY_PARTNER_TYPE",
    name="Delivery Partner Type",
    description="Classification of logistics delivery partners and courier fleets",
    items=[
        {"code": "IN_HOUSE", "label": "In-House Delivery Fleet", "is_active": True},
        {"code": "EXPRESS_COURIER", "label": "Express Courier (Same-Day / 30-Min)", "is_active": True},
        {"code": "NATIONAL_CARRIER", "label": "National 3PL Carrier (FedEx/DHL)", "is_active": True},
        {"code": "HYPERLOCAL", "label": "Hyperlocal Bike / EV Courier", "is_active": True},
        {"code": "COLD_CHAIN", "label": "Cold Chain Refrigerated Fleet", "is_active": True},
    ],
)


class DeliveryPartner(BaseModel):
    """
    Logistics Delivery Partner / Courier Fleet Entity.
    Defines SLAs, weight limits, pincode coverage, and API integration settings.
    """

    id = CustomShortUUIDField(primary_key=True, prefix="partner_")
    name = CustomCharField(
        max_length=150,
        rules=[RequiredRule("name"), UniqueRule("name")],
        help_text="e.g. FedEx Express, DHL Supply Chain, Hyperlocal Fleet",
    )
    partner_code = CustomCharField(
        max_length=50,
        rules=[RequiredRule("partner_code"), UniqueRule("partner_code")],
    )
    company = models.ForeignKey(
        "core_admin.Company",
        on_delete=models.CASCADE,
        related_name="delivery_partners",
    )
    partner_type = models.CharField(
        max_length=30,
        choices=DELIVERY_PARTNER_TYPE_VALUESET.as_django_choices(),
        default="NATIONAL_CARRIER",
    )
    max_weight_capacity_kg = models.DecimalField(max_digits=8, decimal_places=2, default=50.0)
    requires_cold_chain = models.BooleanField(default=False)
    supported_pincodes = models.JSONField(default=list, blank=True)
    cutoff_time = models.TimeField(null=True, blank=True, help_text="Daily order dispatch cutoff time e.g. 17:00")
    api_config = models.JSONField(default=dict, blank=True, help_text="Tracking & Booking API Credentials")
    is_active = models.BooleanField(default=True)

    class Meta(BaseModel.Meta):
        db_table = "shop_delivery_partners"
        ordering = ["name"]
        verbose_name = "Delivery Partner"
        verbose_name_plural = "Delivery Partners"

    def __str__(self):
        return f"{self.name} ({self.partner_type})"


class FacilityPolicyRule(BaseModel):
    """
    Infrastructure Facility Policy Rules & Pre-Allocation Constraints.
    Validates weight, hazardous material, cold storage, cutoff time, and delivery partner rules
    before an order can be assigned or dispatched.
    """

    id = CustomShortUUIDField(primary_key=True, prefix="fpol_")
    rule_name = CustomCharField(
        max_length=150,
        rules=[RequiredRule("rule_name")],
        help_text="e.g. Cold Storage Mandatory Policy, Max Weight 50kg Limit",
    )
    facility = models.ForeignKey(
        "shop.Facility",
        on_delete=models.CASCADE,
        related_name="policy_rules",
        null=True,
        blank=True,
        help_text="Null applies rule globally to all facilities",
    )
    delivery_partner = models.ForeignKey(
        DeliveryPartner,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="facility_policy_rules",
    )
    max_order_weight_kg = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    requires_cold_storage = models.BooleanField(default=False)
    allow_hazmat = models.BooleanField(default=True)
    dispatch_cutoff_time = models.TimeField(null=True, blank=True)
    policy_conditions = models.JSONField(
        default=dict,
        blank=True,
        help_text="Custom rule evaluation conditions JSON e.g. {'min_order_value': 100}",
    )
    is_active = models.BooleanField(default=True)

    class Meta(BaseModel.Meta):
        db_table = "shop_facility_policy_rules"
        ordering = ["rule_name"]
        verbose_name = "Facility Policy Rule"
        verbose_name_plural = "Facility Policy Rules"

    def __str__(self):
        return f"{self.rule_name} [{self.facility.facility_code if self.facility else 'GLOBAL'}]"
