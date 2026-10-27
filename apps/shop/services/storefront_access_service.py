import logging
from typing import Any

logger = logging.getLogger(__name__)


class StorefrontAccessService:
    """
    Three-Layer Enterprise Storefront Access, Authorization & Commercial Segmentation Service.
    Decouples Staff Permissions (Layer 1) from Commercial Segmentation (Layer 2)
    and Storefront Data Protection (Layer 3).
    """

    STAFF_PERMISSION_GROUPS = {
        "Administrators",
        "Catalog Managers",
        "Product Admins",
        "Store Staff",
        "Inventory Managers",
    }

    INTERNAL_ADMIN_FIELDS = {
        "company",
        "metadata",
        "extensions",
        "status",
        "item_tax_template",
    }

    # -------------------------------------------------------------------------
    # Layer 1: Authorization (Staff & Admin RBAC)
    # -------------------------------------------------------------------------
    @classmethod
    def can_view_internal_fields(cls, user: Any) -> bool:
        """
        Evaluates whether the requester holds administrative staff privileges
        to inspect internal backend fields (company UUID, internal metadata, extensions, cost).
        Uses Django Groups, Django Permissions, and staff flags.
        """
        if not user or not getattr(user, "is_authenticated", False):
            return False

        if getattr(user, "is_superuser", False) or getattr(user, "is_staff", False):
            return True

        # Check explicit Django / Access Control permissions
        if hasattr(user, "has_perm") and (
            user.has_perm("shop.view_internal_fields")
            or user.has_perm("shop.view_product")
            or user.has_perm("shop:product:view_internal")
        ):
            return True

        # Check Django Groups
        if (
            hasattr(user, "groups")
            and user.groups.filter(name__in=cls.STAFF_PERMISSION_GROUPS).exists()
        ):
            return True

        return False

    # -------------------------------------------------------------------------
    # Layer 2: Commerce Rules (Commercial Context & Customer Segmentation)
    # -------------------------------------------------------------------------
    @classmethod
    def resolve_customer_group(cls, user: Any) -> str | None:
        """
        Determines the commercial customer group (e.g. 'Wholesale', 'VIP', 'Retail')
        based on account relationships, customer account metadata, or persona.
        Note: This represents commercial tier eligibility, NOT administrative permission.
        """
        if not user or not getattr(user, "is_authenticated", False):
            return None

        # 1. Inspect Customer Account (apps.customers)
        customer_account = getattr(user, "customer_account", None)
        if customer_account:
            if isinstance(customer_account.metadata, dict):
                group = customer_account.metadata.get("customer_group")
                if group:
                    return str(group)

            if getattr(customer_account, "customer_type", None) == "COMMERCIAL":
                return "Wholesale"

        # 2. Inspect UserProfile persona fallback
        profile = getattr(user, "profile", None)
        if profile:
            if getattr(profile, "is_b2b", False) or profile.user_type in [
                "CUSTOMER_B2B",
                "PARTNER_B2B",
            ]:
                return "Wholesale"
            if getattr(profile, "is_b2c", False) or profile.user_type in [
                "CUSTOMER_B2C",
                "PARTNER_B2C",
            ]:
                return "Retail"

        return None

    # -------------------------------------------------------------------------
    # Layer 3: Data Protection & Presentation
    # -------------------------------------------------------------------------
    @classmethod
    def compute_stock_messaging(cls, available_stock: int) -> str:
        """
        Translates raw warehouse counts into customer-friendly stock availability messaging.
        """
        if available_stock > 10:
            return "IN_STOCK"
        elif available_stock > 0:
            return f"ONLY_{available_stock}_LEFT"
        return "OUT_OF_STOCK"

    @classmethod
    def check_product_is_favorited(cls, user: Any, product_id: str) -> bool:
        """
        Determines whether the authenticated customer has saved this product to their wishlist or likes.
        """
        if not user or not getattr(user, "is_authenticated", False):
            return False

        try:
            from apps.customers.models.shopping import ProductLike, WishlistItem

            customer_account = getattr(user, "customer_account", None)
            if not customer_account:
                return False

            if WishlistItem.objects.filter(
                wishlist__customer=customer_account, product_id=product_id
            ).exists():
                return True

            if ProductLike.objects.filter(
                customer=customer_account, product_id=product_id
            ).exists():
                return True
        except Exception as exc:
            logger.debug(f"Failed to resolve wishlist status: {exc}")

        return False
