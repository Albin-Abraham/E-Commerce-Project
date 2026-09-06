import pytest
from core.admin.models.company import Company
from core.admin.models.branch import Branch
from core.admin.models.business_unit import BusinessUnit
from apps.access_control.models import EntityAccessControl
from django.contrib.contenttypes.models import ContentType
from django.contrib.auth import get_user_model

User = get_user_model()

@pytest.fixture
def test_user(db):
    user = User.objects.create_user(username="acl_user", email="acl@test.com", password="pwd")
    # Simulate a user that doesn't have a superuser flag
    return user

@pytest.fixture
def companies(db):
    c1 = Company(name="Company 1", code="C1")
    c1._validated_by_mediator = True
    c1.save()
    
    c2 = Company(name="Company 2", code="C2")
    c2._validated_by_mediator = True
    c2.save()
    
    c3 = Company(name="Company 3", code="C3")
    c3._validated_by_mediator = True
    c3.save()
    
    return [c1, c2, c3]

class TestServiceACL:
    """
    Tests that BaseService-derived classes properly utilize the Master ACL 
    (EntityAccessControl) for scoping querysets and injecting context.
    """

    def test_get_queryset_scopes_by_master_acl(self, db, test_user, companies):
        from core.admin.services.branch_service import BranchService

        # Create business units for companies
        bu1 = BusinessUnit(name="BU-1", code="BU-1", company=companies[0])
        bu1._validated_by_mediator = True
        bu1.save()

        bu2 = BusinessUnit(name="BU-2", code="BU-2", company=companies[1])
        bu2._validated_by_mediator = True
        bu2.save()

        bu3 = BusinessUnit(name="BU-3", code="BU-3", company=companies[2])
        bu3._validated_by_mediator = True
        bu3.save()

        # Create branches for companies
        b1 = Branch(name="B1", code="B1", company=companies[0], business_unit=bu1, opened_date="2024-01-01", location="L1")
        b1._validated_by_mediator = True
        b1.save()
        
        b2 = Branch(name="B2", code="B2", company=companies[1], business_unit=bu2, opened_date="2024-01-01", location="L2")
        b2._validated_by_mediator = True
        b2.save()
        
        b3 = Branch(name="B3", code="B3", company=companies[2], business_unit=bu3, opened_date="2024-01-01", location="L3")
        b3._validated_by_mediator = True
        b3.save()

        # Assign Master ACL for Company 1 and Company 2 to test_user
        EntityAccessControl.objects.create(
            user=test_user, 
            content_object=companies[0]
        )
        EntityAccessControl.objects.create(
            user=test_user, 
            content_object=companies[1]
        )

        # Execute
        qs = BranchService.get_queryset(user=test_user)

        # Assert
        assert qs.count() == 2
        assert b1 in qs
        assert b2 in qs
        assert b3 not in qs

    def test_get_queryset_no_access(self, db, test_user, companies):
        from core.admin.services.branch_service import BranchService

        bu1 = BusinessUnit(name="BU-1", code="BU-1", company=companies[0])
        bu1._validated_by_mediator = True
        bu1.save()

        b1 = Branch(name="B1", code="B1", company=companies[0], business_unit=bu1, opened_date="2024-01-01", location="L1")
        b1._validated_by_mediator = True
        b1.save()

        # User has no Master ACL and no legacy profile
        qs = BranchService.get_queryset(user=test_user)
        
        # Assert empty
        assert qs.count() == 0
