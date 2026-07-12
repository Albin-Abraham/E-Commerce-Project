from django.db import models
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from core.base_models.validator_model import BaseModel
from core.base_models.constants import USER_MODEL

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
    
    # Generic relation to any entity (Company, User, Division etc)
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.CharField(max_length=50) 
    content_object = GenericForeignKey("content_type", "object_id")
    
    current_version = models.PositiveIntegerField(default=1)
    metadata = models.JSONField(default=dict, blank=True)
    is_archived = models.BooleanField(default=False)

    class Meta:
        db_table = "documents"
        indexes = [
            models.Index(fields=["content_type", "object_id"]),
        ]

    def __str__(self):
        return f"{self.definition.label} for {self.content_object}"

class DocumentVersion(BaseModel):
    """
    Specific file version for a Document.
    """
    document = models.ForeignKey(
        "core_documents.Document", 
        on_delete=models.CASCADE, 
        related_name="versions"
    )
    version = models.PositiveIntegerField()
    file = models.FileField(upload_to="documents/%Y/%m/%d/")
    uploaded_by = models.ForeignKey(
        USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        related_name="uploaded_documents_v2"
    )
    
    metadata_snapshot = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = "document_versions"
        ordering = ["document", "-version"]
        constraints = [
            models.UniqueConstraint(
                fields=["document", "version"],
                name="unique_document_version_v2"
            )
        ]

    def __str__(self):
        return f"{self.document} v{self.version}"
