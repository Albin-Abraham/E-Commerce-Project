from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any

from core.base_models.seed_data.engine.context import SeedContext


class BaseSeedModule(ABC):
    """
    Abstract base class for all granular seed modules.
    Each module handles declarative parsing, validation, and idempotent DB persistence
    for a specific entity or sub-domain.
    """

    name: str = ""
    section: str = ""
    depends_on: list[str] = []

    def __init__(
        self,
        name: str | None = None,
        section: str | None = None,
        depends_on: list[str] | None = None,
    ):
        if name:
            self.name = name
        if section:
            self.section = section
        if depends_on is not None:
            self.depends_on = depends_on

    def validate(self, context: SeedContext, raw_data: Any) -> list[str]:
        """
        Validate data integrity, required attributes, and cross-references.
        Returns a list of validation error strings. Empty list indicates valid.
        """
        return []

    @abstractmethod
    def execute(self, context: SeedContext, raw_data: Any) -> None:
        """
        Execute idempotent creation/update of target domain records.
        Must respect context.scope and update context.stats.
        """
        pass
