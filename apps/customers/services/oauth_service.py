import logging
from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone
from django.utils.crypto import get_random_string
from apps.customers.models.customer import Customer, SocialAccount
from apps.customers.services.registration_service import CustomerRegistrationService
from core.services.gcp_storage_service import GCPStorageService

User = get_user_model()
logger = logging.getLogger(__name__)

SUPPORTED_OAUTH_PROVIDERS = {"GOOGLE", "GITHUB", "FACEBOOK", "APPLE", "MICROSOFT"}


class SocialOAuthAuthService:
    """
    OAuth Social Authentication Engine integrated with Google Cloud Bucket Storage & Google API Key.
    Processes Social Sign-In / Single Sign-On (SSO) with Google, GitHub, Facebook, Apple, Microsoft.
    Verifies OAuth identity tokens and mirrors profile avatars into our Google Storage Bucket.
    """

    @classmethod
    def verify_and_authenticate_google_token(cls, id_token: str) -> tuple[User, Customer, SocialAccount, bool]:
        """
        Verifies Google OAuth ID Token with Google OAuth API Key and authenticates/registers user.
        """
        google_profile = GCPStorageService.verify_google_oauth_token(id_token)
        provider_uid = google_profile.get("sub") or google_profile.get("user_id")
        email = google_profile.get("email")
        full_name = google_profile.get("name", "Google User")
        avatar_url = google_profile.get("picture")

        return cls.authenticate_or_register_social_user(
            provider="GOOGLE",
            provider_uid=provider_uid,
            email=email,
            full_name=full_name,
            avatar_url=avatar_url,
            extra_data=google_profile,
        )

    @classmethod
    @transaction.atomic
    def authenticate_or_register_social_user(
        cls,
        provider: str,
        provider_uid: str,
        email: str,
        full_name: str,
        avatar_url: str | None = None,
        extra_data: dict | None = None,
    ) -> tuple[User, Customer, SocialAccount, bool]:
        """
        Authenticates an existing OAuth user or registers a new User + Customer profile.
        Automatically mirrors profile pictures to our Google Cloud Storage Bucket.
        Returns: (user, customer, social_account, created)
        """
        provider_clean = provider.strip().upper()
        if provider_clean not in SUPPORTED_OAUTH_PROVIDERS:
            raise ValueError(f"Unsupported OAuth provider '{provider}'. Must be one of {SUPPORTED_OAUTH_PROVIDERS}")

        if not provider_uid or not email:
            raise ValueError("provider_uid and email are required for social authentication.")

        email_clean = email.strip().lower()

        # 1. Check if SocialAccount link already exists
        social_acc = SocialAccount.objects.filter(provider=provider_clean, uid=provider_uid).first()
        if social_acc:
            user = social_acc.user
            customer = Customer.objects.filter(user=user).first()

            # Mirror avatar to Google Storage Bucket
            gcs_avatar_url = GCPStorageService.upload_social_avatar_to_bucket(avatar_url, str(user.id)) if avatar_url else social_acc.avatar_url

            social_acc.last_login_at = timezone.now()
            if gcs_avatar_url:
                social_acc.avatar_url = gcs_avatar_url
            if extra_data:
                social_acc.extra_data = extra_data
            social_acc.save(update_fields=["last_login_at", "avatar_url", "extra_data", "updated_at"])
            logger.info(f"Social login for existing user {user.username} via provider {provider_clean}")
            return user, customer, social_acc, False

        # 2. Check if User with matching email already exists
        user = User.objects.filter(email=email_clean).first()
        if user:
            customer = Customer.objects.filter(user=user).first()

            # Mirror avatar to Google Storage Bucket
            gcs_avatar_url = GCPStorageService.upload_social_avatar_to_bucket(avatar_url, str(user.id)) if avatar_url else None

            social_acc = SocialAccount.objects.create(
                user=user,
                provider=provider_clean,
                uid=provider_uid,
                avatar_url=gcs_avatar_url,
                extra_data=extra_data or {},
                last_login_at=timezone.now(),
            )
            logger.info(f"Linked new social provider {provider_clean} to existing user {user.username}")
            return user, customer, social_acc, False

        # 3. Create brand new User + Customer profile via CustomerRegistrationService
        username_candidate = f"{email_clean.split('@')[0]}_{provider_clean.lower()}"
        if User.objects.filter(username=username_candidate).exists():
            username_candidate = f"{username_candidate}_{provider_uid[:4]}"

        # Generate temporary random password for OAuth social user
        temp_pass = get_random_string(32)

        user, customer = CustomerRegistrationService.register_customer(
            username=username_candidate,
            email=email_clean,
            password=temp_pass,
            full_name=full_name,
            customer_type="INDIVIDUAL",
        )

        # Mirror avatar to Google Storage Bucket
        gcs_avatar_url = GCPStorageService.upload_social_avatar_to_bucket(avatar_url, str(user.id)) if avatar_url else None

        social_acc = SocialAccount.objects.create(
            user=user,
            provider=provider_clean,
            uid=provider_uid,
            avatar_url=gcs_avatar_url,
            extra_data=extra_data or {},
            last_login_at=timezone.now(),
        )

        logger.info(f"Successfully registered new social user {user.username} via {provider_clean}")
        return user, customer, social_acc, True
