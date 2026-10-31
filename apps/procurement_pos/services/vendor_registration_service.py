import logging
from typing import Any

from django.contrib.auth import get_user_model
from django.db import transaction

from apps.procurement_pos.models.procurement import Supplier
from core.base_models.services.number_series import NumberSeriesService

User = get_user_model()
logger = logging.getLogger(__name__)


class VendorRegistrationService:
    """
    Dedicated Vendor & Supplier Self-Service Registration Engine.
    Handles onboarding for B2B Partners, Suppliers, and Marketplace Vendors.
    """

    @classmethod
    @transaction.atomic
    def register_vendor(
        cls,
        company_name: str,
        representative_name: str,
        email: str,
        password: str,
        username: str | None = None,
        tax_id: str | None = None,
        phone: str | None = None,
        address: str | None = None,
        category: str = "DISTRIBUTOR",
        company_id: str | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> tuple[Any, Supplier]:
        """
        Atomically registers a new user login with PARTNER_B2B profile and corresponding Supplier entity.
        """
        email_clean = email.strip().lower()
        username_clean = (username or email_clean.split("@")[0]).strip().lower()
        company_name_clean = company_name.strip()
        representative_clean = representative_name.strip()

        if User.objects.filter(username=username_clean).exists():
            raise ValueError(f"Username '{username_clean}' is already taken.")
        if User.objects.filter(email=email_clean).exists():
            raise ValueError(f"Email '{email_clean}' is already registered.")
        if Supplier.objects.filter(name__iexact=company_name_clean).exists():
            raise ValueError(f"Supplier with company name '{company_name_clean}' already exists.")

        # 1. Create Django User
        user = User.objects.create_user(
            username=username_clean,
            email=email_clean,
            password=password,
            full_name=representative_clean,
        )

        # 2. Update Profile to PARTNER_B2B
        profile = getattr(user, "profile", None)
        if profile:
            profile.user_type = "PARTNER_B2B"
            if company_id:
                profile.company_id = company_id
            profile.save(update_fields=["user_type"] + (["company_id"] if company_id else []))

        # 3. Generate Supplier Code via NumberSeriesService
        supplier_code = (
            NumberSeriesService.next(
                document_type="supplier",
                company=company_id,
            )
            or f"SUP-{user.id[:6].upper()}"
        )

        # 4. Create Supplier Record
        supplier_metadata = metadata or {}
        supplier_metadata["category"] = category
        supplier_metadata["registered_by_user_id"] = str(user.id)

        supplier = Supplier.objects.create(
            name=company_name_clean,
            code=supplier_code,
            contact_person=representative_clean,
            email=email_clean,
            phone=phone,
            address=address or "",
            tax_id=tax_id or "",
            is_active=True,
            metadata=supplier_metadata,
        )

        # 5. Link user to Supplier polymorphically via PartyReferenceMixin
        supplier.set_party(user)
        supplier.save(update_fields=["party_type", "party_content_type", "party_id"])

        logger.info(
            f"Successfully registered vendor '{supplier.name}' ({supplier.code}) for user {user.username}"
        )

        return user, supplier
