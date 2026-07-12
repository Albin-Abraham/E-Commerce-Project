# core/admin/serializers/branch_serializers.py
from core.base_serializers.base_serializers import BaseModelSerializer
from core.admin.models.branch import Branch, BranchExtension

class BranchExtensionSerializer(BaseModelSerializer):
    class Meta:
        model = BranchExtension
        fields = ["extra_attributes"]

class BranchSerializer(BaseModelSerializer):
    extensions = BranchExtensionSerializer(required=False)

    class Meta:
        model = Branch
        fields = ["id", "company", "business_unit", "name", "code", "location", "opened_date", "catalog", "extensions"]

    def create(self, validated_data):
        extensions_data = validated_data.pop('extensions', {})
        instance = super().create(validated_data)
        
        if extensions_data:
            BranchExtension.objects.create(branch=instance, **extensions_data)
        return instance

    def update(self, instance, validated_data):
        extensions_data = validated_data.pop('extensions', {})
        instance = super().update(instance, validated_data)
        
        if extensions_data:
            extension, _ = BranchExtension.objects.get_or_create(branch=instance)
            for attr, value in extensions_data.items():
                setattr(extension, attr, value)
            extension.save()
        return instance
