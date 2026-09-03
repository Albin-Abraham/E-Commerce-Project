import logging

from django.contrib.contenttypes.models import ContentType
from django.db import transaction
from django.utils import timezone

from apps.core_documents.models import Document, DocumentDefinition, DocumentVersion
from apps.core_documents.services.storage_router import TenantStorageService
from apps.core_documents.services.validation_engine import DocumentValidator

logger = logging.getLogger(__name__)


class DocumentService:
    @staticmethod
    @transaction.atomic
    def upload_document(
        entity, definition_key, file_obj, uploaded_by, expiry_date=None, metadata=None
    ):
        """
        Uploads a new version of a document for a given entity.
        If no document exists for the entity/definition, it creates one.
        Validates size, extension, and MIME type constraints prior to upload.
        """
        if metadata is None:
            metadata = {}

        company = getattr(entity, "company", None)
        if not company and entity.__class__.__name__ == "Company":
            company = entity

        try:
            definition = DocumentDefinition.objects.get(
                key=definition_key, company=company, is_active=True
            )
        except DocumentDefinition.DoesNotExist:
            try:
                definition = DocumentDefinition.objects.get(
                    key=definition_key, is_global=True, is_active=True
                )
            except DocumentDefinition.DoesNotExist as err:
                raise ValueError(
                    f"DocumentDefinition '{definition_key}' not found or inactive."
                ) from err

        DocumentValidator.validate_file(file_obj, definition)

        tenant_id_str = str(company.id) if company else "global"
        upload_dir = f"documents/{tenant_id_str}/{definition_key}"
        file_path = f"{upload_dir}/{file_obj.name}"

        resolved_storage_path = TenantStorageService.upload_file(company, file_obj, file_path)

        content_type = ContentType.objects.get_for_model(entity)
        document, created = Document.objects.get_or_create(
            definition=definition,
            content_type=content_type,
            object_id=str(entity.id),
            defaults={"metadata": metadata},
        )

        version_num = 1
        if not created:
            version_num = document.current_version + 1
            document.current_version = version_num
            document.metadata.update(metadata)

        if definition.expires:
            if expiry_date:
                document.expiry_date = expiry_date
                document.alert_sent = False
            elif not document.expiry_date:
                logger.warning(
                    "DocumentDefinition '%s' requires expiration, but no expiry_date was provided.",
                    definition_key
                )

        document.save()

        version = DocumentVersion.objects.create(
            document=document,
            version=version_num,
            file=resolved_storage_path,
            uploaded_by=uploaded_by,
            metadata_snapshot=metadata,
        )

        logger.info(
            "Uploaded %s v%s for %s -> %s",
            definition_key,
            version_num,
            entity,
            resolved_storage_path,
        )
        return version

    @staticmethod
    def get_documents_for_entity(entity):
        """
        Returns all active documents attached to an entity.
        """
        content_type = ContentType.objects.get_for_model(entity)
        return Document.objects.filter(
            content_type=content_type, object_id=str(entity.id), is_archived=False
        ).select_related("definition")

    @classmethod
    def get_version_download_url(cls, version, expires_in=3600) -> str:
        document = version.document
        entity = document.content_object
        company = getattr(entity, "company", None)
        if not company and entity.__class__.__name__ == "Company":
            company = entity

        return TenantStorageService.get_file_url(company, version.file.name, expires_in=expires_in)

    @staticmethod
    @transaction.atomic
    def check_expirations() -> list[Document]:
        today = timezone.localdate()
        expiring_docs = []

        documents = Document.objects.filter(
            is_archived=False,
            expiry_date__isnull=False,
            alert_sent=False
        ).select_related("definition")

        for doc in documents:
            days_limit = doc.definition.expiry_notification_days
            threshold = doc.expiry_date - timezone.timedelta(days=days_limit)
            if today >= threshold:
                status = "EXPIRED" if today >= doc.expiry_date else "EXPIRING_SOON"
                logger.warning(
                    "ALERT: Document '%s' (ID: %s) is %s. Expiry date: %s",
                    doc.definition.label, doc.id, status, doc.expiry_date
                )
                doc.alert_sent = True
                doc.save()
                expiring_docs.append(doc)

        return expiring_docs
