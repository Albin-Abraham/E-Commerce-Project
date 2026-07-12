from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Dict, Any, List, Optional
from uuid import UUID


class ShopCommand(ABC):
    """Base command for shop operations."""

    user_id: UUID

    @abstractmethod
    def execute(self, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        pass


@dataclass(frozen=True)
class ActivateProductCommand(ShopCommand):
    """Command: Activate a product."""

    user_id: UUID
    product_id: UUID

    def execute(self, context=None):
        from apps.shop.application.services.product_service import ProductService
        product = ProductService.get_object(self.product_id)
        if not product:
            return {"success": False, "error": "Product not found"}
        product.is_active = True
        product.save()
        return {"success": True, "product_id": str(self.product_id)}


@dataclass(frozen=True)
class DeactivateProductCommand(ShopCommand):
    """Command: Deactivate a product."""

    user_id: UUID
    product_id: UUID

    def execute(self, context=None):
        from apps.shop.application.services.product_service import ProductService
        product = ProductService.get_object(self.product_id)
        if not product:
            return {"success": False, "error": "Product not found"}
        product.is_active = False
        product.save()
        return {"success": True, "product_id": str(self.product_id)}


class ShopCommandInvoker:
    """Invoker: Executes commands and tracks history."""

    def __init__(self):
        self._history: List[Dict[str, Any]] = []

    def execute(self, command: ShopCommand, context: Dict[str, Any] = None) -> Dict[str, Any]:
        result = command.execute(context)
        self._history.append({
            "command": type(command).__name__,
            "result": result,
        })
        return result

    def get_history(self) -> List[Dict[str, Any]]:
        return self._history.copy()
