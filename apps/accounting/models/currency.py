import decimal
from django.db import models
from django.utils import timezone
from core.base_models.validator_model import BaseModel
from core.base_models.fields.short_ui_fields import CustomShortUUIDField
from core.base_models.fields.char_fields import CustomCharField
from core.base_models.validators.rules import RequiredRule, UniqueRule


class Currency(BaseModel):
    """
    Master Currency Entity for Multi-Currency Accounting, Pricing, and Regional Formatting.
    """

    SYMBOL_POSITION_CHOICES = (
        ("BEFORE", "Before amount e.g. $ 100 or $100"),
        ("AFTER", "After amount e.g. 100 SAR or 100SAR"),
        ("PREFIX", "Prefix e.g. $100"),
        ("SUFFIX", "Suffix e.g. 100 $"),
    )
    DIGIT_GROUPING_CHOICES = (
        ("WESTERN", "Western 3-Digit Standard (1,000,000)"),
        ("INDIAN_LAKHS", "South Asian / Indian Lakhs (10,00,000)"),
        ("EAST_ASIAN_MYRIADS", "East Asian 4-Digit Myriads (100,0000 / 1万)"),
        ("NONE", "No Block Separators (1000000)"),
    )
    ROUNDING_MODE_CHOICES = (
        ("HALF_UP", "Half Up (Standard Commercial 0.005 -> 0.01)"),
        ("HALF_EVEN", "Half Even (Banker's Rounding)"),
        ("FLOOR", "Floor (Truncate Excess Decimals)"),
        ("CEIL", "Ceil (Always Round Up)"),
    )

    code = CustomCharField(
        max_length=5,
        primary_key=True,
        rules=[RequiredRule("code"), UniqueRule("code")],
        help_text="ISO 4217 Alpha Currency Code e.g. USD, EUR, SAR, INR, KWD, JPY",
    )
    iso_numeric_code = models.CharField(
        max_length=3,
        blank=True,
        null=True,
        help_text="ISO 4217 Numeric Code e.g. 840 (USD), 682 (SAR), 356 (INR)",
    )
    name = CustomCharField(
        max_length=100,
        rules=[RequiredRule("name")],
        help_text="Display name e.g. United States Dollar, Saudi Riyal",
    )
    symbol = models.CharField(max_length=10, default="$")
    symbol_native = models.CharField(
        max_length=15,
        blank=True,
        null=True,
        help_text="Native localized symbol e.g. ر.س for SAR in Arabic, ₹ for INR",
    )
    symbol_position = models.CharField(
        max_length=10,
        choices=SYMBOL_POSITION_CHOICES,
        default="BEFORE",
    )
    include_symbol_space = models.BooleanField(
        default=False,
        help_text="Insert space between symbol and value e.g. '$ 100' (true) vs '$100' (false)",
    )
    decimal_places = models.PositiveSmallIntegerField(default=2)
    decimal_separator = models.CharField(max_length=5, default=".", help_text="Fractional separator e.g. '.' or ','")
    thousand_separator = models.CharField(max_length=5, default=",", help_text="Block separator e.g. ',' or '.' or space ' ' or single quote '\''")
    digit_grouping = models.CharField(
        max_length=25,
        choices=DIGIT_GROUPING_CHOICES,
        default="WESTERN",
    )
    subunit_name = models.CharField(max_length=30, default="Cent", help_text="Fractional unit e.g. Cent, Halala, Paisa, Fils")
    subunit_to_unit = models.PositiveIntegerField(default=100, help_text="Subunits per main unit e.g. 100 Cents = 1 Dollar, 1000 Fils = 1 Dinar")
    rounding_mode = models.CharField(
        max_length=20,
        choices=ROUNDING_MODE_CHOICES,
        default="HALF_UP",
    )
    is_active = models.BooleanField(default=True)
    is_base_supported = models.BooleanField(default=True)

    class Meta(BaseModel.Meta):
        db_table = "accounting_currencies"
        ordering = ["code"]
        verbose_name = "Currency"
        verbose_name_plural = "Currencies"

    def __str__(self):
        return f"{self.code} ({self.symbol})"

    @property
    def sample_format(self) -> str:
        """
        Returns a sample formatted output for admin UI preview (e.g. '$ 1,234,567.89' or '1 234 567,89 €').
        """
        return self.format_amount(1234567.89)

    def format_amount(self, amount: float) -> str:
        """
        Formats a numeric amount according to symbol, position, spacing, decimal places, block separator, and digit grouping.
        """
        if amount is None:
            return ""

        val_str = f"{float(amount):.{self.decimal_places}f}"
        parts = val_str.split(".")
        integer_part = parts[0]
        fractional_part = parts[1] if len(parts) > 1 else ""
        sep = self.thousand_separator

        if self.digit_grouping == "INDIAN_LAKHS":
            if len(integer_part) > 3:
                last_three = integer_part[-3:]
                other_digits = integer_part[:-3]
                formatted_int = ""
                while len(other_digits) > 2:
                    formatted_int = sep + other_digits[-2:] + formatted_int
                    other_digits = other_digits[:-2]
                formatted_int = other_digits + formatted_int + sep + last_three
            else:
                formatted_int = integer_part
        elif self.digit_grouping == "EAST_ASIAN_MYRIADS":
            if len(integer_part) > 4:
                formatted_int = ""
                rem = integer_part
                while len(rem) > 4:
                    formatted_int = sep + rem[-4:] + formatted_int
                    rem = rem[:-4]
                formatted_int = rem + formatted_int
            else:
                formatted_int = integer_part
        elif self.digit_grouping == "NONE":
            formatted_int = integer_part
        else:  # WESTERN (3-digit blocks)
            if len(integer_part) > 3:
                formatted_int = ""
                rem = integer_part
                while len(rem) > 3:
                    formatted_int = sep + rem[-3:] + formatted_int
                    rem = rem[:-3]
                formatted_int = rem + formatted_int
            else:
                formatted_int = integer_part

        formatted_val = formatted_int
        if self.decimal_places > 0 and fractional_part:
            formatted_val += self.decimal_separator + fractional_part

        space_str = " " if self.include_symbol_space else ""

        if self.symbol_position in ["AFTER", "SUFFIX"]:
            return f"{formatted_val}{space_str}{self.symbol}"
        return f"{self.symbol}{space_str}{formatted_val}"


class CurrencyExchangeRate(BaseModel):
    """
    Real-time & Historical Foreign Exchange (FX) Conversion Rates with Inverse & Spot/Corporate Rate Support.
    """

    RATE_TYPE_CHOICES = (
        ("SPOT", "Live Market Spot Rate"),
        ("CORPORATE", "Fixed Corporate Accounting Rate"),
        ("CUSTOM", "Customer / Contract Specific Rate"),
    )

    id = CustomShortUUIDField(primary_key=True, prefix="fx_")
    from_currency = models.ForeignKey(
        Currency,
        on_delete=models.CASCADE,
        related_name="outgoing_rates",
    )
    to_currency = models.ForeignKey(
        Currency,
        on_delete=models.CASCADE,
        related_name="incoming_rates",
    )
    rate_type = models.CharField(
        max_length=20,
        choices=RATE_TYPE_CHOICES,
        default="SPOT",
    )
    exchange_rate = models.DecimalField(
        max_digits=18,
        decimal_places=6,
        help_text="Multiplier to convert from_currency to to_currency",
    )
    effective_date = models.DateTimeField(default=timezone.now)
    source_provider = models.CharField(
        max_length=50,
        default="FIXER_IO",
        help_text="Exchange rate provider e.g. FIXER_IO, OPEN_EXCHANGE_RATES, MANUAL",
    )

    class Meta(BaseModel.Meta):
        db_table = "accounting_currency_exchange_rates"
        ordering = ["-effective_date"]
        verbose_name = "Currency Exchange Rate"
        verbose_name_plural = "Currency Exchange Rates"
        unique_together = [("from_currency", "to_currency", "rate_type", "effective_date")]

    def __str__(self):
        return f"1 {self.from_currency.code} = {self.exchange_rate} {self.to_currency.code} [{self.rate_type}]"

    @property
    def inverse_rate(self) -> decimal.Decimal:
        """
        Calculates inverse FX exchange rate (1 / exchange_rate).
        """
        if self.exchange_rate > 0:
            return round(decimal.Decimal(1.0) / decimal.Decimal(self.exchange_rate), 6)
        return decimal.Decimal(0.0)

    @classmethod
    def convert_amount(cls, amount: decimal.Decimal, from_code: str, to_code: str, rate_type: str = "SPOT") -> decimal.Decimal:
        """
        Converts an amount from one currency to another using latest available FX exchange rate.
        Supports direct rates, inverse rates, and 1:1 same-currency shortcuts.
        """
        if from_code == to_code:
            return amount

        # Try direct rate
        direct_rate = cls.objects.filter(
            from_currency_id=from_code,
            to_currency_id=to_code,
            rate_type=rate_type,
        ).order_by("-effective_date").first()

        if direct_rate:
            return amount * direct_rate.exchange_rate

        # Try inverse rate
        inverse_rate = cls.objects.filter(
            from_currency_id=to_code,
            to_currency_id=from_code,
            rate_type=rate_type,
        ).order_by("-effective_date").first()

        if inverse_rate and inverse_rate.exchange_rate > 0:
            return amount / inverse_rate.exchange_rate

        # Fallback return original amount if no rate found
        return amount


class CompanyCurrencySetting(BaseModel):
    """
    Tenant/Company Multi-Currency Configuration & FX Volatility Rules.
    """

    company = models.OneToOneField(
        "core_admin.Company",
        on_delete=models.CASCADE,
        related_name="currency_setting",
        primary_key=True,
    )
    base_currency = models.ForeignKey(
        Currency,
        on_delete=models.PROTECT,
        related_name="company_base_settings",
        help_text="Company General Ledger reporting currency",
    )
    allow_multi_currency_sales = models.BooleanField(default=True)
    allow_multi_currency_purchases = models.BooleanField(default=True)
    exchange_rate_buffer_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0.50,
        help_text="FX volatility buffer percentage e.g. 0.50%",
    )

    class Meta(BaseModel.Meta):
        db_table = "company_currency_settings"
        verbose_name = "Company Currency Setting"
        verbose_name_plural = "Company Currency Settings"

    def __str__(self):
        return f"Currency Settings for {self.company.name} (Base: {self.base_currency.code})"
