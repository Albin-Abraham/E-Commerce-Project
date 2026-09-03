import logging

from celery import shared_task

from apps.core_documents.services.document_service import DocumentService

logger = logging.getLogger(__name__)


@shared_task(name="apps.core_documents.tasks.check_document_expirations_task")
def check_document_expirations_task():
    logger.info("Running scheduled document expiration checks...")
    expired_docs = DocumentService.check_expirations()
    logger.info("Document expiration checks completed. Processed %d documents.", len(expired_docs))
    return {"processed_count": len(expired_docs)}
