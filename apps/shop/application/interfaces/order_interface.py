from abc import ABC, abstractmethod
from decimal import Decimal
from typing import Any
from uuid import UUID


class IOrderService(ABC):
    """Interface: Order domain operations."""

    @abstractmethod
    def process_order(self, order_data: dict[str, Any], user_id: UUID) -> dict[str, Any]:
        pass

    @abstractmethod
    def calculate_total(self, items: list) -> Decimal:
        pass

    @abstractmethod
    def cancel_order(self, order_id: UUID, user_id: UUID) -> bool:
        pass

    @abstractmethod
    def get_order_summary(self, order_id: UUID) -> dict[str, Any] | None:
        pass
