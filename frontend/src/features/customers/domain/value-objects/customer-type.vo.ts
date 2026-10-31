/**
 * Customer Domain: Customer Classification Type Value Object
 */

export type CommercialTier = "RETAIL_B2C" | "COMMERCIAL_B2B" | "ENTERPRISE_VIP";

export class CustomerType {
  public readonly value: CommercialTier;

  constructor(value: CommercialTier = "RETAIL_B2C") {
    if (!["RETAIL_B2C", "COMMERCIAL_B2B", "ENTERPRISE_VIP"].includes(value)) {
      throw new Error(`Invalid commercial customer tier: "${value}"`);
    }
    this.value = value;
  }

  public isB2B(): boolean {
    return this.value === "COMMERCIAL_B2B" || this.value === "ENTERPRISE_VIP";
  }

  public isRetail(): boolean {
    return this.value === "RETAIL_B2C";
  }

  public getBadgeLabel(): string {
    if (this.value === "ENTERPRISE_VIP") return "Enterprise VIP Tier";
    if (this.value === "COMMERCIAL_B2B") return "Commercial B2B Verified";
    return "Retail Consumer";
  }
}
