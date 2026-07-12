from django.db import transaction
from django.db.models import Model
from core.admin.utils.integrity.retry import retry_on_conflict
from typing import Any, Type, TypeVar, Generic

T = TypeVar('T', bound=Model)

class BaseService(Generic[T]):
    """
    Base service class to handle common business logic and transaction management.
    """
    model: Type[T]

    @classmethod
    def get_queryset(cls, user=None):
        queryset = cls.model.objects.all()
        if user and not user.is_superuser:
            if hasattr(cls.model, 'company'):
                from django.contrib.contenttypes.models import ContentType
                from apps.access_control.models import EntityAccessControl
                
                # Fetch allowed company IDs from Master ACL
                company_model = cls.model._meta.get_field('company').related_model
                company_ct = ContentType.objects.get_for_model(company_model)
                allowed_company_ids = EntityAccessControl.objects.filter(
                    user=user, content_type=company_ct
                ).values_list('object_id', flat=True)
                
                # Fallback to legacy profile if Master ACL is empty
                profile = getattr(user, 'profile', None)
                legacy_company_id = profile.company_id if profile else None
                
                if allowed_company_ids:
                    # Include both ACL and legacy profile just in case it's mid-migration
                    valid_ids = set(allowed_company_ids)
                    if legacy_company_id:
                        valid_ids.add(legacy_company_id)
                    queryset = queryset.filter(company_id__in=valid_ids)
                elif legacy_company_id:
                    queryset = queryset.filter(company_id=legacy_company_id)
                else:
                    queryset = queryset.none()  # Secure default: no access means see nothing
        return queryset

    @classmethod
    def get_object(cls, pk: Any, user=None) -> T | None:
        return cls.get_queryset(user=user).filter(pk=pk).first()

    @classmethod
    @transaction.atomic
    def create(cls, user=None, **data) -> T:
        """
        Create a new record within an atomic transaction.
        """
        # Inject Context
        if user and not user.is_superuser:
            if hasattr(cls.model, 'company') and 'company' not in data and 'company_id' not in data:
                # If company isn't explicitly provided, infer it from the user's legacy profile
                profile = getattr(user, 'profile', None)
                if profile and profile.company_id:
                    data['company'] = profile.company

        instance = cls.model(**data)
        instance.full_clean()
        instance.save()
        return instance

    @classmethod
    @retry_on_conflict(max_retries=3)
    @transaction.atomic
    def update(cls, pk: Any, user=None, **data) -> T | None:
        """
        Update an existing record within an atomic transaction.
        """
        instance = cls.get_object(pk, user=user)
        if not instance:
            return None
        
        for attr, value in data.items():
            setattr(instance, attr, value)
        
        instance.full_clean()
        instance.save()
        return instance

    @classmethod
    @transaction.atomic
    def delete(cls, pk: Any, user=None) -> bool:
        """
        Delete a record. Handles soft-delete if implemented on the model.
        """
        instance = cls.get_object(pk, user=user)
        if not instance:
            return False
            
        if hasattr(instance, 'soft_delete'):
            instance.soft_delete()
        else:
            instance.delete()
        return True
