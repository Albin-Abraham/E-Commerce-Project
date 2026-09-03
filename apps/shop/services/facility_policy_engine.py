import logging
from dataclasses import dataclass
from decimal import Decimal
from django.db import models
from django.utils import timezone
from apps.shop.infrastructure.models.facility import Facility
from apps.shop.models.facility_policy import DeliveryPartner, FacilityPolicyRule

logger = logging.getLogger(__name__)


@dataclass
class PolicyEvaluationResult:
    is_compliant: bool
    policy_name: str
    failure_reasons: list[str]


class FacilityPolicyEngine:
    """
    Facility Policy Gatekeeper & Delivery Partner Access Control Engine.
    Evaluates operating rules, SLA constraints, weight limits, and cold chain rules
    BEFORE orders can access or allocate stock from a facility or delivery partner.
    """

    @classmethod
    def evaluate_facility(
        cls,
        facility: Facility,
        order_weight_kg: Decimal = Decimal("0.00"),
        requires_cold_storage: bool = False,
        is_hazmat: bool = False,
        delivery_partner: DeliveryPartner | None = None,
    ) -> PolicyEvaluationResult:
        """
        Evaluates facility and delivery partner policies for an incoming order.
        """
        failure_reasons = []

        if not facility.is_active:
            failure_reasons.append(f"Facility {facility.facility_code} is currently inactive.")

        # 1. Evaluate Cold Storage Policy
        facility_capabilities = facility.capabilities or {}
        if requires_cold_storage and not facility_capabilities.get("has_cold_storage", False):
            failure_reasons.append(f"Facility {facility.facility_code} lacks required cold storage capabilities.")

        # 2. Evaluate Operating Hours & Cutoff Times
        now = timezone.now().time()
        operating_hours = facility.operating_hours or {}
        cutoff_str = operating_hours.get("dispatch_cutoff")
        if cutoff_str:
            try:
                cutoff_hour, cutoff_min = map(int, cutoff_str.split(":"))
                if now.hour > cutoff_hour or (now.hour == cutoff_hour and now.minute > cutoff_min):
                    failure_reasons.append(f"Facility {facility.facility_code} has passed daily dispatch cutoff time ({cutoff_str}).")
            except Exception as e:
                logger.warning(f"Error parsing facility cutoff time: {e}")

        # 3. Evaluate Facility Policy Rules in Database
        policies = FacilityPolicyRule.objects.filter(is_active=True).filter(
            models.Q(facility=facility) | models.Q(facility__isnull=True)
        )
        for rule in policies:
            if rule.max_order_weight_kg and order_weight_kg > rule.max_order_weight_kg:
                failure_reasons.append(f"Order weight ({order_weight_kg}kg) exceeds facility max limit ({rule.max_order_weight_kg}kg) defined by policy '{rule.rule_name}'.")

            if is_hazmat and not rule.allow_hazmat:
                failure_reasons.append(f"Facility {facility.facility_code} restricts hazardous materials under policy '{rule.rule_name}'.")

        # 4. Evaluate Delivery Partner Constraints
        if delivery_partner:
            if not delivery_partner.is_active:
                failure_reasons.append(f"Delivery partner {delivery_partner.name} is inactive.")

            if order_weight_kg > delivery_partner.max_weight_capacity_kg:
                failure_reasons.append(f"Order weight ({order_weight_kg}kg) exceeds delivery partner max capacity ({delivery_partner.max_weight_capacity_kg}kg).")

            if requires_cold_storage and not delivery_partner.requires_cold_chain:
                failure_reasons.append(f"Delivery partner {delivery_partner.name} does not support refrigerated cold chain transport.")

        return PolicyEvaluationResult(
            is_compliant=len(failure_reasons) == 0,
            policy_name=f"Policy Check for {facility.facility_code}",
            failure_reasons=failure_reasons,
        )
