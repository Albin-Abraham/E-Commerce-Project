import os
import shutil
from datetime import datetime
from django.core.management.base import BaseCommand, CommandError
from django.apps import apps
from django.conf import settings

class Command(BaseCommand):
    help = "Backup migration files for an app or all apps. Essential before manual edits or squashing."

    def add_arguments(self, parser):
        parser.add_argument('app_label', nargs='?', type=str, help='Specific app to backup migrations for. If omitted, backups all apps.')
        parser.add_argument('--target', type=str, default='migrations_backup', help='Directory to store backups.')

    def handle(self, *args, **options):
        app_label = options['app_label']
        target_base = options['target']
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_dir = os.path.join(settings.BASE_DIR, target_base, timestamp)
        
        if not os.path.exists(backup_dir):
            os.makedirs(backup_dir)

        if app_label:
            try:
                app_configs = [apps.get_app_config(app_label)]
            except LookupError:
                raise CommandError(f"App '{app_label}' not found.")
        else:
            app_configs = apps.get_app_configs()

        backed_up_count = 0
        for config in app_configs:
            migrations_path = os.path.join(config.path, 'migrations')
            if os.path.exists(migrations_path):
                dest_path = os.path.join(backup_dir, config.label)
                shutil.copytree(migrations_path, dest_path)
                backed_up_count += 1
                self.stdout.write(f"✓ Backed up migrations for {config.label}")

        if backed_up_count > 0:
            self.stdout.write(self.style.SUCCESS(f"Successfully backed up {backed_up_count} apps to {backup_dir}"))
        else:
            self.stdout.write(self.style.WARNING("No migration directories found to backup."))
