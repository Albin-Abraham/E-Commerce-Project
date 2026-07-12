from django.core.management.base import BaseCommand, CommandError
from django.core.management import call_command
import sys

class Command(BaseCommand):
    help = "Enforce descriptive naming for schema migrations. Avoids 'catch-all' migrations."

    def add_arguments(self, parser):
        parser.add_argument('apps', nargs='*', type=str, help='Apps to make migrations for.')
        parser.add_argument('--name', '-n', type=str, required=True, help='A descriptive name for the migration.')
        parser.add_argument('--app', type=str, help='Specific app to target (alternative to positional apps).')

    def handle(self, *args, **options):
        apps = options['apps']
        if options['app']:
            apps.append(options['app'])
        
        name = options['name']
        
        if not name or len(name) < 5:
            raise CommandError("Please provide a descriptive name for the migration (at least 5 characters).")

        self.stdout.write(self.style.SUCCESS(f"Generating logical schema migration: {name}"))
        
        try:
            call_command('makemigrations', *apps, name=name)
        except Exception as e:
            self.stderr.write(self.style.ERROR(f"Migration generation failed: {str(e)}"))
            sys.exit(1)
