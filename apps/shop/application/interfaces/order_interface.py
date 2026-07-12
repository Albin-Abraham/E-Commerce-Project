from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from uuid import UUID
from decimal import Decimal


class IOrderService(ABC):
    """Interface: Order domain operations."""

    @abstractmethod
    def process_order(self, order_data: Dict[str, Any], user_id: UUID) -> Dict[str, Any]:
        pass

    @abstractmethod
    def calculate_total(self, items: list) -> Decimal:
        pass

    @abstractmethod
    def cancel_order(self, order_id: UUID, user_id: UUID) -> bool:
        pass

    @abstractmethod
    def get_order_summary(self, order_id: UUID) -> Optional[Dict[str, Any]]:
        pass
