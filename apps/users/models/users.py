# apps/users/models/users.py
from django.db import models
from django.contrib.auth.models import (
    AbstractBaseUser,
    PermissionsMixin,
    BaseUserManager,
    Group,
    Permission
)
from django.db.models.signals import post_save
from django.dispatch import receiver
from functools import cached_property

# Core Fields
from core.base_models.fields.short_ui_fields import CustomShortUUIDField
from core.base_models.fields.char_fields import CustomCharField, CustomEmailField
from core.base_models.fields.boolean_fields import CustomBooleanField
from core.base_models.fields.date_fields import CustomDateTimeField
from core.base_models.scoping_models import TenantModelMixin, BranchModelMixin
from core.base_models.validator_model import ValidatorModelMixin
from core.base_models.validators.rules import PasswordValidatorRule, UniqueRule
from apps.users.valuesets import USER_TYPE_VALUESET

# ------------------------------------------------------------
# User Manager
# ------------------------------------------------------------
class UserManager(BaseUserManager):
    """Custom manager for UserModel with create_user and create_superuser."""

    def create_user(self, email, username, password=None, **extra_fields):
        if not email:
            raise ValueError("Users must have an email address")
        if not username:
            raise ValueError("Users must have a username")

        from django.db import transaction
        with transaction.atomic(using=self._db):
            email = self.normalize_email(email)
            user = self.model(email=email, username=username, **extra_fields)
            user.set_password(password)
            user.save(using=self._db)
            return user

    def create_superuser(self, email, username, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)

        if not password:
            raise ValueError("Superuser must have a password")
        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")

        from django.db import transaction
        with transaction.atomic(using=self._db):
            return self.create_user(email, username, password, **extra_fields)


# ------------------------------------------------------------
# User Model
# ------------------------------------------------------------
class UserModel(AbstractBaseUser, PermissionsMixin, ValidatorModelMixin):
    """Base User Model for the entire app."""

    id = CustomShortUUIDField(
        prefix="",
        month=False,
        day=False,
        year=False,
        length=35,
        unique=True,
        primary_key=True,
        editable=False,
    )

    email = CustomEmailField(
        unique=True,
        verbose_name="Email Address",
    )

    username = CustomCharField(
        max_length=150, 
        unique=True,
        verbose_name="Username",
        help_text="Required. 150 characters or fewer. Letters, digits and @/./+/-/_ only.",
    )

    full_name = CustomCharField(
        blank=True, 
        verbose_name="Full Name"
    )

    is_active = CustomBooleanField(default=True) 
    is_staff = CustomBooleanField(default=False)

    date_joined = CustomDateTimeField(
        auto_now_add=True, 
        verbose_name="Date Joined"
    )

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    objects = UserManager()

    groups = models.ManyToManyField(
        Group,
        verbose_name="groups",
        blank=True,
        related_name="custom_user_set",
        help_text="The groups this user belongs to. A user will get all permissions granted to each of their groups.",
    )

    user_permissions = models.ManyToManyField(
        Permission,
        verbose_name="user permissions",
        blank=True,
        related_name="custom_user_set_permissions",
        help_text="Specific permissions for this user.",
    )

    class Meta:
        db_table = "users"
        verbose_name = "User"
        verbose_name_plural = "Users"

    permission_prefix = "admin:users"
    permission_map = {
        "list": "view",
        "retrieve": "view",
        "create": "create",
        "update": "edit",
        "partial_update": "edit",
        "destroy": "delete",
    }

    @cached_property
    def permission_manifest(self):
        """
        High-performance RBAC snapshot for the current request context.
        Considers the user's active branch for SaaS module scoping.
        """
        from apps.users.utils.rbac_manifest import ManifestOrchestrator
        
        branch_id = None
        if hasattr(self, 'profile'):
            branch_id = self.profile.branch_id
            
        return ManifestOrchestrator.build_for_user(self.id, branch_id=branch_id)

    _manual_rules = {
        "password": [PasswordValidatorRule(field_name="password")],
        "email": [UniqueRule("email")],
        "username": [UniqueRule("username")],
    }

    def __str__(self):
        return self.email


# ------------------------------------------------------------
# User Profile Model (Shared Primary Key)
# ------------------------------------------------------------
class UserProfileModel(models.Model):
    """Profile with shared primary key to UserModel."""

    user = models.OneToOneField(
        UserModel,
        on_delete=models.CASCADE,
        related_name="profile",
        primary_key=True,
    )
    user_type = models.CharField(
        max_length=30,
        choices=USER_TYPE_VALUESET.as_django_choices(),
        default="STAFF",
        help_text="Categorizes user into Staff, B2C/B2B Customer, or B2C/B2B Partner",
    )
    company = models.ForeignKey(
        "core_admin.Company",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="user_profiles"
    )
    branch = models.ForeignKey(
        "core_admin.Branch",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="user_profiles"
    )

    class Meta:
        db_table = "user_profiles"
        verbose_name = "User Profile"
        verbose_name_plural = "User Profiles"

    @property
    def is_staff_user(self) -> bool:
        return self.user_type == "STAFF"

    @property
    def is_customer(self) -> bool:
        return self.user_type in ["CUSTOMER_B2C", "CUSTOMER_B2B"]

    @property
    def is_partner(self) -> bool:
        return self.user_type in ["PARTNER_B2C", "PARTNER_B2B"]

    @property
    def is_b2b(self) -> bool:
        return self.user_type in ["CUSTOMER_B2B", "PARTNER_B2B"]

    @property
    def is_b2c(self) -> bool:
        return self.user_type in ["CUSTOMER_B2C", "PARTNER_B2C"]

    def __str__(self):
        return f"Profile of {self.user.email} [{self.user_type}]"


@receiver(post_save, sender=UserModel)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        from django.db import transaction
        with transaction.atomic():
            initial_user_type = "STAFF" if (instance.is_staff or instance.is_superuser) else "CUSTOMER_B2C"
            if instance.is_superuser:
                from core.admin.models.company import Company
                from core.admin.models.branch import Branch
                from core.admin.constants import SYSTEM_COMPANY_CODE, SYSTEM_BRANCH_CODE
                
                try:
                    # Fetch pre-existing defaults created by migrations
                    company = Company.objects.get(code=SYSTEM_COMPANY_CODE)
                    branch = Branch.objects.get(code=SYSTEM_BRANCH_CODE)
                    UserProfileModel.objects.create(
                        user=instance,
                        company=company,
                        branch=branch,
                        user_type=initial_user_type,
                    )
                except (Company.DoesNotExist, Branch.DoesNotExist):
                    # Fallback for fresh test environments or incomplete setups
                    UserProfileModel.objects.create(user=instance, user_type=initial_user_type)
            else:
                UserProfileModel.objects.create(user=instance, user_type=initial_user_type)

# Removed: UserCompanyAccess and UserBranchAccess 
# They have been replaced by the industrialized GenericForeignKey EntityAccessControl table 
# located in apps.access_control.models
