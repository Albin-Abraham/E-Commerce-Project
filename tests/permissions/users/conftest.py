import pytest


@pytest.fixture
def unassigned_user(user_builder):
    return user_builder.build()


@pytest.fixture
def user_with_role(user, role_builder, assignment_builder):
    role = role_builder.with_keys("perm:one", "perm:two").build()
    assignment_builder.with_roles(role).build()
    return user


@pytest.fixture
def user_with_group(user, group_builder, assignment_builder):
    group = group_builder.with_keys("perm:group").build()
    assignment_builder.with_groups(group).build()
    return user


@pytest.fixture
def user_with_direct_perm(user, assignment_builder):
    assignment_builder.with_direct("perm:direct").build()
    return user
