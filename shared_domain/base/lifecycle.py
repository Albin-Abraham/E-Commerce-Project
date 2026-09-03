# shared_domain/base/lifecycle.py
"""
LifecycleEngine — validates and executes EVA state transitions.
"""

from __future__ import annotations

from typing import Any

from shared_domain.validation.exceptions import DomainValidationError

from .eva import EVA, StateContext
from .policy import Policy
from .valuesets import EVAAttributeSchema


class InvalidStateTransitionError(DomainValidationError):
    """Raised when a requested state transition is not in the allowed graph."""

    def __init__(self, from_state: str, to_state: str, allowed: list[str]):
        message = (
            f"Cannot transition from '{from_state}' → '{to_state}'. "
            f"Allowed transitions from '{from_state}': {allowed or ['(none — terminal state)']}"
        )
        super().__init__(
            message,
            errors={
                "code": "invalid_state_transition",
                "from_state": from_state,
                "to_state": to_state,
                "allowed": allowed,
            },
        )


class LifecycleEngine:
    """
    Manages lifecycle state transitions for any EVA-bearing entity.
    """

    def __init__(
        self,
        transitions: dict[str, list[str]],
        initial_state: str,
        attribute_schema: EVAAttributeSchema | None = None,
    ):
        self._transitions = transitions
        self.initial_state = initial_state
        self._schema = attribute_schema
        self._validate_graph()

    def _validate_graph(self) -> None:
        all_states = set(self._transitions.keys())
        for from_state, to_states in self._transitions.items():
            for to_state in to_states:
                if to_state not in all_states:
                    raise ValueError(
                        f"LifecycleEngine graph error: '{from_state}' → '{to_state}' "
                        f"references undeclared state '{to_state}'."
                    )
        if self.initial_state not in all_states:
            raise ValueError(
                f"initial_state '{self.initial_state}' is not declared in the transition graph."
            )

    def allowed_transitions(self, from_state: str) -> list[str]:
        return list(self._transitions.get(from_state, []))

    def can_transition(self, from_state: str, to_state: str) -> bool:
        return to_state in self._transitions.get(from_state, [])

    def is_terminal(self, state: str) -> bool:
        return not bool(self._transitions.get(state))

    def all_states(self) -> list[str]:
        return list(self._transitions.keys())

    def make_initial_eva(
        self,
        context: StateContext,
        attributes: dict[str, Any] | None = None,
    ) -> EVA:
        attrs = attributes or {}
        if self._schema:
            self._schema.validate_attributes(self.initial_state, attrs, strict=False)
        return EVA.initial(
            state=self.initial_state,
            context=context,
            attributes=attrs,
        )

    def transition(
        self,
        eva: EVA,
        target_state: str,
        context: StateContext,
        policies: list[Policy] | None = None,
        attribute_updates: dict[str, Any] | None = None,
        subject: Any = None,
    ) -> EVA:
        if not self.can_transition(eva.state, target_state):
            raise InvalidStateTransitionError(
                from_state=eva.state,
                to_state=target_state,
                allowed=self.allowed_transitions(eva.state),
            )

        policy_subject = subject if subject is not None else eva
        for policy in policies or []:
            policy.check(policy_subject)

        merged_attrs = {**eva.attributes, **(attribute_updates or {})}

        if self._schema:
            self._schema.validate_required_on_transition(target_state, merged_attrs)
            self._schema.validate_attributes(target_state, merged_attrs, strict=False)

        new_eva = eva.transition_to(target_state, context)
        if merged_attrs != eva.attributes:
            new_eva = new_eva.with_attributes(merged_attrs)

        return new_eva

    def bulk_transition(
        self,
        evas: list[EVA],
        target_state: str,
        context: StateContext,
        policies: list[Policy] | None = None,
    ) -> list[tuple[EVA, EVA | None, Exception | None]]:
        results = []
        for eva in evas:
            try:
                new_eva = self.transition(eva, target_state, context, policies)
                results.append((eva, new_eva, None))
            except Exception as exc:
                results.append((eva, None, exc))
        return results
