from core.base_serializers.base_serializers import BaseModelSerializer
from core.admin.models.business_unit import BusinessUnit

class BusinessUnitSerializer(BaseModelSerializer):
    class Meta:
        model = BusinessUnit
        fields = ["id", "company", "name", "code", "description"]
