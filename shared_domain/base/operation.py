# shared_domain/base/operation.py
"""
Operation — a single, named, executable unit of business work.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any, Generic, TypeVar

T_Input = TypeVar("T_Input")
T_Output = TypeVar("T_Output")


@dataclass
class OperationResult(Generic[T_Output]):
    success: bool
    data: T_Output | None = None
    errors: dict[str, Any] | None = None
    meta: dict[str, Any] = field(default_factory=dict)

    @classmethod
    def ok(cls, data: T_Output, meta: dict | None = None) -> OperationResult[T_Output]:
        return cls(success=True, data=data, meta=meta or {})

    @classmethod
    def fail(cls, errors: dict[str, Any], meta: dict | None = None) -> OperationResult:
        return cls(success=False, errors=errors, meta=meta or {})

    @classmethod
    def fail_message(cls, message: str, code: str = "operation_failed") -> OperationResult:
        return cls(success=False, errors={"detail": message, "code": code})

    def unwrap(self) -> T_Output:
        if not self.success:
            raise RuntimeError(f"Operation failed: {self.errors}")
        return self.data  # type: ignore[return-value]

    def __bool__(self) -> bool:
        return self.success


class Operation(ABC, Generic[T_Input, T_Output]):
    name: str = "UnnamedOperation"

    @abstractmethod
    def execute(self, input: T_Input) -> OperationResult[T_Output]:
        ...

    def __call__(self, input: T_Input) -> OperationResult[T_Output]:
        return self.execute(input)
