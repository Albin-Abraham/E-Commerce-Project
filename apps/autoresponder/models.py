import re
import logging
from django.db import models
from core.base_models.validator_model import BaseModel
from core.base_models.fields.short_ui_fields import CustomShortUUIDField
from core.base_models.fields.char_fields import CustomCharField
from shared_domain.base.valuesets import ValueSet, ValueSetItem

logger = logging.getLogger(__name__)

NOTIFICATION_MEDIUM_VALUESET = ValueSet(
    name="notification_medium",
    domain="autoresponder",
    items=[
        ValueSetItem("EXTERNAL_EMAIL", "External Customer Email"),
        ValueSetItem("INTERNAL_EMAIL", "Internal Staff Email"),
        ValueSetItem("PUSH_NOTIFICATION", "Mobile / Web Push Notification"),
        ValueSetItem("SMS", "SMS Text Message"),
    ],
)


AUTORESPONDER_EVENT_KEY_VALUESET = ValueSet(
    name="autoresponder_event_keys",
    domain="autoresponder",
    items=[
        ValueSetItem("CUSTOMER_WELCOME", "Customer Welcome & Onboarding"),
        ValueSetItem("PASSWORD_RESET", "Password Reset Request"),
        ValueSetItem("SOCIAL_OAUTH_LINKED", "Social OAuth Account Linked"),
        ValueSetItem("ORDER_CONFIRMED", "Order Confirmed & Placed"),
        ValueSetItem("ORDER_CANCELLED", "Order Cancelled"),
        ValueSetItem("ORDER_SHIPPED", "Order Shipped & Out for Delivery"),
        ValueSetItem("ORDER_DELIVERED", "Order Successfully Delivered"),
        ValueSetItem("PAYMENT_SUCCESS", "Payment Successfully Captured"),
        ValueSetItem("PAYMENT_FAILED", "Payment Processing Failed"),
        ValueSetItem("REFUND_PROCESSED", "Customer Refund Processed"),
        ValueSetItem("PO_APPROVAL_REQUESTED", "Purchase Order Approval Required"),
        ValueSetItem("STOCK_REORDER_ALERT", "Inventory Reorder Threshold Breached"),
    ],
)


class AutoResponderEvent(BaseModel):
    """
    AutoResponder Event Template Model based on yafei-hospital yf_autoresponder.
    Stores customizable email and notification templates with placeholder support.
    """
    id = CustomShortUUIDField(prefix="evt_", primary_key=True)
    key = CustomCharField(max_length=100, choices=AUTORESPONDER_EVENT_KEY_VALUESET.as_django_choices(), unique=True, db_index=True)
    title = CustomCharField(max_length=255)
    subject_template = CustomCharField(max_length=255, default="Notification from Storefront")
    content_template = models.TextField(help_text="Use placeholders like {{user}}, {{customer_name}}, {{order_number}}, {{amount}}")
    short_content = models.CharField(max_length=255, blank=True, null=True, help_text="Short content for push notifications / SMS")
    medium = models.JSONField(default=list, help_text="List of media e.g. ['EXTERNAL_EMAIL', 'PUSH_NOTIFICATION']")
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "autoresponder_events"
        verbose_name = "AutoResponder Event"
        verbose_name_plural = "AutoResponder Events"
        ordering = ["key"]

    def __str__(self):
        return f"[{self.key}] {self.title}"

    def render_content(self, context: dict) -> str:
        """
        Renders template placeholders using context dictionary.
        """
        content = self.content_template
        for key, val in context.items():
            content = content.replace(f"{{{{{key}}}}}", str(val))
        return content

    def render_subject(self, context: dict) -> str:
        subject = self.subject_template
        for key, val in context.items():
            subject = subject.replace(f"{{{{{key}}}}}", str(val))
        return subject


class NotificationLog(BaseModel):
    """
    Audit log for dispatched autoresponder emails & notifications.
    """
    id = CustomShortUUIDField(prefix="nlog_", primary_key=True)
    event_key = models.CharField(max_length=100, db_index=True)
    recipient_email = models.EmailField(db_index=True)
    medium_used = models.CharField(max_length=50)
    rendered_subject = models.CharField(max_length=255)
    rendered_content = models.TextField()
    status = models.CharField(max_length=30, default="DISPATCHED")
    error_message = models.TextField(blank=True, null=True)

    class Meta:
        db_table = "autoresponder_notification_logs"
        verbose_name = "Notification Log"
        verbose_name_plural = "Notification Logs"
        ordering = ["-created_at"]


class UserDeviceToken(BaseModel):
    """
    Stores FCM registration device tokens for mobile & web push notifications.
    Ported from yafei-hospital FirebaseUserDevices.
    """
    id = CustomShortUUIDField(prefix="fcm_", primary_key=True)
    user_id = models.CharField(max_length=100, db_index=True)
    device_token = models.TextField(unique=True, db_index=True)
    device_type = models.CharField(max_length=20, default="ANDROID", choices=[("ANDROID", "Android"), ("IOS", "iOS"), ("WEB", "Web Browser")])
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "user_device_tokens"
        verbose_name = "User Device Token"
        verbose_name_plural = "User Device Tokens"
        ordering = ["-created_at"]

    def __str__(self):
        return f"[{self.device_type}] User {self.user_id} - Token {self.device_token[:10]}..."
