from django.db.models import Model


def get_field_choices(model: Model, field_name: str):
    """Return list of dicts [{'value': ..., 'label': ...}] for a model field's choices."""
    if not model or not field_name:
        raise ValueError("Model and field_name are required.")
    field = model._meta.get_field(field_name)
    if not getattr(field, "choices", None):
        return []
    return [{"value": value, "label": label} for value, label in field.choices]