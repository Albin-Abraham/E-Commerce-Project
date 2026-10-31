/**
 * Product Domain: Money Value Object
 *
 * Immutable monetary representation with currency, precise arithmetic,
 * discount calculations, and tabular numeral string formatting.
 */

export class Money {
  public readonly amount: number;
  public readonly currency: string;

  constructor(amount: number, currency = "USD") {
    if (isNaN(amount) || amount < 0) {
      throw new Error(`Invalid monetary amount: ${amount}`);
    }
    this.amount = Math.round(amount * 100) / 100;
    this.currency = currency.toUpperCase();
  }

  public add(other: Money): Money {
    this.assertMatchingCurrency(other);
    return new Money(this.amount + other.amount, this.currency);
  }

  public subtract(other: Money): Money {
    this.assertMatchingCurrency(other);
    if (this.amount < other.amount) {
      throw new Error(`Monetary subtraction cannot produce negative balance.`);
    }
    return new Money(this.amount - other.amount, this.currency);
  }

  public applyDiscountPercent(percentage: number): Money {
    if (percentage < 0 || percentage > 100) {
      throw new Error(`Discount percentage must be between 0 and 100.`);
    }
    const discountAmount = this.amount * (percentage / 100);
    return new Money(this.amount - discountAmount, this.currency);
  }

  public calculateSavings(original: Money): { savingsAmount: Money; discountPercent: number } {
    this.assertMatchingCurrency(original);
    if (original.amount <= this.amount) {
      return { savingsAmount: new Money(0, this.currency), discountPercent: 0 };
    }
    const diff = original.amount - this.amount;
    const percent = Math.round((diff / original.amount) * 100);
    return {
      savingsAmount: new Money(diff, this.currency),
      discountPercent: percent,
    };
  }

  public format(locale = "en-US"): string {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: this.currency,
      minimumFractionDigits: 2,
    }).format(this.amount);
  }

  public equals(other: Money): boolean {
    return this.amount === other.amount && this.currency === other.currency;
  }

  private assertMatchingCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw new Error(
        `Currency mismatch: cannot operate between ${this.currency} and ${other.currency}`
      );
    }
  }
}
