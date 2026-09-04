import importlib
import os
import yaml
import pytest
from django.db import transaction
from django.utils.module_loading import import_string
from apps.procurement_pos.models.procurement import Supplier, PurchaseOrder
from apps.users.models.users import UserModel
from apps.shop.infrastructure.models.events import DomainEventOutbox


from core.base_models.validator_model import bypass_mediator_guard


class YamlWorkflowTestEngine:
    """
    Development-Level Declarative YAML Workflow Test Execution Engine.
    
    Capabilities:
    1. Loads YAML workflow specs defining setup, step actions, commit A, rollback checks, and DB reversion.
    2. Runs each scenario inside isolated `transaction.atomic()` blocks.
    3. Handles parameter substitution ($po.id, $user).
    4. Validates model state changes and Domain Event Outbox records post-commit.
    5. Verifies error handling and atomic rollbacks when invalid actions occur.
    6. Ensures 100% database action reversion upon teardown.
    """

    def __init__(self, spec_path: str):
        with open(spec_path, "r") as f:
            self.spec = yaml.safe_load(f)
        self.context = {}

    def resolve_val(self, val):
        """Resolves dynamic references like '$po.id' or '$user'."""
        if isinstance(val, str) and val.startswith("$"):
            parts = val[1:].split(".")
            obj = self.context.get(parts[0])
            for part in parts[1:]:
                obj = getattr(obj, part)
            return obj
        return val

    def resolve_dict(self, d: dict) -> dict:
        """Recursively resolves dictionary values."""
        resolved = {}
        for k, v in d.items():
            if isinstance(v, dict):
                resolved[k] = self.resolve_dict(v)
            elif isinstance(v, list):
                resolved[k] = [self.resolve_val(i) for i in v]
            else:
                resolved[k] = self.resolve_val(v)
        return resolved

    def run_suite(self):
        target_module_str = self.spec["test_suite"]["target_module"]
        target_cls = import_string(target_module_str)

        for scenario in self.spec.get("scenarios", []):
            self.run_scenario(target_cls, scenario)

    def run_scenario(self, target_cls, scenario: dict):
        # Enforce isolated database transaction for dev-level isolation & automatic revert
        with bypass_mediator_guard():
            with transaction.atomic():
                sid = transaction.savepoint()
                try:
                    # 1. Setup Phase
                    setup_cfg = scenario.get("setup", {})
                    self._execute_setup(setup_cfg)

                    # 2. Execution Steps Phase
                    for step in scenario.get("steps", []):
                        self._execute_step(target_cls, step)

                finally:
                    # 3. Teardown / Revert DB Actions Phase
                    transaction.savepoint_rollback(sid)


    def _execute_setup(self, setup_cfg: dict):
        # Create minimal required domain objects for testing
        supplier = Supplier.objects.create(
            name="Test Supplier YAML",
            code=f"SUP-YAML-{os.urandom(4).hex()}",
        )
        user = UserModel.objects.create(
            username=f"yaml_user_{os.urandom(4).hex()}",
            email="yaml@test.com",
        )

        for fact in setup_cfg.get("factories", []):
            name = fact["name"]
            params = self.resolve_dict(fact.get("params", {}))

            if name == "po":
                po = PurchaseOrder.objects.create(
                    supplier=supplier,
                    created_by=user,
                    status=params.get("status", "DRAFT"),
                    po_number=params.get("po_number", "PO-YAML-001"),
                    total_amount=params.get("total_amount", 1000.00),
                )
                self.context["po"] = po
            elif name == "user":
                self.context["user"] = user

    def _execute_step(self, target_cls, step: dict):
        action_name = step["action"]
        args = self.resolve_dict(step.get("args", {}))
        expect = step.get("expect", {})

        action_method = getattr(target_cls, action_name)

        if expect.get("raises"):
            exc_cls = import_string(expect["raises"])
            with pytest.raises(exc_cls) as exc_info:
                with transaction.atomic():  # Inner savepoint to simulate step rollback
                    action_method(**args)

            if "error_message_contains" in expect:
                assert expect["error_message_contains"] in str(exc_info.value)

            # Verify DB state post-rollback
            if "state_check_after_rollback" in expect:
                self._verify_state(expect["state_check_after_rollback"])

        else:
            # Successful Action Commit (Commit A / Commit B)
            result = action_method(**args)

            if "state_check" in expect:
                self._verify_state(expect["state_check"])

    def _verify_state(self, state_check: dict):
        model_cls = import_string(state_check["model"])
        filters = self.resolve_dict(state_check["filter"])
        assert_fields = self.resolve_dict(state_check.get("assert_fields", {}))

        obj = model_cls.objects.get(**filters)
        for field, expected_val in assert_fields.items():
            actual_val = getattr(obj, field)
            assert actual_val == expected_val, (
                f"Field '{field}' mismatch: expected '{expected_val}', got '{actual_val}'"
            )

        # Check Outbox Events
        outbox_cfg = state_check.get("outbox_events")
        if outbox_cfg:
            agg_id = self.resolve_val(outbox_cfg["aggregate_id"])
            evt_type = outbox_cfg["event_type"]
            events = DomainEventOutbox.objects.filter(
                entity_id=agg_id,
                event_type=evt_type,
            )

            assert events.count() == outbox_cfg["count"], (
                f"Outbox events count mismatch for {evt_type}: expected {outbox_cfg['count']}, got {events.count()}"
            )


@pytest.mark.django_db
def test_yaml_workflow_purchase_order():
    """
    Pytest Entry Point for Development-Level Declarative YAML Workflow Testing.
    Executes Purchase Order Workflow YAML spec with Commit A, Rollback verification, and DB state reversion.
    """
    spec_file = os.path.join(
        os.path.dirname(__file__),
        "workflows",
        "purchase_order_workflow_test.yaml",
    )
    engine = YamlWorkflowTestEngine(spec_file)
    engine.run_suite()
