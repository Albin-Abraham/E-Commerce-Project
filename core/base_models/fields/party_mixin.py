from django.db import models
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey


class PartyReferenceMixin(models.Model):
    """
    Polymorphic Party Reference Mixin matching yafei-hospital architecture.
    Allows selling, procurement, and accounting models to reference any trading party
    (Customer, Supplier/Vendor, Partner, Employee, Company) dynamically.
    """

    party_type = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        db_index=True,
        help_text="Model name of the party entity (e.g. Customer, Supplier, UserProfileModel)",
    )
    party_content_type = models.ForeignKey(
        ContentType,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="+",
    )
    party_id = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        db_index=True,
        help_text="Primary key of the party entity",
    )
    party = GenericForeignKey("party_content_type", "party_id")

    class Meta:
        abstract = True

    def set_party(self, party_obj):
        """
        Convenience method to set party reference fields polymorphically.
        """
        if party_obj:
            self.party_content_type = ContentType.objects.get_for_model(party_obj)
            self.party_id = str(party_obj.pk)
            self.party_type = party_obj._meta.model_name.capitalize()
            self.party = party_obj
        else:
            self.party_content_type = None
            self.party_id = None
            self.party_type = None
            self.party = None
