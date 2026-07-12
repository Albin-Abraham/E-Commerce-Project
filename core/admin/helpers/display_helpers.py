from string import Formatter

from django.db.models import Model


def get_display_name(
    instance: Model, display_field=None, display_format=None, logger=None
) -> str:
    try:
        if display_format:
            formatter = Formatter()
            fields = [f for _, f, _, _ in formatter.parse(display_format) if f]
            display_str = display_format.format(
                **{f: getattr(instance, f, "") for f in fields}
            ).strip()
        elif display_field:
            if isinstance(display_field, str):
                display_str = str(getattr(instance, display_field, "")).strip()
            elif isinstance(display_field, (list | tuple)):
                display_str = " ".join(
                    filter(
                        None,
                        [str(getattr(instance, f, "")).strip() for f in display_field],
                    )
                )
            else:
                display_str = ""
        else:
            display_str = ""
        return (
            f"{display_str} (ID {instance.id})"
            if display_str
            else f"(ID {instance.id})"
        )
    except Exception as e:
        if logger:
            logger.warning(f"Error generating display name for {instance}: {e}")
        return f"(ID {instance.id})"