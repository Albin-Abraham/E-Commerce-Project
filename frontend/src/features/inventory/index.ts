/**
 * Inventory Bounded Context Public API
 */

export { InventoryItemAggregate, type InventoryItemProps } from "./domain/inventory-item.aggregate";
export type { InventoryQueryPort, BranchStockResult } from "./application/ports/inventory-query.port";
export { DjangoInventoryRepository, inventoryRepository } from "./infrastructure/django-inventory.repository";
