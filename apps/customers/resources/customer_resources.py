from import_export import fields, widgets
from core.base_models.import_mixins import BasePlatformModelResource
from apps.customers.models.customer import Customer


class CustomerResource(BasePlatformModelResource):
    class Meta(BasePlatformModelResource.Meta):
        model = Customer
        import_id_fields = ("email",)
        fields = (
            "id", "first_name", "last_name", "email",
            "phone_number", "status", "company",
        )
