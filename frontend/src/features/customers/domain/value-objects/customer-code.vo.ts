/**
 * Customer Domain: Enterprise Customer Code Value Object
 */

export class CustomerCode {
  public readonly value: string;

  constructor(value: string) {
    if (!value || typeof value !== "string") {
      throw new Error("Customer code cannot be empty.");
    }
    const trimmed = value.trim().toUpperCase();
    if (trimmed.length < 4) {
      throw new Error(`Customer code "${value}" is too short.`);
    }
    this.value = trimmed;
  }

  public toString(): string {
    return this.value;
  }

  public equals(other: CustomerCode): boolean {
    return this.value === other.value;
  }
}
