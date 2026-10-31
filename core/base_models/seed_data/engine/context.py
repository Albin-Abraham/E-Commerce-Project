from __future__ import annotations

import sys
from dataclasses import dataclass, field
from typing import Any


@dataclass
class SeedStats:
    created: int = 0
    updated: int = 0
    skipped: int = 0
    errors: list[str] = field(default_factory=list)

    def record_created(self, count: int = 1) -> None:
        self.created += count

    def record_updated(self, count: int = 1) -> None:
        self.updated += count

    def record_skipped(self, count: int = 1) -> None:
        self.skipped += count

    def record_error(self, message: str) -> None:
        self.errors.append(message)

    def to_dict(self) -> dict[str, Any]:
        return {
            "created": self.created,
            "updated": self.updated,
            "skipped": self.skipped,
            "errors": list(self.errors),
        }


@dataclass
class SeedContext:
    """
    Context passed throughout domain seed modules during execution.
    Encapsulates scope, tenant context, dry-run simulation mode, and statistics tracking.
    """

    scope: str = "global"  # "global" | "tenant"
    company: Any | None = None  # core.admin.models.Company instance if tenant-scoped
    business_unit: Any | None = None
    branch: Any | None = None
    dry_run: bool = False
    validate_only: bool = False
    stats: SeedStats = field(default_factory=SeedStats)
    stdout: Any = field(default_factory=lambda: sys.stdout)
    stderr: Any = field(default_factory=lambda: sys.stderr)

    def write(self, message: str) -> None:
        if self.stdout:
            self.stdout.write(f"{message}\n")

    def write_error(self, message: str) -> None:
        self.stats.record_error(message)
        if self.stderr:
            self.stderr.write(f"{message}\n")
