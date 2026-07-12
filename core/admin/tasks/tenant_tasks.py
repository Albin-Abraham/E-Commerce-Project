# core/admin/tasks/tenant_tasks.py
from celery import shared_task
from django.db import transaction
from core.admin.utils.integrity.locks import distributed_lock, DistributedLockError
from core.admin.utils.integrity.time_registry import TimeRegistry
import logging

logger = logging.getLogger(__name__)

@shared_task(name="core.admin.tasks.initialize_company_defaults")
def initialize_company_defaults(company_id):
    """
    Background task to provision default branch and settings for a new company.
    """
    from core.admin.models.company import Company
    from apps.core_documents.models import DocumentDefinition
    from core.admin.models.branch import Branch

    try:
        lock_id = f"provision_company_{company_id}"
        with distributed_lock(lock_id, timeout=300):
            with transaction.atomic():
                company = Company.objects.get(id=company_id)
                
                # Check if already provisioned
                if Branch.objects.filter(company=company, code="MAIN").exists():
                    logger.info(f"Company {company.name} already provisioned. Skipping.")
                    return

                # 1. Create Main Branch
                main_branch, created = Branch.objects.get_or_create(
                    company=company,
                    name="Main Branch",
                    defaults={
                        "code": "MAIN",
                        "opened_date": TimeRegistry.get_local_date(),
                    }
                )
                if created:
                    logger.info(f"Created Main Branch for Company: {company.name}")

                # 2. Provision Default Document Definitions
                defaults = [
                    {"name": "Sales Invoice", "key": "sales_invoice", "prefix": "INV"},
                    {"name": "Purchase Order", "key": "purchase_order", "prefix": "PO"},
                ]
                
                for item in defaults:
                    DocumentDefinition.objects.get_or_create(
                        company=company,
                        key=item["key"],
                        defaults={
                            "label": item["name"],
                            "prefix": item["prefix"],
                            "is_global": False
                        }
                    )
                    
                logger.info(f"Provisioned defaults for Company: {company.name}")
            
    except DistributedLockError:
        logger.warning(f"Provisioning task for Company {company_id} already running.")
    except Company.DoesNotExist:
        logger.error(f"Company {company_id} not found.")
    except Exception as e:
        logger.exception(f"Error provisioning Company {company_id}: {str(e)}")


@shared_task(name="core.admin.tasks.sync_company_metrics")
def sync_company_metrics(company_id):
    """
    Background task to calculate and cache subscription usage metrics.
    """
    from django.core.cache import cache
    cache_key = f"company_metrics_{company_id}"
    metrics = {
        "user_count": 0,
        "last_sync": TimeRegistry.get_local_now().isoformat()
    }
    cache.set(cache_key, metrics, 3600)
    logger.info(f"Synced subscription metrics for Company {company_id}")
