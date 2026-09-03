import math
from dataclasses import dataclass, field
from django.db.models import F
from decimal import Decimal
from apps.shop.infrastructure.models.facility import Facility, FacilityInventory
from apps.shop.services.facility_policy_engine import FacilityPolicyEngine
from apps.shop.models.facility_policy import DeliveryPartner


@dataclass
class AllocationItem:
    product_id: str
    variant_id: str | None
    requested_qty: int
    allocated_qty: int
    facility_id: str
    facility_code: str


@dataclass
class FacilityAllocationResult:
    is_fully_allocated: bool
    serviceable_pincode: str
    allocations: list[AllocationItem] = field(default_factory=list)
    unallocated_items: list[dict] = field(default_factory=list)


class DynamicFacilityRouter:
    """
    Dynamic Facility Router & Multi-Location Stock Allocation Engine.
    Matches customer location (pincode/geolocation) against facility serviceability,
    evaluates policy constraints & delivery partner SLAs, and splits orders dynamically.
    """

    @classmethod
    def calculate_haversine_distance(cls, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """
        Calculates distance in kilometers between two GPS coordinates using Haversine formula.
        """
        R = 6371.0  # Earth radius in KM
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return R * c

    @classmethod
    def get_serviceable_facilities(cls, company_id: str, pincode: str | None = None, lat: float | None = None, lng: float | None = None) -> list[Facility]:
        """
        Retrieves active facilities servicing a given pincode or sorted by proximity (lat/lng).
        """
        qs = Facility.objects.filter(company_id=company_id, is_active=True)

        if pincode:
            facilities = [f for f in qs if not f.serviceable_pincodes or pincode in f.serviceable_pincodes]
        else:
            facilities = list(qs)

        if lat is not None and lng is not None:

            def distance_key(fac):
                if fac.latitude is not None and fac.longitude is not None:
                    return cls.calculate_haversine_distance(float(lat), float(lng), float(fac.latitude), float(fac.longitude))
                return 999999.0

            facilities.sort(key=distance_key)

        return facilities

    @classmethod
    def allocate_order(
        cls,
        company_id: str,
        target_pincode: str | None,
        items: list[dict],
        lat: float | None = None,
        lng: float | None = None,
        order_weight_kg: Decimal = Decimal("0.00"),
        requires_cold_storage: bool = False,
        is_hazmat: bool = False,
        delivery_partner: DeliveryPartner | None = None,
    ) -> FacilityAllocationResult:
        """
        Dynamically allocates stock for an order across candidate facilities.
        Validates facility policy rules & delivery partner access controls before allocation.
        """
        candidate_facilities = cls.get_serviceable_facilities(company_id, target_pincode, lat, lng)
        if not candidate_facilities:
            return FacilityAllocationResult(
                is_fully_allocated=False,
                serviceable_pincode=target_pincode or "",
                allocations=[],
                unallocated_items=items,
            )

        allocations = []
        unallocated = []

        for item in items:
            prod_id = item["product_id"]
            var_id = item.get("variant_id")
            required_qty = item["quantity"]
            remaining_qty = required_qty

            for fac in candidate_facilities:
                # Validate Facility Policy Gatekeeper before evaluating stock
                policy_eval = FacilityPolicyEngine.evaluate_facility(
                    facility=fac,
                    order_weight_kg=order_weight_kg,
                    requires_cold_storage=requires_cold_storage,
                    is_hazmat=is_hazmat,
                    delivery_partner=delivery_partner,
                )
                if not policy_eval.is_compliant:
                    continue  # Skip facility failing policy check

                inv_qs = FacilityInventory.objects.filter(
                    facility=fac,
                    product_id=prod_id,
                )
                if var_id:
                    inv_qs = inv_qs.filter(variant_id=var_id)

                available_stock = sum(inv.quantity_available for inv in inv_qs)

                if available_stock > 0:
                    allocated = min(remaining_qty, available_stock)
                    allocations.append(
                        AllocationItem(
                            product_id=prod_id,
                            variant_id=var_id,
                            requested_qty=required_qty,
                            allocated_qty=allocated,
                            facility_id=str(fac.id),
                            facility_code=fac.facility_code,
                        )
                    )
                    remaining_qty -= allocated
                    if remaining_qty <= 0:
                        break

            if remaining_qty > 0:
                unallocated.append({
                    "product_id": prod_id,
                    "variant_id": var_id,
                    "shortage_qty": remaining_qty,
                })

        return FacilityAllocationResult(
            is_fully_allocated=len(unallocated) == 0,
            serviceable_pincode=target_pincode or "",
            allocations=allocations,
            unallocated_items=unallocated,
        )
