from django.core.management.base import BaseCommand, CommandError
from django.core.management import call_command
import sys

class Command(BaseCommand):
    help = "Guided squash of migrations to keep history clean. Recommended before major releases."

    def add_arguments(self, parser):
        parser.add_argument('app_label', type=str, help='The app to squash migrations for.')
        parser.add_argument('start_migration', type=str, help='The first migration name to squash.')
        parser.add_argument('end_migration', type=str, help='The last migration name to squash.')

    def handle(self, *args, **options):
        app_label = options['app_label']
        start_migration = options['start_migration']
        end_migration = options['end_migration']
        
        self.stdout.write(self.style.WARNING(f"! ATTENTION: About to squash {app_label} migrations from {start_migration} to {end_migration}."))
        
        # We call squashmigrations with the app and the start/end
        # Note: squashmigrations in Django takes the 'app' and 'start'/'end' in a different way or positional args
        # usually: squashmigrations app_label start_migration_name end_migration_name
        
        try:
            call_command('squashmigrations', app_label, start_migration, end_migration, interactive=False)
            self.stdout.write(self.style.SUCCESS(f"✓ Squashed migrations for {app_label}."))
            self.stdout.write(self.style.SUCCESS("✓ Please review the newly created squashed migration file."))
        except Exception as e:
            self.stderr.write(self.style.ERROR(f"Squash failed: {str(e)}"))
            sys.exit(1)
