from django.core.management import call_command
from io import StringIO

class SeedingMixin:
    """
    Mixin to facilitate testing of management commands and seed-data.
    """
    def run_seed_command(self, section):
        out = StringIO()
        call_command('seeds_data', section=section, stdout=out)
        return out.getvalue()
