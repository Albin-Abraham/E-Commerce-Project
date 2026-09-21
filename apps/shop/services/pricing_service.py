from decimal import Decimal
from typing import Optional, Dict, Any
from django.utils import timezone
from apps.shop.infrastructure.models.pricing import PricingRule
from apps.shop.infrastructure.models.variant import ProductVariant


class PricingEngineService:
    """
    Multi-parameter Dynamic Pricing & B2B Volume Discount Evaluation Engine.
    Evaluates quantity breaks, customer group contracts, and active effective windows.
    """

    @classmethod
    def evaluate_price(
        cls,
        variant: ProductVariant,
        customer_group: Optional[str] = None,
        quantity: int = 1,
        evaluation_date=None,
    ) -> Dict[str, Any]:
        """
        Evaluates the best net unit price for a given ProductVariant.
        Returns detailed price calculation breakdown.
        """
        if evaluation_date is None:
            evaluation_date = timezone.now()

        base_price = Decimal(str(variant.price))

        # Query applicable active rules sorted by priority descending
        rules = PricingRule.objects.filter(
            variant=variant,
            is_active=True,
            min_quantity__lte=quantity,
        )

        if customer_group:
            rules = rules.filter(models.Q(customer_group__isnull=True) | models.Q(customer_group__iexact=customer_group))
        else:
            rules = rules.filter(customer_group__isnull=True)

        # Evaluate rules in Python for date range and max_quantity constraints
        matching_rule = None
        for rule in rules:
            if rule.max_quantity is not None and quantity > rule.max_quantity:
                continue
            if rule.valid_from and evaluation_date < rule.valid_from:
                continue
            if rule.valid_to and evaluation_date > rule.valid_to:
                continue

            matching_rule = rule
            break  # Selected highest priority matching rule

        final_unit_price = base_price
        applied_discount_percent = Decimal("0.00")
        applied_rule_name = None

        if matching_rule:
            applied_rule_name = matching_rule.name
            if matching_rule.flat_price is not None:
                final_unit_price = Decimal(str(matching_rule.flat_price))
            elif matching_rule.discount_percentage > 0:
                applied_discount_percent = Decimal(str(matching_rule.discount_percentage))
                discount_amount = base_price * (applied_discount_percent / Decimal("100.00"))
                final_unit_price = base_price - discount_amount

        final_unit_price = max(Decimal("0.00"), round(final_unit_price, 2))
        total_line_price = round(final_unit_price * Decimal(quantity), 2)

        return {
            "variant_id": str(variant.id),
            "sku": variant.sku,
            "base_unit_price": base_price,
            "final_unit_price": final_unit_price,
            "quantity": quantity,
            "total_line_price": total_line_price,
            "applied_discount_percent": applied_discount_percent,
            "applied_rule_name": applied_rule_name,
        }
