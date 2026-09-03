from rest_framework import serializers, viewsets
from apps.shop.infrastructure.models.facility import Facility, StorageLocation, FacilityInventory
from apps.shop.models.facility_policy import DeliveryPartner, FacilityPolicyRule


class FacilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Facility
        fields = "__all__"


class StorageLocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = StorageLocation
        fields = "__all__"


class FacilityInventorySerializer(serializers.ModelSerializer):
    facility_name = serializers.CharField(source="facility.name", read_only=True)
    product_name = serializers.CharField(source="product.name", read_only=True)

    class Meta:
        model = FacilityInventory
        fields = "__all__"


class DeliveryPartnerSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeliveryPartner
        fields = "__all__"


class FacilityPolicyRuleSerializer(serializers.ModelSerializer):
    facility_name = serializers.CharField(source="facility.name", read_only=True, default=None)
    partner_name = serializers.CharField(source="delivery_partner.name", read_only=True, default=None)

    class Meta:
        model = FacilityPolicyRule
        fields = "__all__"


class FacilityViewSet(viewsets.ModelViewSet):
    queryset = Facility.objects.all()
    serializer_class = FacilitySerializer
    filterset_fields = ["company", "branch", "facility_type", "is_active"]


class StorageLocationViewSet(viewsets.ModelViewSet):
    queryset = StorageLocation.objects.all()
    serializer_class = StorageLocationSerializer
    filterset_fields = ["facility", "location_type", "parent"]


class FacilityInventoryViewSet(viewsets.ModelViewSet):
    queryset = FacilityInventory.objects.all()
    serializer_class = FacilityInventorySerializer
    filterset_fields = ["facility", "storage_location", "product"]


class DeliveryPartnerViewSet(viewsets.ModelViewSet):
    queryset = DeliveryPartner.objects.all()
    serializer_class = DeliveryPartnerSerializer
    filterset_fields = ["partner_type", "requires_cold_chain", "is_active"]


class FacilityPolicyRuleViewSet(viewsets.ModelViewSet):
    queryset = FacilityPolicyRule.objects.all()
    serializer_class = FacilityPolicyRuleSerializer
    filterset_fields = ["facility", "delivery_partner", "requires_cold_storage", "allow_hazmat", "is_active"]
