import pytest


@pytest.fixture
def hrms_catalog(catalog_builder):
    return catalog_builder.named("HRMS Pro").with_modules("hrms").with_keys(
        "hrms:employee:profile", "hrms:leave:leave_request"
    ).build()


@pytest.fixture
def branch_fixture(company):
    """Creates a Branch with a catalog. XFAIL due to pre-existing migration issue."""
    from core.admin.models import Branch

    return Branch.objects.create(
        name="HR Branch", code="HR01", company=company, opened_date="2024-01-01",
    )
