from django.db import models
from core.base_models.validator_model import BaseModel
from core.base_models.constants import USER_MODEL
from core.base_models.fields.short_ui_fields import CustomShortUUIDField
from core.base_models.fields.char_fields import CustomCharField, CustomEmailField, CustomTextField
from core.base_models.validators.rules import RequiredRule, UniqueRule
from apps.customers.valuesets import (
    ADDRESS_TYPE_VALUESET,
    CONTACT_TYPE_VALUESET,
    CUSTOMER_TYPE_VALUESET,
)


class Customer(BaseModel):
    """
    Unified Customer Entity for B2C Retail & B2B Commercial Sales.
    """

    id = CustomShortUUIDField(primary_key=True, prefix="cust_")
    customer_code = CustomCharField(
        max_length=50,
        rules=[RequiredRule("customer_code"), UniqueRule("customer_code")],
        help_text="Unique customer identifier code.",
    )
    user = models.OneToOneField(
        USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="customer_account",
        help_text="Optional link to authenticated portal user.",
    )
    name = CustomCharField(
        max_length=200,
        rules=[RequiredRule("name")],
        help_text="Customer display name or business entity name.",
    )
    customer_type = models.CharField(
        max_length=30,
        choices=CUSTOMER_TYPE_VALUESET.as_django_choices(),
        default="INDIVIDUAL",
    )
    email = CustomEmailField(blank=True, null=True)
    phone = models.CharField(max_length=30, blank=True, null=True)
    tax_id = models.CharField(max_length=50, blank=True, null=True, help_text="Tax / VAT / GST Registration ID")
    credit_limit = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    is_active = models.BooleanField(default=True)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta(BaseModel.Meta):
        db_table = "customers"
        ordering = ["name"]
        verbose_name = "Customer"
        verbose_name_plural = "Customers"

    def __str__(self):
        return f"{self.name} ({self.customer_code})"


class CustomerPreference(BaseModel):
    """
    Customer preferences for multi-channel communication, language, and purchasing defaults.
    """

    customer = models.OneToOneField(
        Customer,
        on_delete=models.CASCADE,
        related_name="preferences",
        primary_key=True,
    )
    preferred_language = models.CharField(max_length=10, default="en")
    preferred_currency = models.CharField(max_length=5, default="USD")
    newsletter_opt_in = models.BooleanField(default=False)
    sms_notifications = models.BooleanField(default=True)
    email_notifications = models.BooleanField(default=True)
    whatsapp_notifications = models.BooleanField(default=False)
    default_payment_method = models.CharField(max_length=50, blank=True, null=True)
    custom_settings = models.JSONField(default=dict, blank=True)

    class Meta(BaseModel.Meta):
        db_table = "customer_preferences"
        verbose_name = "Customer Preference"
        verbose_name_plural = "Customer Preferences"

    def __str__(self):
        return f"Preferences for {self.customer.name}"


class CustomerAddress(BaseModel):
    """
    Address Lines for delivery, shipping, and billing connected with Selling & Logistics.
    """

    id = CustomShortUUIDField(primary_key=True, prefix="addr_")
    customer = models.ForeignKey(
        Customer,
        on_delete=models.CASCADE,
        related_name="address_lines",
    )
    title = models.CharField(max_length=100, default="Home", help_text="Label e.g. Home, Office, Warehouse 1")
    address_type = models.CharField(
        max_length=20,
        choices=ADDRESS_TYPE_VALUESET.as_django_choices(),
        default="DELIVERY",
    )
    attention_to = models.CharField(max_length=150, blank=True, null=True, help_text="Recipient name")
    address_line_1 = CustomCharField(
        max_length=255,
        rules=[RequiredRule("address_line_1")],
    )
    address_line_2 = models.CharField(max_length=255, blank=True, null=True)
    city = CustomCharField(max_length=100, rules=[RequiredRule("city")])
    state = models.CharField(max_length=100, blank=True, null=True)
    postal_code = CustomCharField(max_length=20, rules=[RequiredRule("postal_code")])
    country = CustomCharField(max_length=100, default="USA", rules=[RequiredRule("country")])
    pincode = models.CharField(max_length=20, blank=True, null=True, help_text="Serviceability pincode")
    is_default_delivery = models.BooleanField(default=False)
    is_default_billing = models.BooleanField(default=False)

    class Meta(BaseModel.Meta):
        db_table = "customer_address_lines"
        ordering = ["-is_default_delivery", "title"]
        verbose_name = "Customer Address Line"
        verbose_name_plural = "Customer Address Lines"

    def save(self, *args, **kwargs):
        if self.is_default_delivery:
            CustomerAddress.objects.filter(customer=self.customer, is_default_delivery=True).exclude(pk=self.pk).update(is_default_delivery=False)
        if self.is_default_billing:
            CustomerAddress.objects.filter(customer=self.customer, is_default_billing=True).exclude(pk=self.pk).update(is_default_billing=False)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.title}: {self.address_line_1}, {self.city} ({self.postal_code})"


class CustomerContact(BaseModel):
    """
    Contact Lines connected with Selling, Account Managers, and Orders.
    """

    id = CustomShortUUIDField(primary_key=True, prefix="cnt_")
    customer = models.ForeignKey(
        Customer,
        on_delete=models.CASCADE,
        related_name="contact_lines",
    )
    contact_name = CustomCharField(
        max_length=150,
        rules=[RequiredRule("contact_name")],
    )
    designation = models.CharField(max_length=100, blank=True, null=True, help_text="e.g. Procurement Officer, Manager")
    contact_type = models.CharField(
        max_length=20,
        choices=CONTACT_TYPE_VALUESET.as_django_choices(),
        default="PRIMARY",
    )
    email = CustomEmailField(blank=True, null=True)
    phone = models.CharField(max_length=30, blank=True, null=True)
    mobile = models.CharField(max_length=30, blank=True, null=True)
    is_primary = models.BooleanField(default=False)

    class Meta(BaseModel.Meta):
        db_table = "customer_contact_lines"
        ordering = ["-is_primary", "contact_name"]
        verbose_name = "Customer Contact Line"
        verbose_name_plural = "Customer Contact Lines"

    def save(self, *args, **kwargs):
        if self.is_primary:
            CustomerContact.objects.filter(customer=self.customer, is_primary=True).exclude(pk=self.pk).update(is_primary=False)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.contact_name} ({self.contact_type}) - {self.email or self.phone}"


class SocialAccount(BaseModel):
    """
    OAuth Social Authentication Login Accounts (Google, GitHub, Facebook, Apple, Microsoft).
    Links OAuth identity providers to portal User logins and Customer profiles.
    """

    id = CustomShortUUIDField(primary_key=True, prefix="soc_")
    user = models.ForeignKey(
        USER_MODEL,
        on_delete=models.CASCADE,
        related_name="social_accounts",
    )
    provider = models.CharField(
        max_length=30,
        help_text="OAuth Provider e.g. GOOGLE, GITHUB, FACEBOOK, APPLE, MICROSOFT",
    )
    uid = models.CharField(max_length=255, help_text="Provider unique user identifier")
    avatar_url = models.URLField(max_length=500, blank=True, null=True)
    extra_data = models.JSONField(default=dict, blank=True)
    last_login_at = models.DateTimeField(null=True, blank=True)

    class Meta(BaseModel.Meta):
        db_table = "customer_social_accounts"
        unique_together = [("provider", "uid")]
        ordering = ["-created_at"]
        verbose_name = "Social Account"
        verbose_name_plural = "Social Accounts"

    def __str__(self):
        return f"{self.provider} ({self.uid}) -> {self.user}"
