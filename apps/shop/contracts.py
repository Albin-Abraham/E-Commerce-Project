from abc import ABC, abstractmethod
from typing import Dict, Any, List
from uuid import UUID


class IShopPublicService(ABC):
    """Public contract: Other modules consume shop data through this interface."""

    @abstractmethod
    def get_product_summary(self, product_id: UUID) -> Dict[str, Any]:
        pass

    @abstractmethod
    def check_stock(self, product_id: UUID, branch_id: UUID) -> bool:
        pass

    @abstractmethod
    def get_products_for_branch(self, branch_id: UUID) -> List[Dict[str, Any]]:
        pass

    @abstractmethod
    def get_order_summary(self, order_id: UUID) -> Dict[str, Any]:
        pass
