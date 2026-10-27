from core.admin.models.business_unit import BusinessUnit
from core.base_serializers.base_serializers import BaseModelSerializer


class BusinessUnitSerializer(BaseModelSerializer):
    class Meta:
        model = BusinessUnit
        fields = ["id", "company", "name", "code", "description"]
