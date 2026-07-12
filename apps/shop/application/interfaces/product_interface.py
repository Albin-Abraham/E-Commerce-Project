from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List
from uuid import UUID


class IProductService(ABC):
    """Interface: Product domain operations."""

    @abstractmethod
    def get_product_summary(self, product_id: UUID) -> Dict[str, Any]:
        pass

    @abstractmethod
    def check_stock(self, product_id: UUID, branch_id: UUID) -> bool:
        pass

    @abstractmethod
    def validate_availability(self, product_id: UUID, quantity: int, branch_id: UUID) -> bool:
        pass

    @abstractmethod
    def get_products_for_branch(self, branch_id: UUID) -> List[Dict[str, Any]]:
        pass
