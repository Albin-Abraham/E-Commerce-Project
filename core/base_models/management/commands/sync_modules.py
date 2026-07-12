# core/base_models/management/commands/sync_modules.py
from django.core.management.base import BaseCommand
from core.base_models.services.module_sync import ModuleSyncService

class Command(BaseCommand):
    help = "Synchronizes the module_config.yaml with SystemModule and SystemFeature models."

    def handle(self, *args, **options):
        self.stdout.write("Starting module synchronization...")
        ModuleSyncService.sync()
        self.stdout.write(self.style.SUCCESS("Successfully synchronized modules and features."))
