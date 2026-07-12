from django.core.management.base import BaseCommand, CommandError
from django.core.management import call_command
import sys

class Command(BaseCommand):
    help = "Verify that the codebase and database migrations are in sync (ideal for CI/CD)."

    def handle(self, *args, **options):
        self.stdout.write("Checking for uncreated migrations...")
        try:
            # Check for missing migrations (models changed but match migrations)
            call_command('makemigrations', check=True, dry_run=True)
            self.stdout.write(self.style.SUCCESS("✓ No missing migrations detected."))
        except SystemExit:
            self.stderr.write(self.style.ERROR("✗ Missing migrations! Please run 'python manage.py make_schema'."))
            sys.exit(1)
        except Exception as e:
             self.stderr.write(self.style.ERROR(f"Migration check failed: {str(e)}"))
             sys.exit(1)

        self.stdout.write("Checking for unapplied migrations...")
        try:
            # Check if all migrations have been applied
            call_command('migrate', check=True)
            self.stdout.write(self.style.SUCCESS("✓ All migrations are applied."))
        except Exception as e:
            self.stderr.write(self.style.ERROR(f"✗ Unapplied migrations detected! Please run 'python manage.py migrate'."))
            sys.exit(1)
            
        self.stdout.write(self.style.SUCCESS("✓ Migration health check passed."))
