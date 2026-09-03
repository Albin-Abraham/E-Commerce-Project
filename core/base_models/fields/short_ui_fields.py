from datetime import datetime
import calendar
import shortuuid
from django.db import models
from django.core import exceptions
from core.base_models.fields.mixins import RulesFieldMixin
import logging
import inspect


class CustomShortUUIDField(RulesFieldMixin, models.CharField):
    """
    Custom Django model field to generate short UUIDs with optional
    timestamp components and support for fluent validation rules.
    """

    def __init__(
        self,
        *args,
        day=False,
        month=False,
        year=False,
        month_format="short",
        prefix="",
        prefix_factory=None,
        prefix_config_key=None,
        prefix_config_default="",
        length=32,
        alphabet="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
        auto=True,
        editable=False,
        separator="-",
        debug=False,
        max_retries=5,
        rules=None,
        conditions=None,
        **kwargs,
    ):
        # --------------------------
        # Input validation
        # --------------------------
        if not isinstance(length, int) or length <= 0:
            raise ValueError("`length` must be a positive integer.")
        if not isinstance(alphabet, str) or len(alphabet) < 10:
            raise ValueError(
                "`alphabet` must be a string of at least 10 unique characters."
            )
        if not isinstance(separator, str) or len(separator) != 1:
            raise ValueError("`separator` must be a single-character string.")
        if month_format not in {"number", "short", "full"}:
            raise ValueError(
                "`month_format` must be one of: 'number', 'short', or 'full'."
            )

        # --------------------------
        # Store settings
        # --------------------------
        self.day = bool(day)
        self.month = bool(month)
        self.year = bool(year)
        self.month_format = month_format
        self.prefix = str(prefix) if prefix else ""
        self.prefix_factory = prefix_factory
        self.prefix_config_key = prefix_config_key
        self.prefix_config_default = str(prefix_config_default) if prefix_config_default else ""
        self.length = length
        self.alphabet = alphabet
        self.auto = bool(auto)
        self.separator = separator
        self.debug = bool(debug)
        self.max_retries = int(max_retries)

        kwargs["editable"] = editable

        # --------------------------
        # Compute expected max_length
        # --------------------------
        segments = []
        initial_prefix_sample = self.prefix or self.prefix_config_default or "PREFIX"
        if initial_prefix_sample:
            segments.append(initial_prefix_sample)
        if self.month:
            segments.append(
                {"number": "MM", "short": "MMM", "full": "Monthname"}[self.month_format]
            )
        if self.day:
            segments.append("DD")
        if self.year:
            segments.append("YYYY")
        segments.append("X" * self.length)

        self.expected_max_length = len(self.separator.join(segments))

        user_max_length = kwargs.get("max_length")
        if user_max_length and user_max_length < self.expected_max_length:
            # --- Get caller info ---
            frame = inspect.currentframe()
            outer_frames = inspect.getouterframes(frame)
            for f in outer_frames:
                filename = f.filename
                lineno = f.lineno
                if filename != __file__:
                    break

            # Try to guess model/table name
            model_name = None
            try:
                model_name = args[0].__name__
            except Exception:
                pass

            logging.warning(
                f"[CustomShortUUIDField] Provided max_length={user_max_length} "
                f"is too short. Expected ≥ {self.expected_max_length}. Using {self.expected_max_length}. "
                f"File: {filename}, Line: {lineno}, Model/Table: {model_name}"
            )

        kwargs["max_length"] = max(user_max_length or 0, self.expected_max_length)

        super().__init__(*args, rules=rules, conditions=conditions, **kwargs)

    def deconstruct(self):
        name, path, args, kwargs = super().deconstruct()
        if self.day: kwargs['day'] = self.day
        if self.month: kwargs['month'] = self.month
        if self.year: kwargs['year'] = self.year
        if self.month_format != 'short': kwargs['month_format'] = self.month_format
        if self.prefix: kwargs['prefix'] = self.prefix
        if self.prefix_factory: kwargs['prefix_factory'] = self.prefix_factory
        if self.prefix_config_key: kwargs['prefix_config_key'] = self.prefix_config_key
        if self.prefix_config_default: kwargs['prefix_config_default'] = self.prefix_config_default
        if self.length != 32: kwargs['length'] = self.length
        if self.alphabet != "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789": kwargs['alphabet'] = self.alphabet
        if not self.auto: kwargs['auto'] = self.auto
        if self.separator != "-": kwargs['separator'] = self.separator
        return name, path, args, kwargs

    # --------------------------
    # Internal helpers
    # --------------------------
    def _resolve_prefix(self, model_instance=None) -> str:
        """Resolve static, factory, or config-based prefix."""
        if self.prefix_config_key:
            try:
                from django.conf import settings
                p = getattr(settings, self.prefix_config_key, self.prefix_config_default)
                return str(p)
            except Exception:
                return self.prefix_config_default
        if callable(self.prefix_factory) and model_instance:
            try:
                p = self.prefix_factory(model_instance)
                return str(p) if p else ""
            except Exception as e:
                if self.debug:
                    logging.error(f"[CustomShortUUIDField] prefix_factory error: {e}")
                return ""
        return self.prefix

    def _get_month_str(self, dt: datetime) -> str:
        if not self.month:
            return ""
        if self.month_format == "number":
            return f"{dt.month:02d}"
        elif self.month_format == "short":
            return calendar.month_abbr[dt.month].upper()
        elif self.month_format == "full":
            return calendar.month_name[dt.month]
        return ""

    def _exists_in_db(self, model_instance, value) -> bool:
        """Check DB for duplicates if unique=True."""
        model_class = model_instance.__class__
        if not self.unique:
            return False
        return model_class.objects.filter(**{self.attname: value}).exists()

    # --------------------------
    # Core functionality
    # --------------------------
    def generate_uuid(self, model_instance=None) -> str:
        """Generate UUID string with configured format."""
        uuid_generator = shortuuid.ShortUUID(alphabet=self.alphabet)
        short_id = uuid_generator.random(length=self.length)

        now = datetime.now()
        segments = []
        prefix = self._resolve_prefix(model_instance)
        if prefix:
            segments.append(prefix)
        if self.month:
            segments.append(self._get_month_str(now))
        if self.day:
            segments.append(f"{now.day:02d}")
        if self.year:
            segments.append(str(now.year))
        segments.append(short_id)

        final = self.separator.join(segments)

        if self.debug:
            logging.info(f"[CustomShortUUIDField] Generated: {final}")

        return final

    def pre_save(self, model_instance, add):
        """Auto-generate UUID on create, with uniqueness enforcement."""
        value = getattr(model_instance, self.attname, None)

        if add and self.auto and not value:
            retries = 0
            while retries < self.max_retries:
                new_value = self.generate_uuid(model_instance)
                if not self._exists_in_db(model_instance, new_value):
                    setattr(model_instance, self.attname, new_value)
                    return new_value
                retries += 1
                logging.warning(
                    f"[CustomShortUUIDField] Collision detected, retry {retries}."
                )

            raise exceptions.ValidationError(
                f"Unable to generate a unique UUID after {self.max_retries} attempts."
            )

        return value

    def clean(self, value, model_instance):
        """Validate final value length."""
        value = super().clean(value, model_instance)
        if value and len(value) > self.max_length:
            raise exceptions.ValidationError(
                f"{self.name} value too long ({len(value)} > {self.max_length})"
            )
        return value

    def get_internal_type(self) -> str:
        return "CharField"