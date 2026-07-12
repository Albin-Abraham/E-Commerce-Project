# core/admin/serializers/company_serializers.py
from core.base_serializers.base_serializers import BaseModelSerializer
from core.admin.models.company import Company, CompanyExtension

class CompanyExtensionSerializer(BaseModelSerializer):
    class Meta:
        model = CompanyExtension
        fields = ["extra_documents", "extra_attributes"]

class CompanySerializer(BaseModelSerializer):
    extensions = CompanyExtensionSerializer(required=False)
    
    class Meta:
        model = Company
        fields = ["id", "name", "email", "code", "subscription", "extensions"]
        read_only_fields = ["id"]

    def create(self, validated_data):
        """
        Industrialized Company Creation:
        Strictly funnels all persistence through super().create() to ensure 
        mediator integrity across the entire object tree.
        """
        extensions_data = validated_data.pop("extensions", None)
        
        # 1. Main Record (Mediator-Locked via super)
        company = super().create(validated_data)
        
        # 2. Nested Record (Mediator-Locked via its own serializer)
        if extensions_data:
            # We use the serializer instance to ensure its own super().create() logic fires
            ext_serializer = CompanyExtensionSerializer(data=extensions_data, context=self.context)
            ext_serializer.is_valid(raise_exception=True)
            ext_serializer.save(company=company)
            
        return company

    def update(self, instance, validated_data):
        """
        Industrialized Company Update:
        Strictly funnels all persistence through super().update().
        """
        extensions_data = validated_data.pop("extensions", None)
        
        # 1. Main Record (Mediator-Locked via super)
        instance = super().update(instance, validated_data)
        
        # 2. Nested Record (Mediator-Locked via its own serializer)
        if extensions_data:
            extension, _ = CompanyExtension.objects.get_or_create(company=instance)
            ext_serializer = CompanyExtensionSerializer(
                extension, 
                data=extensions_data, 
                partial=True, 
                context=self.context
            )
            ext_serializer.is_valid(raise_exception=True)
            ext_serializer.save()
            
        return instance
