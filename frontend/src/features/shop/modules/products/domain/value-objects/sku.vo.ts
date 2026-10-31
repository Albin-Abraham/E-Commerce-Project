/**
 * Product Domain: SKU (Stock Keeping Unit) Value Object
 */

export class SKU {
  public readonly value: string;

  constructor(value: string) {
    if (!value || typeof value !== "string") {
      throw new Error(`SKU cannot be empty.`);
    }

    const trimmed = value.trim().toUpperCase();
    if (trimmed.length < 3) {
      throw new Error(`SKU "${value}" is too short. Minimum 3 characters.`);
    }

    this.value = trimmed;
  }

  public equals(other: SKU): boolean {
    return this.value === other.value;
  }

  public toString(): string {
    return this.value;
  }
}
