from typing import Optional, Dict, Any
from django.contrib.auth import get_user_model, authenticate
from django.db import transaction
from django.http import HttpRequest
from core.admin.helpers.mediator_helpers import ValidationMediator
from .interfaces import IAuthenticationClassService, IUserSessionClassServices
from core.session.context import SessionContext
import secrets
import hashlib
import time

User = get_user_model()

class AuthService(IAuthenticationClassService, IUserSessionClassServices):
    """
    Industrialized Service Layer for Authentication and User Management.
    Follows the Use Case pattern to orchestrate domain logic and session context.
    """

    # --- Registration & Core Auth ---

    @staticmethod
    def register_user(data: Dict[str, Any]) -> User:
        """Orchestrates user registration via ValidationMediator."""
        mediator = ValidationMediator(User)
        mediator.validate(data)

        with transaction.atomic():
            user = User.objects.create_user(
                email=data['email'],
                username=data['username'],
                password=data['password']
            )
            
            full_name = data.get('full_name')
            if full_name:
                user.full_name = full_name
                user.save(update_fields=['full_name'])
                
            return user

    @staticmethod
    def authenticate_user(login_data: Dict[str, Any], request=None) -> Optional[User]:
        """Orchestrates user authentication."""
        login = login_data.get("login") or login_data.get("user") or login_data.get("username")
        password = login_data.get("password")

        if not login or not password:
            return None

        return authenticate(request=request, username=login, password=password)

    # --- IAuthenticationClassService Implementation ---

    def is_authenticated(self, request: HttpRequest) -> bool:
        """
        Industrialized Identity Verification.
        Enforces that a valid token must be present in authorized headers or cookies.
        """
        # Strictly verify that an identity token exists for the current context
        has_token = bool(self.get_auth_token(request))
        return has_token and bool(request.user and request.user.is_authenticated)

    def get_auth_token(self, request: HttpRequest) -> Optional[str]:
        """
        Industrialized Token Extraction.
        Resolves tokens from Bearer headers, platform-specific headers, or secure cookies.
        """
        from core.admin.constants import PlatformHeaders, PlatformCookies
        
        # 1. Try standard Authorization Header
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            return auth_header.split(" ")[1]
        
        # 2. Try Web Platform Cookies (Fallback for dashboard sessions)
        platform = request.headers.get(PlatformHeaders.PLATFORM, "web").lower()
        if platform == "web":
            return request.COOKIES.get(PlatformCookies.ACCESS_TOKEN)
        
        return None

    # --- IUserSessionClassServices Implementation ---

    def get_user_profile(self, request: HttpRequest) -> Dict[str, Any]:
        """Returns the non-sensitive profile manifest for the current user."""
        user = request.user
        
        session_dict = {
            "company_id": SessionContext.get_company_id(request),
            "business_unit_id": SessionContext.get_business_unit_id(request),
            "branch_id": SessionContext.get_branch_id(request),
        }

        if not self.is_authenticated(request):
            return {
                "user": None,
                "session": session_dict,
                "permissions": {}
            }

        # --- SaaS Context Switcher Logic ---
        # Resolve the available nodes the user is authorized to switch to
        available_companies = []
        available_branches = []
        
        is_super = getattr(user, "is_superuser", False)
        if is_super:
            # Superadmins can see/switch to the default System Tenant or all tenants if built
            from core.admin.models.company import Company
            from core.admin.models.branch import Branch
            available_companies = [{"id": str(c.id), "name": c.name} for c in Company.objects.all()[:50]]
            available_branches = [{"id": str(b.id), "name": b.name, "company_id": str(b.company_id)} for b in Branch.objects.all()[:100]]
        else:
            # 1. Fetch from legacy 1-to-1 Profile
            profile = getattr(user, "profile", None)
            if profile and profile.company_id:
                available_companies.append({"id": str(profile.company_id), "name": profile.company.name})
            if profile and profile.branch_id:
                available_branches.append({"id": str(profile.branch_id), "name": profile.branch.name, "company_id": str(profile.branch.company_id)})
                
            # 2. Fetch from new Master ACL (GenericForeignKey)
            from django.contrib.contenttypes.models import ContentType
            from apps.access_control.models import EntityAccessControl
            from core.admin.models.company import Company
            from core.admin.models.branch import Branch
            
            # Fetch Company ACLs in a single query to prevent N+1
            company_ct = ContentType.objects.get_for_model(Company)
            acl_company_ids = EntityAccessControl.objects.filter(
                user=user, content_type=company_ct
            ).values_list('object_id', flat=True)
            
            existing_company_ids = {c['id'] for c in available_companies}
            for comp in Company.objects.filter(id__in=acl_company_ids):
                if str(comp.id) not in existing_company_ids:
                    available_companies.append({"id": str(comp.id), "name": comp.name})
                    existing_company_ids.add(str(comp.id))
                    
            # Fetch Branch ACLs in a single query to prevent N+1
            branch_ct = ContentType.objects.get_for_model(Branch)
            acl_branch_ids = EntityAccessControl.objects.filter(
                user=user, content_type=branch_ct
            ).values_list('object_id', flat=True)
            
            existing_branch_ids = {b['id'] for b in available_branches}
            for br in Branch.objects.filter(id__in=acl_branch_ids):
                if str(br.id) not in existing_branch_ids:
                    available_branches.append({
                        "id": str(br.id),
                        "name": br.name,
                        "company_id": str(br.company_id)
                    })
                    existing_branch_ids.add(str(br.id))

        return {
            "user": {
                "id": str(user.id),
                "username": user.username,
                "email": user.email,
                "full_name": getattr(user, "full_name", ""),
                "is_staff": getattr(user, "is_staff", False),
            },
            "session": session_dict,
            "permissions": user.permission_manifest.to_dict(),
            "available_tenants": {
                "companies": available_companies,
                "branches": available_branches
            }
        }

    # --- Password Reset Service ---

    _RESET_TOKEN_TTL = 3600  # 1 hour
    _RESET_RATE_LIMIT_TTL = 300  # 5 minutes between reset requests per user
    _RESET_MAX_PER_DAY = 5  # Max reset requests per user per day

    @classmethod
    def generate_password_reset_token(cls, email: str) -> Dict[str, Any]:
        """Generate a password reset token for the given email. Stored in Redis."""
        from django.core.cache import cache

        try:
            user = User.objects.get(email=email, is_active=True)
        except User.DoesNotExist:
            return {"message": "If the email exists, a reset token has been generated.", "token": None}

        # Rate limit: max 5 resets per day per user
        rate_key = f"pwd_reset_count:{user.id}"
        reset_count = cache.get(rate_key, 0)
        if reset_count >= cls._RESET_MAX_PER_DAY:
            return {"message": "Too many reset requests. Please try again later.", "token": None}

        # Rate limit: max 1 request per 5 minutes per user
        cooldown_key = f"pwd_reset_cooldown:{user.id}"
        if cache.get(cooldown_key):
            return {"message": "Please wait before requesting another reset.", "token": None}

        token = secrets.token_urlsafe(32)
        token_hash = hashlib.sha256(token.encode()).hexdigest()

        # Store in Redis
        token_key = f"pwd_reset_token:{token_hash}"
        cache.set(token_key, {
            "user_id": str(user.id),
            "created_at": time.time(),
        }, cls._RESET_TOKEN_TTL)

        # Increment daily counter
        cache.set(rate_key, reset_count + 1, 86400)  # 24 hours

        # Set cooldown
        cache.set(cooldown_key, True, cls._RESET_RATE_LIMIT_TTL)

        return {
            "message": "Password reset token generated.",
            "token": token,
            "expires_in": cls._RESET_TOKEN_TTL,
        }

    @classmethod
    def reset_password_with_token(cls, token: str, new_password: str) -> bool:
        """Reset password using a valid token. Token is consumed from Redis."""
        from django.core.cache import cache

        token_hash = hashlib.sha256(token.encode()).hexdigest()
        token_key = f"pwd_reset_token:{token_hash}"

        token_data = cache.get(token_key)
        if not token_data:
            return False

        try:
            user = User.objects.get(id=token_data["user_id"], is_active=True)
        except User.DoesNotExist:
            return False

        user.set_password(new_password)
        user.save()

        # Consume the token
        cache.delete(token_key)
        return True
