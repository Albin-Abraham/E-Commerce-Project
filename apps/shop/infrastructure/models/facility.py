from django.db import models
from core.base_models.validator_model import BaseModel
from core.base_models.fields.short_ui_fields import CustomShortUUIDField
from core.base_models.fields.char_fields import CustomCharField, CustomTextField
from core.base_models.validators.rules import RequiredRule, UniqueRule
from apps.shop.valuesets import (
    FACILITY_TYPE_VALUESET,
    LOCATION_TYPE_VALUESET,
)


class Facility(BaseModel):
    """
    Physical or Virtual Facility Entity (Fulfillment Centers, Warehouses, Dark Stores, Retail Stores).
    Provides location-level and org-level scoping for logistics and inventory.
    """

    id = CustomShortUUIDField(primary_key=True, prefix="fac_")
    facility_code = CustomCharField(
        max_length=50,
        rules=[RequiredRule("facility_code"), UniqueRule("facility_code")],
        help_text="Unique facility code e.g. FC-NY-01, WH-DEL-02",
    )
    name = CustomCharField(
        max_length=200,
        rules=[RequiredRule("name")],
        help_text="Facility display name",
    )
    facility_type = models.CharField(
        max_length=30,
        choices=FACILITY_TYPE_VALUESET.as_django_choices(),
        default="WAREHOUSE",
    )
    company = models.ForeignKey(
        "core_admin.Company",
        on_delete=models.CASCADE,
        related_name="facilities",
    )
    branch = models.ForeignKey(
        "core_admin.Branch",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="facilities",
    )
    address = CustomTextField(nullable=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    serviceable_pincodes = models.JSONField(default=list, blank=True, help_text="List of pincodes serviced by this facility")
    capabilities = models.JSONField(
        default=dict,
        blank=True,
        help_text="Dynamic facility capabilities e.g. {'same_day_delivery': true, 'has_cold_storage': true, 'max_weight_kg': 1000}",
    )
    operating_hours = models.JSONField(
        default=dict,
        blank=True,
        help_text="Operating hours & shift schedule e.g. {'mon_fri': '08:00-22:00', 'sat_sun': '09:00-18:00'}",
    )
    metadata = models.JSONField(default=dict, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta(BaseModel.Meta):
        db_table = "shop_facilities"
        ordering = ["facility_code"]
        verbose_name = "Facility"
        verbose_name_plural = "Facilities"

    def __str__(self):
        return f"{self.name} ({self.facility_code})"


class StorageLocation(BaseModel):
    """
    Sub-location Hierarchy within a Facility (Zone, Aisle, Rack, Shelf, Bin).
    """

    id = CustomShortUUIDField(primary_key=True, prefix="loc_")
    facility = models.ForeignKey(
        Facility,
        on_delete=models.CASCADE,
        related_name="storage_locations",
    )
    location_code = CustomCharField(
        max_length=50,
        rules=[RequiredRule("location_code")],
        help_text="e.g. ZONE-A, AISLE-12, BIN-B04",
    )
    location_type = models.CharField(
        max_length=30,
        choices=LOCATION_TYPE_VALUESET.as_django_choices(),
        default="BIN",
    )
    parent = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="sub_locations",
    )
    is_active = models.BooleanField(default=True)

    class Meta(BaseModel.Meta):
        db_table = "shop_storage_locations"
        ordering = ["facility", "location_code"]
        verbose_name = "Storage Location"
        verbose_name_plural = "Storage Locations"
        unique_together = [("facility", "location_code")]

    def __str__(self):
        return f"{self.facility.facility_code} -> {self.location_code} ({self.location_type})"


class FacilityInventory(BaseModel):
    """
    Location and Facility Level Inventory Stock Scoping.
    Tracks physical on-hand stock, active checkout reservations, available-to-promise (ATP),
    and in-transit quantities per Facility and Storage Location.
    """

    id = CustomShortUUIDField(primary_key=True, prefix="finv_")
    facility = models.ForeignKey(
        Facility,
        on_delete=models.CASCADE,
        related_name="inventory_records",
    )
    storage_location = models.ForeignKey(
        StorageLocation,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="inventory_records",
    )
    product = models.ForeignKey(
        "shop.Product",
        on_delete=models.CASCADE,
        related_name="facility_inventory",
    )
    variant = models.ForeignKey(
        "shop.ProductVariant",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="facility_inventory",
    )
    quantity_on_hand = models.IntegerField(default=0, help_text="Total physical stock count in facility")
    quantity_reserved = models.IntegerField(default=0, help_text="Stock reserved for active checkout/orders")
    quantity_in_transit = models.IntegerField(default=0, help_text="Stock currently being transferred")
    reorder_level = models.IntegerField(default=10, help_text="Minimum stock threshold before reorder trigger")
    reorder_quantity = models.IntegerField(default=50, help_text="Standard replenishment reorder quantity")

    class Meta(BaseModel.Meta):
        db_table = "shop_facility_inventory"
        verbose_name = "Facility Inventory Record"
        verbose_name_plural = "Facility Inventory Records"
        unique_together = [("facility", "storage_location", "product", "variant")]

    @property
    def quantity_available(self) -> int:
        """
        Available-to-Promise (ATP) Inventory: Physical Stock - Reserved Stock.
        """
        return max(0, self.quantity_on_hand - self.quantity_reserved)

    def __str__(self):
        return f"Inventory [{self.facility.facility_code}] {self.product.name}: On-Hand {self.quantity_on_hand}, Avail {self.quantity_available}"
