# apps/users/models/catalog.py
from django.db import models
from core.base_models.validator_model import BaseModel
from core.base_models.fields.char_fields import CustomCharField
from core.base_models.fields.short_ui_fields import CustomShortUUIDField

class BranchCatalog(BaseModel):
    """
    SaaS Blueprint: Defines the available modules and permission keys for a branch subscription tier.
    Scoped via Branch → BusinessUnit → Company → Subscription.
    """
    id = CustomShortUUIDField(primary_key=True)
    name = CustomCharField(max_length=100, unique=True, verbose_name="Catalog Name")
    description = models.TextField(blank=True)
    
    # System aggregation (e.g., ['hrms', 'operations', 'finance'])
    module_keys = models.JSONField(
        default=list, 
        blank=True,
        help_text="Aggregation of systems included in this catalog"
    )
    
    # Flattened permission keys allowed by this catalog
    allowed_permission_keys = models.JSONField(
        default=list, 
        blank=True,
        help_text="Subset of all possible permission keys allowed for this subscription"
    )

    class Meta:  # type: ignore
        db_table = "branch_catalogs"
        verbose_name = "Branch Catalog"
        verbose_name_plural = "Branch Catalogs"

    def clean(self):
        """
        Validate Catalog entries against the platform module registry.
        Keys matching the ``system:module:feature`` pattern are validated
        against modules.yaml. Custom verb keys (e.g. ``company:import``) are
        accepted as-is.
        """
        from core.admin.utils.module_navigator import navigator
        from django.core.exceptions import ValidationError
        
        # 1. Validate Permission Keys (only triple-colon keys against YAML)
        valid_keys = navigator.get_all_permission_keys()
        invalid_keys = [
            k for k in self.allowed_permission_keys
            if len(k.split(":")) >= 3 and k not in valid_keys
        ]
        if invalid_keys:
            raise ValidationError({
                "allowed_permission_keys": f"The following keys are not defined in modules.yaml: {invalid_keys}"
            })
            
        # 2. Validate System Dependencies
        missing_deps = navigator.validate_dependencies(self.module_keys)
        if missing_deps:
            raise ValidationError({
                "module_keys": f"Missing required system dependencies: {missing_deps}"
            })

    def _override_pre_save(self, is_creating: bool):
        self.full_clean()

    def __str__(self):
        return self.name
