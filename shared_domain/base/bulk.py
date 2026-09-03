# shared_domain/base/bulk.py
"""
Bulk + Batch domain primitives.
"""

from __future__ import annotations

from abc import abstractmethod
from dataclasses import dataclass, field
from datetime import UTC, datetime
from typing import Any, TypeVar
from uuid import uuid4

from .operation import Operation, OperationResult

T_Input = TypeVar("T_Input")
T_Output = TypeVar("T_Output")


@dataclass
class BulkItemResult:
    index: int
    success: bool
    item_id: Any = None
    data: Any = None
    errors: dict[str, Any] | None = None

    def __bool__(self) -> bool:
        return self.success


@dataclass
class BulkOperationResult:
    total: int = 0
    succeeded: int = 0
    failed: int = 0
    skipped: int = 0
    items: list[BulkItemResult] = field(default_factory=list)
    mode: str = "best_effort"

    @property
    def success(self) -> bool:
        return self.failed == 0 and self.skipped == 0

    @property
    def partial(self) -> bool:
        return self.succeeded > 0 and self.failed > 0

    def to_summary(self) -> dict[str, Any]:
        return {
            "total": self.total,
            "succeeded": self.succeeded,
            "failed": self.failed,
            "skipped": self.skipped,
            "mode": self.mode,
        }

    @classmethod
    def empty(cls, mode: str = "best_effort") -> BulkOperationResult:
        return cls(mode=mode)


class BatchStatus:
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    PARTIAL = "partial"
    CANCELLED = "cancelled"

    ALL = [PENDING, RUNNING, COMPLETED, FAILED, PARTIAL, CANCELLED]
    TERMINAL = [COMPLETED, FAILED, PARTIAL, CANCELLED]

    TRANSITIONS = {
        PENDING: [RUNNING, CANCELLED],
        RUNNING: [COMPLETED, FAILED, PARTIAL, CANCELLED],
        COMPLETED: [],
        FAILED: [],
        PARTIAL: [],
        CANCELLED: [],
    }


@dataclass
class BatchOperationResult(BulkOperationResult):
    batch_id: str = field(default_factory=lambda: str(uuid4()))
    status: str = BatchStatus.PENDING
    started_at: datetime | None = None
    completed_at: datetime | None = None

    @property
    def duration_ms(self) -> float | None:
        if self.started_at and self.completed_at:
            delta = self.completed_at - self.started_at
            return delta.total_seconds() * 1000
        return None

    def mark_running(self) -> None:
        self.status = BatchStatus.RUNNING
        self.started_at = datetime.now(UTC)

    def mark_completed(self) -> None:
        self.completed_at = datetime.now(UTC)
        if self.failed > 0 and self.succeeded > 0:
            self.status = BatchStatus.PARTIAL
        elif self.failed > 0:
            self.status = BatchStatus.FAILED
        else:
            self.status = BatchStatus.COMPLETED

    def to_dict(self) -> dict[str, Any]:
        return {
            "batch_id": self.batch_id,
            "status": self.status,
            "summary": self.to_summary(),
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "duration_ms": self.duration_ms,
        }


class BulkOperation(Operation[list[dict], BulkOperationResult]):
    name: str = "BulkOperation"
    mode: str = "best_effort"  # 'all_or_nothing' | 'best_effort'

    @abstractmethod
    def _process_one(self, index: int, item: dict) -> BulkItemResult:
        ...

    def execute(self, input: list[dict]) -> OperationResult[BulkOperationResult]:
        result = BulkOperationResult(total=len(input), mode=self.mode)
        aborted = False

        for idx, item in enumerate(input):
            if aborted:
                item_result = BulkItemResult(
                    index=idx,
                    success=False,
                    errors={"detail": "Skipped — batch aborted due to prior failure."},
                )
                result.items.append(item_result)
                result.skipped += 1
                continue

            try:
                item_result = self._process_one(idx, item)
            except Exception as exc:
                item_result = BulkItemResult(
                    index=idx,
                    success=False,
                    errors={"detail": str(exc), "code": "unexpected_error"},
                )

            result.items.append(item_result)

            if item_result.success:
                result.succeeded += 1
            else:
                result.failed += 1
                if self.mode == "all_or_nothing":
                    aborted = True

        if result.success:
            return OperationResult.ok(data=result)
        return OperationResult(
            success=False,
            data=result,
            errors={"detail": f"{result.failed} item(s) failed.", "code": "bulk_partial_failure"},
            meta=result.to_summary(),
        )


class BatchOperation(BulkOperation):
    name: str = "BatchOperation"

    def execute_as_batch(
        self,
        input: list[dict],
        batch_id: str | None = None,
    ) -> BatchOperationResult:
        batch_result = BatchOperationResult(
            total=len(input),
            mode=self.mode,
            batch_id=batch_id or str(uuid4()),
        )
        batch_result.mark_running()

        op_result = self.execute(input)
        bulk = op_result.data

        if bulk:
            batch_result.succeeded = bulk.succeeded
            batch_result.failed = bulk.failed
            batch_result.skipped = bulk.skipped
            batch_result.items = bulk.items

        batch_result.mark_completed()
        return batch_result
