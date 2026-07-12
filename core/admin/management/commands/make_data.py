from django.core.management.base import BaseCommand, CommandError
from django.core.management import call_command
import sys

class Command(BaseCommand):
    help = "Generate a named, empty data migration for separating schema from populating data."

    def add_arguments(self, parser):
        parser.add_argument('app', type=str, help='The app to create the data migration for.')
        parser.add_argument('--name', '-n', type=str, required=True, help='Descriptive name (e.g., populate_default_orgs).')

    def handle(self, *args, **options):
        app = options['app']
        name = options['name']
        
        if not name or len(name) < 5:
            raise CommandError("Please provide a descriptive name for the data migration (at least 5 characters).")

        self.stdout.write(self.style.SUCCESS(f"Creating empty data migration for '{app}': {name}"))
        
        try:
            call_command('makemigrations', app, empty=True, name=name)
        except Exception as e:
            self.stderr.write(self.style.ERROR(f"Data migration generation failed: {str(e)}"))
            sys.exit(1)
