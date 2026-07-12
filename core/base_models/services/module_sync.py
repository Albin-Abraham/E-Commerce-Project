# core/base_models/services/module_sync.py
import yaml
import os
from django.db import transaction
from django.conf import settings
from core.base_models.system_models import SystemModule, SystemFeature, FeatureDependency

class ModuleSyncService:
    """
    Synchronizes the module_config.yaml with SystemModule and SystemFeature models.
    """

    @staticmethod
    def sync():
        config_path = os.path.join(
            settings.BASE_DIR, 
            "core", "base_models", "configs", "module_config.yaml"
        )
        
        if not os.path.exists(config_path):
            print(f"Config file not found: {config_path}")
            return

        with open(config_path, "r") as f:
            config = yaml.safe_load(f)

        with transaction.atomic():
            # 1. Sync Modules and Features
            modules_data = config.get("modules", {})
            for module_name, data in modules_data.items():
                module, _ = SystemModule.objects.update_or_create(
                    code=data["code"],
                    defaults={
                        "name": module_name,
                        "is_active": data.get("is_active", True),
                        "icon": data.get("icon"),
                        "color": data.get("color"),
                        "description": data.get("description"),
                    }
                )

                for feature_data in data.get("features", []):
                    # In your JSON, features sometimes have 'model' or 'models'
                    model_name = feature_data.get("model")
                    related_models = feature_data.get("models", [])
                    
                    SystemFeature.objects.update_or_create(
                        code=feature_data["code"],
                        defaults={
                            "module": module,
                            "name": feature_data.get("description", feature_data["code"]), # Use desc as name if missing
                            "model_name": model_name,
                            "related_models": related_models,
                            "is_enabled": feature_data.get("enable", True),
                            "description": feature_data.get("description"),
                            "special_permissions": feature_data.get("special", []),
                        }
                    )

            # 2. Sync Dependencies
            dependencies_data = config.get("dependencies", {})
            for feature_code, depends_on_list in dependencies_data.items():
                try:
                    feature = SystemFeature.objects.get(code=feature_code)
                    for dep_code in depends_on_list:
                        try:
                            dep_feature = SystemFeature.objects.get(code=dep_code)
                            FeatureDependency.objects.get_or_create(
                                feature=feature,
                                depends_on=dep_feature
                            )
                        except SystemFeature.DoesNotExist:
                            print(f"Dependency feature {dep_code} not found for {feature_code}")
                except SystemFeature.DoesNotExist:
                    print(f"Feature {feature_code} not found in dependencies sync")

        print("Module synchronization complete.")
