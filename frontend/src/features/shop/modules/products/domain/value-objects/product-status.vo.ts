/**
 * Product Domain: Product Status Value Object
 */

export type ProductLifecycleStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";

export class ProductStatus {
  public readonly value: ProductLifecycleStatus;

  constructor(status: ProductLifecycleStatus) {
    if (!["DRAFT", "ACTIVE", "ARCHIVED"].includes(status)) {
      throw new Error(`Invalid product status: "${status}"`);
    }
    this.value = status;
  }

  public isActive(): boolean {
    return this.value === "ACTIVE";
  }

  public isDraft(): boolean {
    return this.value === "DRAFT";
  }

  public isArchived(): boolean {
    return this.value === "ARCHIVED";
  }
}
