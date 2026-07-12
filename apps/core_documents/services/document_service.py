from django.db import transaction
from django.contrib.contenttypes.models import ContentType
from apps.core_documents.models import Document, DocumentDefinition, DocumentVersion
import logging

logger = logging.getLogger(__name__)

class DocumentService:
    @staticmethod
    @transaction.atomic
    def upload_document(entity, definition_key, file_obj, uploaded_by, metadata=None):
        """
        Uploads a new version of a document for a given entity.
        If no document exists for the entity/definition, it creates one.
        """
        if metadata is None:
            metadata = {}

        # 1. Get Definition
        # For multi-tenant scoped definitions:
        # We assume the entity has a 'company' attribute if it's scoped.
        company = getattr(entity, 'company', None)
        
        try:
            # First try company-specific definition
            definition = DocumentDefinition.objects.get(
                key=definition_key, 
                company=company, 
                is_active=True
            )
        except DocumentDefinition.DoesNotExist:
            # Fallback to Global definition
            try:
                definition = DocumentDefinition.objects.get(
                    key=definition_key, 
                    is_global=True, 
                    is_active=True
                )
            except DocumentDefinition.DoesNotExist:
                raise ValueError(f"DocumentDefinition '{definition_key}' not found or inactive.")

        # 2. Get or Create Document instance for the entity
        content_type = ContentType.objects.get_for_model(entity)
        document, created = Document.objects.get_or_create(
            definition=definition,
            content_type=content_type,
            object_id=str(entity.id),
            defaults={"metadata": metadata}
        )

        # 3. Handle Versioning
        version_num = 1
        if not created:
            version_num = document.current_version + 1
            document.current_version = version_num
            document.metadata.update(metadata)
            document.save()

        # 4. Create DocumentVersion
        version = DocumentVersion.objects.create(
            document=document,
            version=version_num,
            file=file_obj,
            uploaded_by=uploaded_by,
            metadata_snapshot=metadata
        )

        logger.info(f"Uploaded {definition_key} v{version_num} for {entity}")
        return version

    @staticmethod
    def get_documents_for_entity(entity):
        """
        Returns all documents attached to an entity.
        """
        content_type = ContentType.objects.get_for_model(entity)
        return Document.objects.filter(
            content_type=content_type, 
            object_id=str(entity.id),
            is_archived=False
        ).select_related('definition')
