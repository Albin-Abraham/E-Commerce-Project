from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models

from core.base_models.constants import USER_MODEL
from core.base_models.validator_model import BaseModel


from apps.core_documents.valuesets import DOCUMENT_STATUS_VALUESET


class Document(BaseModel):
    """
    Generic document attachment.
    Version-aware and linkable to any entity.
    """

    definition = models.ForeignKey(
        "core_documents.DocumentDefinition",
        on_delete=models.PROTECT,
        related_name="documents",
    )

    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.CharField(max_length=50)
    content_object = GenericForeignKey("content_type", "object_id")

    current_version = models.PositiveIntegerField(default=1)
    metadata = models.JSONField(default=dict, blank=True)
    is_archived = models.BooleanField(default=False)
    expiry_date = models.DateField(
        null=True, blank=True, help_text="Calculated date of document expiration"
    )
    alert_sent = models.BooleanField(
        default=False, help_text="Flag indicating if expiration alert has been dispatched"
    )
    status = models.CharField(
        max_length=20,
        choices=DOCUMENT_STATUS_VALUESET.as_django_choices(),
        default="DRAFT",
        help_text="Current lifecycle state of the document"
    )
    rejection_reason = models.TextField(
        blank=True,
        null=True,
        help_text="Reason document was rejected, if applicable"
    )
    status_changed_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Timestamp of the last state transition"
    )
    status_changed_by = models.ForeignKey(
        USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="document_transitions",
        help_text="User who initiated the last state transition"
    )

    @property
    def company(self):
        entity = self.content_object
        if not entity:
            return None
        if entity.__class__.__name__ == "Company":
            return entity
        return getattr(entity, "company", None)

    class Meta:
        db_table = "documents"
        indexes = [
            models.Index(fields=["content_type", "object_id"]),
        ]

    def __str__(self):
        return f"{self.definition.label} for {self.content_object}"


def get_tenant_storage():
    from apps.core_documents.services.storage_router import DynamicTenantStorage
    return DynamicTenantStorage()


def get_upload_path(instance, filename):
    document = instance.document
    entity = document.content_object
    company = getattr(entity, "company", None)
    if not company and entity.__class__.__name__ == "Company":
        company = entity
    tenant_id_str = str(company.id) if company else "global"
    definition_key = document.definition.key
    return f"documents/{tenant_id_str}/{definition_key}/{filename}"


class DocumentVersion(BaseModel):
    """
    Specific file version for a Document.
    """

    document = models.ForeignKey(
        "core_documents.Document", on_delete=models.CASCADE, related_name="versions"
    )
    version = models.PositiveIntegerField()
    file = models.FileField(
        upload_to=get_upload_path,
        storage=get_tenant_storage,
        max_length=512
    )
    uploaded_by = models.ForeignKey(
        USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="uploaded_documents_v2"
    )

    metadata_snapshot = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = "document_versions"
        ordering = ["document", "-version"]
        constraints = [
            models.UniqueConstraint(
                fields=["document", "version"], name="unique_document_version_v2"
            )
        ]

    def __str__(self):
        return f"{self.document} v{self.version}"
