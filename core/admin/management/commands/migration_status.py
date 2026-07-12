from django.core.management.base import BaseCommand
from django.core.management import call_command

class Command(BaseCommand):
    help = "Show the current status of all migrations across the system."

    def add_arguments(self, parser):
        parser.add_argument('app', nargs='*', type=str, help='Specific app(s) to check.')

    def handle(self, *args, **options):
        apps = options['app']
        self.stdout.write(self.style.HTTP_INFO("Fetching migration status..."))
        call_command('showmigrations', *apps)
