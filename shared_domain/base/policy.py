# shared_domain/base/policy.py
"""
Policy — binary business decision objects.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any

from shared_domain.validation.exceptions import DomainValidationError


class PolicyViolationError(DomainValidationError):
    def __init__(self, policy_name: str, message: str, errors: dict | None = None):
        super().__init__(
            message, errors=errors or {"policy": policy_name, "code": "policy_violation"}
        )
        self.policy_name = policy_name


class Policy(ABC):
    name: str = "UnnamedPolicy"

    @abstractmethod
    def is_satisfied_by(self, subject: Any) -> bool:
        ...

    @property
    def violation_message(self) -> str:
        return f"Policy '{self.name}' was violated."

    def check(self, subject: Any) -> None:
        if not self.is_satisfied_by(subject):
            raise PolicyViolationError(
                policy_name=self.name,
                message=self.violation_message,
            )

    def __and__(self, other: Policy) -> PolicySet:
        return PolicySet([self, other], mode="all")

    def __or__(self, other: Policy) -> PolicySet:
        return PolicySet([self, other], mode="any")


class PolicySet(Policy):
    def __init__(self, policies: list[Policy], mode: str = "all"):
        if mode not in ("all", "any"):
            raise ValueError(f"PolicySet mode must be 'all' or 'any', got '{mode}'.")
        self._policies = policies
        self._mode = mode
        self.name = f"PolicySet({mode.upper()}: {', '.join(p.name for p in policies)})"

    def is_satisfied_by(self, subject: Any) -> bool:
        results = [p.is_satisfied_by(subject) for p in self._policies]
        return all(results) if self._mode == "all" else any(results)

    @property
    def violation_message(self) -> str:
        return (
            f"All of the following policies must be satisfied: "
            f"{', '.join(p.name for p in self._policies)}"
            if self._mode == "all"
            else f"At least one of the following policies must be satisfied: "
            f"{', '.join(p.name for p in self._policies)}"
        )
