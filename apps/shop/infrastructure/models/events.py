import uuid
from django.db import models
from django.utils import timezone
from core.base_models.validator_model import BaseModel
from core.base_models.fields.short_ui_fields import CustomShortUUIDField


from apps.shop.valuesets import EVENT_STATUS_VALUESET


class DomainEventOutbox(BaseModel):
    """
    Event Outbox & Governance Model.
    Guarantees event persistence, idempotency, versioning, and replay capability.
    """

    class EventStatus:
        PENDING = EVENT_STATUS_VALUESET.get("PENDING").code
        PROCESSED = EVENT_STATUS_VALUESET.get("PROCESSED").code
        FAILED = EVENT_STATUS_VALUESET.get("FAILED").code

    id = CustomShortUUIDField(primary_key=True, prefix="evt_")
    event_type = models.CharField(max_length=100, help_text="e.g. PRODUCT_UPDATED, STOCK_RESERVED")
    version = models.CharField(max_length=20, default="1.0", help_text="Event schema version")
    entity_id = models.CharField(max_length=50)
    payload = models.JSONField(default=dict)
    idempotency_key = models.CharField(
        max_length=128,
        unique=True,
        default=uuid.uuid4,
        help_text="Unique key to enforce event deduplication and replay safety"
    )
    status = models.CharField(
        max_length=20,
        choices=EVENT_STATUS_VALUESET.as_django_choices(),
        default="PENDING",
    )
    retry_count = models.PositiveIntegerField(default=0)
    error_log = models.TextField(blank=True, null=True)
    processed_at = models.DateTimeField(null=True, blank=True)

    class Meta(BaseModel.Meta):
        db_table = "shop_domain_event_outbox"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status", "created_at"]),
            models.Index(fields=["event_type"]),
        ]
        verbose_name = "Domain Event Outbox"
        verbose_name_plural = "Domain Event Outbox Entries"

    def mark_processed(self):
        self.status = self.EventStatus.PROCESSED
        self.processed_at = timezone.now()
        self.save(update_fields=["status", "processed_at", "updated_at"])

    def mark_failed(self, error: str):
        self.status = self.EventStatus.FAILED
        self.retry_count += 1
        self.error_log = error
        self.save(update_fields=["status", "retry_count", "error_log", "updated_at"])

    @classmethod
    def record_event(
        cls,
        event_type: str,
        entity_id: str | None = None,
        aggregate_id: str | None = None,
        aggregate_type: str = "",
        payload: dict | None = None,
        idempotency_key: str | None = None,
        version: str = "1.0",
    ) -> "DomainEventOutbox":
        eid = entity_id or aggregate_id or ""
        key = idempotency_key or f"{event_type}_{eid}_{uuid.uuid4().hex[:8]}"
        return cls.objects.create(
            event_type=str(event_type),
            entity_id=eid,
            payload=payload or {},
            idempotency_key=key,
            version=version,
        )
