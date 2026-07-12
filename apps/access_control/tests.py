import pytest
from django.contrib.contenttypes.models import ContentType
from apps.access_control.models import (
    ApprovalChain,
    ApprovalLevel,
    ApprovalRequest,
    ApprovalAction,
    ApprovalRequestStatus,
    ApprovalActionType,
)
from apps.access_control.services.approval_engine import ApprovalEngine
from tests.factories.user import UserFactory


@pytest.mark.django_db
class TestApprovalEngine:
    def setup_method(self):
        self.user = UserFactory()
        self.admin = UserFactory(is_superuser=True)
        ct = ContentType.objects.get_for_model(ApprovalChain)
        self.chain = ApprovalChain.objects.create(
            name="Test Chain",
            approval_type="test_request",
            priority=10,
            is_active=True,
        )
        self.level = ApprovalLevel.objects.create(
            chain=self.chain,
            level=1,
            approver_by_type="specific_user",
            fallback_approver_by_type="specific_user",
        )

    def test_resolve_chain(self):
        chain = ApprovalEngine.resolve_chain("test_request")
        assert chain is not None
        assert chain.name == "Test Chain"

    def test_resolve_chain_not_found(self):
        chain = ApprovalEngine.resolve_chain("nonexistent")
        assert chain is None

    def test_resolve_chain_inactive(self):
        self.chain.is_active = False
        self.chain.save()
        chain = ApprovalEngine.resolve_chain("test_request")
        assert chain is None

    def test_submit_request(self):
        req = ApprovalEngine.submit(
            approval_type="test_request",
            submitter=self.user,
            content_object=self.chain,
            payload={"amount": 100},
        )
        assert req.status == ApprovalRequestStatus.PENDING
        assert req.current_level == 1
        assert req.chain == self.chain
        assert req.submitter == self.user

    def test_submit_no_chain(self):
        with pytest.raises(ValueError, match="No active approval chain"):
            ApprovalEngine.submit(
                approval_type="nonexistent",
                submitter=self.user,
                content_object=self.chain,
            )

    def test_evaluate_conditions_pass(self):
        self.chain.conditions = {"amount_gt": 50}
        self.chain.save()
        assert ApprovalEngine._evaluate_conditions(self.chain, {"amount": 100}) is True

    def test_evaluate_conditions_fail(self):
        self.chain.conditions = {"amount_gt": 50}
        self.chain.save()
        assert ApprovalEngine._evaluate_conditions(self.chain, {"amount": 30}) is False

    def test_evaluate_conditions_no_rules(self):
        assert ApprovalEngine._evaluate_conditions(self.chain, {}) is True

    def test_approve_single_level(self):
        req = ApprovalEngine.submit(
            approval_type="test_request",
            submitter=self.user,
            content_object=self.chain,
        )
        action = ApprovalEngine.approve(req, self.admin, comment="Looks good")
        assert action.action_type == ApprovalActionType.APPROVE
        assert action.comment == "Looks good"
        req.refresh_from_db()
        assert req.status == ApprovalRequestStatus.APPROVED
        assert req.resolved_at is not None

    def test_approve_multi_level(self):
        self.level.delete()
        ApprovalLevel.objects.create(chain=self.chain, level=1, approver_by_type="specific_user", fallback_approver_by_type="specific_user")
        ApprovalLevel.objects.create(chain=self.chain, level=2, approver_by_type="specific_user", fallback_approver_by_type="specific_user")

        req = ApprovalEngine.submit(
            approval_type="test_request",
            submitter=self.user,
            content_object=self.chain,
        )
        action = ApprovalEngine.approve(req, self.admin)
        req.refresh_from_db()
        assert req.status == ApprovalRequestStatus.PENDING
        assert req.current_level == 2

        ApprovalEngine.approve(req, self.admin)
        req.refresh_from_db()
        assert req.status == ApprovalRequestStatus.APPROVED

    def test_reject(self):
        req = ApprovalEngine.submit(
            approval_type="test_request",
            submitter=self.user,
            content_object=self.chain,
        )
        action = ApprovalEngine.reject(req, self.admin, comment="Denied")
        assert action.action_type == ApprovalActionType.REJECT
        req.refresh_from_db()
        assert req.status == ApprovalRequestStatus.REJECTED

    def test_escalate(self):
        self.level.delete()
        ApprovalLevel.objects.create(chain=self.chain, level=1, approver_by_type="specific_user", fallback_approver_by_type="specific_user")
        ApprovalLevel.objects.create(chain=self.chain, level=2, approver_by_type="specific_user", fallback_approver_by_type="specific_user")

        req = ApprovalEngine.submit(
            approval_type="test_request",
            submitter=self.user,
            content_object=self.chain,
        )
        action = ApprovalEngine.escalate(req, self.admin, comment="Skip level 1")
        assert action.action_type == ApprovalActionType.ESCALATE
        req.refresh_from_db()
        assert req.current_level == 2
        assert req.status == ApprovalRequestStatus.PENDING

    def test_escalate_beyond_max_fails(self):
        req = ApprovalEngine.submit(
            approval_type="test_request",
            submitter=self.user,
            content_object=self.chain,
        )
        with pytest.raises(ValueError, match="Cannot escalate"):
            ApprovalEngine.escalate(req, self.admin)

    def test_cancel(self):
        req = ApprovalEngine.submit(
            approval_type="test_request",
            submitter=self.user,
            content_object=self.chain,
        )
        ApprovalEngine.cancel(req, self.user, comment="Changed mind")
        req.refresh_from_db()
        assert req.status == ApprovalRequestStatus.CANCELLED

    def test_approve_non_pending_fails(self):
        req = ApprovalEngine.submit(
            approval_type="test_request",
            submitter=self.user,
            content_object=self.chain,
        )
        ApprovalEngine.reject(req, self.admin)
        with pytest.raises(ValueError, match="not pending"):
            ApprovalEngine.approve(req, self.admin)

    def test_reject_non_pending_fails(self):
        req = ApprovalEngine.submit(
            approval_type="test_request",
            submitter=self.user,
            content_object=self.chain,
        )
        ApprovalEngine.reject(req, self.admin)
        with pytest.raises(ValueError, match="not pending"):
            ApprovalEngine.reject(req, self.admin)

    def test_actions_recorded(self):
        req = ApprovalEngine.submit(
            approval_type="test_request",
            submitter=self.user,
            content_object=self.chain,
        )
        ApprovalEngine.approve(req, self.admin, comment="OK")
        actions = req.actions.all()
        assert actions.count() == 1
        assert actions.first().action_type == ApprovalActionType.APPROVE


@pytest.mark.django_db
class TestApprovalModels:
    def test_chain_str(self):
        chain = ApprovalChain.objects.create(name="IT Leave", approval_type="leave")
        assert str(chain) == "IT Leave (leave)"

    def test_level_str(self):
        chain = ApprovalChain.objects.create(name="IT Leave", approval_type="leave")
        level = ApprovalLevel.objects.create(
            chain=chain, level=1,
            approver_by_type="specific_user",
            fallback_approver_by_type="specific_user",
        )
        assert str(level) == "IT Leave - Level 1"

    def test_request_str(self):
        user = UserFactory()
        chain = ApprovalChain.objects.create(name="Purchase", approval_type="po")
        req = ApprovalRequest.objects.create(
            chain=chain, submitter=user,
            content_type=ContentType.objects.get_for_model(chain),
            object_id=str(chain.pk),
        )
        assert "pending" in str(req)

    def test_action_str(self):
        user = UserFactory()
        chain = ApprovalChain.objects.create(name="Purchase", approval_type="po")
        req = ApprovalRequest.objects.create(
            chain=chain, submitter=user,
            content_type=ContentType.objects.get_for_model(chain),
            object_id=str(chain.pk),
        )
        action = ApprovalAction.objects.create(
            request=req, approver=user,
            action_type="approve", level=1,
        )
        assert "approve" in str(action)
