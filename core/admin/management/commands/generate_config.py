from django.core.management.base import BaseCommand
import yaml
import os
from core.admin.utils.discovery import auto_discovery_apps
from pathlib import Path

class Command(BaseCommand):
    help = "Generate a production configuration YAML file for discovered apps."

    def handle(self, *args, **options):
        self.stdout.write("Discovering apps...")
        apps = auto_discovery_apps()
        
        # Strip 'apps.' prefix for the config file if desired, 
        # but let's keep it consistent with Django's INSTALLED_APPS format.
        config_data = {
            "discovered_apps": apps,
            "total_count": len(apps)
        }
        
        project_root = Path(__file__).resolve().parent.parent.parent.parent.parent
        config_path = project_root / "config_apps.yaml"
        
        with open(config_path, 'w') as f:
            yaml.dump(config_data, f, default_flow_style=False)
            
        self.stdout.write(self.style.SUCCESS(f"Successfully generated {config_path}"))
