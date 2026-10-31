from rest_framework.decorators import action
from rest_framework.response import Response

from core.admin.helpers.query_helpers import FilterField, FilterSchema
from core.admin.models.import_engine import (
    ImportJob,
    ImportPackage,
    ImportPackageItem,
    StagingRecord,
)
from core.admin.services.import_pipeline_service import ImportPipelineService
from core.base_serializers.base_serializers import BaseModelSerializer
from core.base_views.api_views import BaseAPIView


class StagingRecordSerializer(BaseModelSerializer):
    class Meta:
        model = StagingRecord
        fields = [
            "id",
            "job",
            "package",
            "package_item",
            "row_number",
            "target_model",
            "raw_payload",
            "normalized_payload",
            "status",
            "idempotency_hash",
            "error_details",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class ImportJobSerializer(BaseModelSerializer):
    staging_records = StagingRecordSerializer(many=True, read_only=True)

    class Meta:
        model = ImportJob
        fields = [
            "id",
            "package",
            "job_name",
            "source_type",
            "target_model",
            "tier",
            "file_name",
            "status",
            "total_rows",
            "processed_rows",
            "valid_rows",
            "accepted_rows",
            "rejected_rows",
            "duplicate_rows",
            "error_rows",
            "duration_seconds",
            "error_details",
            "metadata",
            "executed_at",
            "staging_records",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class ImportPackageItemSerializer(BaseModelSerializer):
    class Meta:
        model = ImportPackageItem
        fields = [
            "id",
            "file_name",
            "target_model",
            "tier",
            "status",
            "sequence_order",
            "row_count",
            "valid_rows",
            "error_count",
            "error_details",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class ImportPackageSerializer(BaseModelSerializer):
    items = ImportPackageItemSerializer(many=True, read_only=True)
    staging_records = StagingRecordSerializer(many=True, read_only=True)

    class Meta:
        model = ImportPackage
        fields = [
            "id",
            "package_name",
            "package_version",
            "status",
            "source_type",
            "parser_version",
            "manifest",
            "total_files",
            "total_rows",
            "processed_rows",
            "valid_rows",
            "accepted_rows",
            "rejected_rows",
            "duplicate_rows",
            "error_rows",
            "warning_count",
            "error_count",
            "duration_seconds",
            "executed_at",
            "items",
            "staging_records",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class StagingRecordViewSet(BaseAPIView):
    model = StagingRecord
    serializer_class = StagingRecordSerializer
    entity_name = "StagingRecord"
    view_id = "ADMIN_STAGING_RECORD_MGMT"

    paginate = True
    search_fields = ["target_model", "status", "idempotency_hash"]
    filter_schema = FilterSchema(
        status=FilterField(type=str),
        target_model=FilterField(type=str),
    )
    orderby = "row_number"


class ImportJobViewSet(BaseAPIView):
    model = ImportJob
    serializer_class = ImportJobSerializer
    entity_name = "ImportJob"
    view_id = "ADMIN_IMPORT_JOB_MGMT"

    paginate = True
    search_fields = ["job_name", "target_model", "status", "source_type"]
    filter_schema = FilterSchema(
        status=FilterField(type=str),
        target_model=FilterField(type=str),
        source_type=FilterField(type=str),
    )
    orderby = "-created_at"


class ImportPackageViewSet(BaseAPIView):
    model = ImportPackage
    serializer_class = ImportPackageSerializer
    entity_name = "ImportPackage"
    view_id = "ADMIN_IMPORT_PKG_MGMT"

    paginate = True
    search_fields = ["package_name", "package_version", "status", "source_type"]
    filter_schema = FilterSchema(
        status=FilterField(type=str),
        source_type=FilterField(type=str),
    )
    orderby = "-created_at"

    @action(detail=True, methods=["post"])
    def process(self, request, pk=None):
        package = self.get_object()
        dry_run = request.data.get("dry_run", True)
        files = request.data.get("files", {})  # file_name -> csv content

        result = ImportPipelineService.process_package(
            package=package,
            package_files=files,
            dry_run=dry_run,
            user=request.user,
        )
        return Response({"success": True, "data": result})
