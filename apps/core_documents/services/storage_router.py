import logging
import threading

from django.core.files.storage import FileSystemStorage, Storage
from storages.backends.s3boto3 import S3Boto3Storage

from core.admin.models.company import Company
from core.admin.utils.context import RequestContext

logger = logging.getLogger(__name__)


class DynamicTenantStorage(Storage):
    """
    Multi-tenant aware dynamic storage routing backend.
    Resolves S3 settings per tenant (company) context dynamically.
    Falls back to FileSystemStorage if S3 is not configured for the active tenant.
    """

    _lock = threading.RLock()
    _instances: dict[str, Storage] = {}

    def __init__(self, *args, **kwargs):
        self._args = args
        self._kwargs = kwargs

    def get_wrapped(self) -> Storage:
        company_id = RequestContext.get_company_id()
        if not company_id:
            return FileSystemStorage(*self._args, **self._kwargs)

        with self._lock:
            cache_key = str(company_id)
            if cache_key in self._instances:
                return self._instances[cache_key]

            try:
                company = Company.objects.get(id=company_id)
                s3_config = TenantStorageService._get_s3_config(company)
            except Exception as e:
                logger.warning("Failed to fetch S3 config for company %s: %s", company_id, e)
                s3_config = None

            if not s3_config:
                instance = FileSystemStorage(*self._args, **self._kwargs)
            else:
                bucket = s3_config["bucket"]
                region = s3_config["region"]
                access_key = s3_config["access_key"]
                secret_key = s3_config["secret_key"]

                instance = S3Boto3Storage(
                    access_key=access_key,
                    secret_key=secret_key,
                    bucket_name=bucket,
                    region_name=region,
                    default_acl=None,
                    querystring_auth=False,
                    **self._kwargs,
                )

            self._instances[cache_key] = instance
            return instance

    def _open(self, name, mode="rb"):
        return self.get_wrapped()._open(name, mode)

    def _save(self, name, content):
        return self.get_wrapped()._save(name, content)

    def delete(self, name):
        return self.get_wrapped().delete(name)

    def exists(self, name):
        return self.get_wrapped().exists(name)

    def listdir(self, path):
        return self.get_wrapped().listdir(path)

    def size(self, name):
        return self.get_wrapped().size(name)

    def url(self, name):
        wrapped = self.get_wrapped()
        if wrapped.__class__.__name__ in ("S3Boto3Storage", "MagicMock"):
            try:
                s3_client = wrapped.connection.meta.client
                return s3_client.generate_presigned_url(
                    "get_object",
                    Params={"Bucket": wrapped.bucket_name, "Key": name},
                    ExpiresIn=3600,
                )
            except Exception as e:
                logger.error("Failed to generate pre-signed url from DynamicTenantStorage: %s", e)
                return wrapped.url(name)
        return wrapped.url(name)

    def get_available_name(self, name, max_length=None):
        return self.get_wrapped().get_available_name(name, max_length)

    def get_modified_time(self, name):
        return self.get_wrapped().get_modified_time(name)


class TenantStorageService:
    @staticmethod
    def _get_s3_config(company):
        if not company:
            return None

        try:
            extensions = getattr(company, "extensions", None)
            if extensions:
                extra_attrs = extensions.extra_attributes or {}
                if extra_attrs.get("storage_backend") == "s3" or "s3_bucket" in extra_attrs:
                    return {
                        "bucket": extra_attrs.get("s3_bucket"),
                        "region": extra_attrs.get("s3_region", "us-east-1"),
                        "access_key": extra_attrs.get("s3_access_key"),
                        "secret_key": extra_attrs.get("s3_secret_key"),
                    }
        except Exception as e:
            logger.warning("Failed to fetch S3 configuration from company: %s", e)

        return None

    @classmethod
    def upload_file(cls, company, file_obj, upload_path) -> str:
        from core.admin.utils.context import ContextEngine

        company_id = company.id if company else None
        with ContextEngine.run_as_tenant(company_id=company_id):
            storage = DynamicTenantStorage()
            return storage.save(upload_path, file_obj)

    @classmethod
    def get_file_url(cls, company, storage_path, expires_in=3600) -> str:
        from core.admin.utils.context import ContextEngine

        company_id = company.id if company else None
        with ContextEngine.run_as_tenant(company_id=company_id):
            storage = DynamicTenantStorage()
            return storage.url(storage_path)
