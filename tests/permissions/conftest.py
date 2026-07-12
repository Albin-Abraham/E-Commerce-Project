import pytest

from tests.permissions.builders import (
    RoleBuilder,
    GroupBuilder,
    AssignmentBuilder,
    CatalogBuilder,
    CompanyBuilder,
    UserBuilder,
)


@pytest.fixture(autouse=True)
def _db_access(db):
    pass


@pytest.fixture
def user(db):
    return UserBuilder().build()


@pytest.fixture
def company(db):
    return CompanyBuilder().build()


@pytest.fixture
def role_builder():
    return RoleBuilder()


@pytest.fixture
def group_builder():
    return GroupBuilder()


@pytest.fixture
def assignment_builder(user):
    return AssignmentBuilder(user)


@pytest.fixture
def catalog_builder():
    return CatalogBuilder()


@pytest.fixture
def user_builder():
    return UserBuilder()


# ---- Shared role fixtures ----

@pytest.fixture
def viewer_role(role_builder):
    return role_builder.named("Viewer").with_keys(
        "admin:security:audit_logs", "hrms:employee:profile"
    ).build()


@pytest.fixture
def editor_role(role_builder):
    return role_builder.named("Editor").with_keys(
        "admin:identity:can_manage_users"
    ).build()


@pytest.fixture
def admin_role(role_builder):
    return role_builder.named("Admin").with_keys(
        "admin:identity:can_configure_roles", "admin:security:audit_logs"
    ).build()


# ---- Shared group fixtures ----

@pytest.fixture
def hr_group(group_builder, viewer_role):
    return group_builder.named("HR Team").with_keys(
        "hrms:employee:profile"
    ).with_roles(viewer_role).build()


@pytest.fixture
def admin_group(group_builder, admin_role):
    return group_builder.named("Admin Team").with_keys(
        "admin:identity:role_configuration"
    ).with_roles(admin_role).build()


@pytest.fixture
def empty_group(group_builder):
    return group_builder.named("Empty Group").build()
