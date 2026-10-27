from django.db import models
from django.utils import timezone

from core.base_models.fields.char_fields import CustomCharField
from core.base_models.fields.short_ui_fields import CustomShortUUIDField
from core.base_models.scoping_models import TenantModelMixin
from core.base_models.validator_model import BaseModel
from core.base_models.validators.rules import RequiredRule


class ImportPackage(BaseModel, TenantModelMixin):
    """
    ImportPackage Domain Entity.
    Manages multi-file data onboarding packages with full lifecycle state transitions.
    """

    class ImportStatus(models.TextChoices):
        CREATED = "CREATED", "Created"
        UPLOADED = "UPLOADED", "Uploaded"
        QUEUED = "QUEUED", "Queued"
        PARSING = "PARSING", "Parsing"
        SCANNING = "SCANNING", "Scanning"
        VALIDATING = "VALIDATING", "Validating"
        NORMALIZING = "NORMALIZING", "Normalizing"
        RECONCILING = "RECONCILING", "Reconciling"
        STAGED = "STAGED", "Staged"
        APPROVAL_REQUIRED = "APPROVAL_REQUIRED", "Approval Required"
        APPROVED = "APPROVED", "Approved"
        PUBLISHING = "PUBLISHING", "Publishing"
        PERSISTING = "PERSISTING", "Persisting"
        PUBLISHED = "PUBLISHED", "Published"
        COMPLETED = "COMPLETED", "Completed"
        PARTIAL = "PARTIAL", "Partial"
        VALIDATION_FAILED = "VALIDATION_FAILED", "Validation Failed"
        IMPORT_FAILED = "IMPORT_FAILED", "Import Failed"
        FAILED = "FAILED", "Failed"

    id = CustomShortUUIDField(primary_key=True, prefix="imppkg_")
    package_name = CustomCharField(
        max_length=150,
        rules=[RequiredRule("package_name")],
    )
    package_version = CustomCharField(max_length=50, default="1.0")
    status = CustomCharField(
        max_length=50,
        choices=ImportStatus.choices,
        default=ImportStatus.CREATED,
    )
    manifest = models.JSONField(
        default=dict,
        blank=True,
        help_text="Package manifest detailing DAG ordering and target models",
    )

    source_type = CustomCharField(max_length=50, default="CSV")
    parser_version = CustomCharField(max_length=50, default="1.0")
    total_files = models.IntegerField(default=0)
    total_rows = models.IntegerField(default=0)
    processed_rows = models.IntegerField(default=0)
    valid_rows = models.IntegerField(default=0)
    accepted_rows = models.IntegerField(default=0)
    rejected_rows = models.IntegerField(default=0)
    duplicate_rows = models.IntegerField(default=0)
    error_rows = models.IntegerField(default=0)
    warning_count = models.IntegerField(default=0)
    error_count = models.IntegerField(default=0)
    duration_seconds = models.FloatField(default=0.0)
    executed_at = models.DateTimeField(null=True, blank=True)
    metadata = models.JSONField(default=dict, blank=True)

    permission_prefix = "admin:import_package"
    permission_map = {
        "list": "view",
        "retrieve": "view",
        "create": "create",
        "update": "edit",
        "destroy": "delete",
    }

    class Meta(BaseModel.Meta):
        db_table = "admin_import_packages"
        ordering = ["-created_at"]
        verbose_name = "Import Package"
        verbose_name_plural = "Import Packages"

    def approve_and_publish(self):
        self.status = self.ImportStatus.APPROVED
        self.executed_at = timezone.now()
        self.save()

    def __str__(self):
        return f"{self.package_name} v{self.package_version} [{self.status}]"


class ImportPackageItem(BaseModel, TenantModelMixin):
    """
    ImportPackageItem Entity.
    Tracks individual file imports within a package.
    """

    class Tier(models.TextChoices):
        DEFINITION = "DEFINITION", "Definitions"
        POLICY = "POLICY", "Policies & Rules"
        MASTER = "MASTER", "Master Data"
        CATALOG = "CATALOG", "Catalog & Context"
        OPERATIONAL = "OPERATIONAL", "Operational Data"

    id = CustomShortUUIDField(primary_key=True, prefix="impitm_")
    package = models.ForeignKey(
        ImportPackage,
        on_delete=models.CASCADE,
        related_name="items",
    )
    file_name = CustomCharField(max_length=200)
    target_model = CustomCharField(max_length=100)
    tier = CustomCharField(
        max_length=50,
        choices=Tier.choices,
        default=Tier.MASTER,
    )
    status = CustomCharField(max_length=50, default="PENDING")

    sequence_order = models.IntegerField(default=0)
    row_count = models.IntegerField(default=0)
    valid_rows = models.IntegerField(default=0)
    error_count = models.IntegerField(default=0)
    error_details = models.JSONField(default=list, blank=True)

    permission_prefix = "admin:import_package_item"
    permission_map = {
        "list": "view",
        "retrieve": "view",
        "create": "create",
        "update": "edit",
        "destroy": "delete",
    }

    class Meta(BaseModel.Meta):
        db_table = "admin_import_package_items"
        ordering = ["sequence_order", "created_at"]
        verbose_name = "Import Package Item"
        verbose_name_plural = "Import Package Items"

    def __str__(self):
        return f"{self.file_name} -> {self.target_model} [{self.status}]"


class ImportJob(BaseModel, TenantModelMixin):
    """
    ImportJob Domain Entity.
    Canonical execution unit for data onboarding operations across standard UI uploads,
    streamed feeds, and package items.
    """

    ImportStatus = ImportPackage.ImportStatus

    id = CustomShortUUIDField(primary_key=True, prefix="impjob_")
    package = models.ForeignKey(
        ImportPackage,
        on_delete=models.CASCADE,
        related_name="jobs",
        null=True,
        blank=True,
    )
    job_name = CustomCharField(max_length=150)
    source_type = CustomCharField(max_length=50, default="CSV")
    target_model = CustomCharField(max_length=100)
    tier = CustomCharField(
        max_length=50,
        choices=ImportPackageItem.Tier.choices,
        default=ImportPackageItem.Tier.MASTER,
    )
    file_name = CustomCharField(max_length=200, blank=True, default="")
    status = CustomCharField(
        max_length=50,
        choices=ImportPackage.ImportStatus.choices,
        default=ImportPackage.ImportStatus.CREATED,
    )
    total_rows = models.IntegerField(default=0)
    processed_rows = models.IntegerField(default=0)
    valid_rows = models.IntegerField(default=0)
    accepted_rows = models.IntegerField(default=0)
    rejected_rows = models.IntegerField(default=0)
    duplicate_rows = models.IntegerField(default=0)
    error_rows = models.IntegerField(default=0)
    duration_seconds = models.FloatField(default=0.0)
    error_details = models.JSONField(default=list, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    executed_at = models.DateTimeField(null=True, blank=True)

    permission_prefix = "admin:import_job"
    permission_map = {
        "list": "view",
        "retrieve": "view",
        "create": "create",
        "update": "edit",
        "destroy": "delete",
    }

    class Meta(BaseModel.Meta):
        db_table = "admin_import_jobs"
        ordering = ["-created_at"]
        verbose_name = "Import Job"
        verbose_name_plural = "Import Jobs"

    def __str__(self):
        return f"Job #{self.id} {self.job_name} [{self.target_model}] -> {self.status}"


class StagingRecord(BaseModel, TenantModelMixin):
    """
    StagingRecord Domain Entity.
    Stores un-validated raw and normalized records streamed from Source Adapters
    prior to domain reconciliation and bulk persistence.
    """

    class RecordStatus(models.TextChoices):
        RAW = "RAW", "Raw"
        VALIDATED = "VALIDATED", "Validated"
        NORMALIZED = "NORMALIZED", "Normalized"
        RECONCILED = "RECONCILED", "Reconciled"
        COMMITTED = "COMMITTED", "Committed"
        REJECTED = "REJECTED", "Rejected"

    id = CustomShortUUIDField(primary_key=True, prefix="stgrec_")
    job = models.ForeignKey(
        ImportJob,
        on_delete=models.CASCADE,
        related_name="staging_records",
        null=True,
        blank=True,
    )
    package = models.ForeignKey(
        ImportPackage,
        on_delete=models.CASCADE,
        related_name="staging_records",
        null=True,
        blank=True,
    )
    package_item = models.ForeignKey(
        ImportPackageItem,
        on_delete=models.CASCADE,
        related_name="staging_records",
        null=True,
        blank=True,
    )
    row_number = models.IntegerField()
    target_model = CustomCharField(max_length=100)
    raw_payload = models.JSONField(default=dict)
    normalized_payload = models.JSONField(default=dict, blank=True)
    status = CustomCharField(
        max_length=50,
        choices=RecordStatus.choices,
        default=RecordStatus.RAW,
    )
    idempotency_hash = models.CharField(max_length=64, db_index=True, blank=True, default="")
    error_details = models.JSONField(default=list, blank=True)

    permission_prefix = "admin:staging_record"
    permission_map = {
        "list": "view",
        "retrieve": "view",
        "create": "create",
        "update": "edit",
        "destroy": "delete",
    }

    class Meta(BaseModel.Meta):
        db_table = "admin_import_staging_records"
        ordering = ["package", "row_number"]
        verbose_name = "Staging Record"
        verbose_name_plural = "Staging Records"

    def __str__(self):
        return f"Staging #{self.row_number} [{self.target_model}] -> {self.status}"
