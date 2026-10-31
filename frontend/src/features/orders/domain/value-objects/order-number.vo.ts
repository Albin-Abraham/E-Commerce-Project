/**
 * Order Domain: Order Number Value Object
 */

export class OrderNumber {
  public readonly value: string;

  constructor(value: string) {
    if (!value || typeof value !== "string") {
      throw new Error("Order number cannot be empty.");
    }

    const trimmed = value.trim().toUpperCase();
    if (trimmed.length < 5) {
      throw new Error(`Order number "${value}" is too short.`);
    }

    this.value = trimmed;
  }

  public toString(): string {
    return this.value;
  }

  public equals(other: OrderNumber): boolean {
    return this.value === other.value;
  }
}
