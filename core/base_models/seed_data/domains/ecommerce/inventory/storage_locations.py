from __future__ import annotations

from typing import Any

from core.base_models.seed_data.engine.base import BaseSeedModule
from core.base_models.seed_data.engine.context import SeedContext


class StorageLocationSeedModule(BaseSeedModule):
    name = "storage_locations"
    section = "inventory"
    depends_on = ["warehouses"]

    def validate(self, context: SeedContext, raw_data: Any) -> list[str]:
        errors = []
        locations = raw_data.get("storage_locations", []) if isinstance(raw_data, dict) else []
        for i, loc in enumerate(locations):
            if not loc.get("code"):
                errors.append(f"StorageLocation at index {i} is missing 'code'")
            if not loc.get("warehouse_code"):
                errors.append(f"StorageLocation at index {i} is missing 'warehouse_code'")
        return errors

    def execute(self, context: SeedContext, raw_data: Any) -> None:
        from apps.shop.infrastructure.models.facility import Facility, StorageLocation

        locations = raw_data.get("storage_locations", []) if isinstance(raw_data, dict) else []
        for loc_info in locations:
            code = loc_info.get("code")
            wh_code = loc_info.get("warehouse_code")
            if not code or not wh_code:
                continue

            facility = Facility.objects.filter(facility_code=wh_code).first()
            if not facility:
                context.stats.record_skipped()
                continue

            loc_type = loc_info.get("location_type", "BIN")
            # Map type to allowed choices in valueset
            allowed_types = [
                "ZONE",
                "AISLE",
                "RACK",
                "SHELF",
                "BIN",
                "PALLET",
                "COLD_ROOM",
                "RECEIVING_DOCK",
                "SHIPPING_BAY",
                "STAGING_AREA",
            ]
            if loc_type not in allowed_types:
                loc_type = "BIN"

            loc, created = StorageLocation.objects.update_or_create(
                facility=facility,
                location_code=code,
                defaults={
                    "location_type": loc_type,
                    "is_active": loc_info.get("is_active", True),
                },
            )
            if created:
                context.stats.record_created()
                context.write(f"  + Storage location created: {code} ({facility.facility_code})")
            else:
                context.stats.record_updated()
                context.write(f"  * Storage location updated: {code} ({facility.facility_code})")
