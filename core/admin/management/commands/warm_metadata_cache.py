from django.core.management.base import BaseCommand
from django.apps import apps
from core.admin.helpers.rule_selector import RuleSelector
from core.admin.helpers.cache_helpers import set_cached_metadata, get_metadata_cache_key
import logging

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Warm up the Redis metadata cache for all model rules'

    def handle(self, *args, **options):
        self.stdout.write("Warming up metadata cache...")
        
        # We focus on models that likely have rules
        all_models = apps.get_models()
        contexts = ["web", "mobile", "default"]
        
        for model in all_models:
            model_name = model.__name__
            for context in contexts:
                selector = RuleSelector(model, context={"platform": context})
                # Disable cache for the selector during warmup to ensure we get fresh data
                selector._cache_enabled = False
                
                # Build the rule-set dictionary
                rule_set = {}
                if hasattr(model, "_meta"):
                    for field in model._meta.fields:
                        rules = selector.get_field_rules(field.name)
                        if rules:
                            # In a real app, we would serialize the rules to JSON
                            # For this demo, we'll store a representation
                            rule_set[field.name] = [r.__class__.__name__ for r in rules]
                
                if rule_set:
                    cache_key = get_metadata_cache_key(model_name, context=context)
                    set_cached_metadata(cache_key, rule_set)
                    self.stdout.write(self.style.SUCCESS(f"Cached {model_name} for context: {context}"))

        self.stdout.write(self.style.SUCCESS("Metadata cache warming complete."))
