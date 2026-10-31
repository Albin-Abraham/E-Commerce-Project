/**
 * Order Domain: Order Item Entity
 */

export interface OrderItemProps {
  id: string;
  productId: string;
  sku: string;
  title: string;
  unitPrice: number;
  quantity: number;
  thumbnailUrl?: string;
}

export class OrderItemEntity {
  public readonly id: string;
  public readonly productId: string;
  public readonly sku: string;
  public readonly title: string;
  public readonly unitPrice: number;
  public readonly quantity: number;
  public readonly thumbnailUrl?: string;

  constructor(props: OrderItemProps) {
    if (props.quantity <= 0) {
      throw new Error("Order item quantity must be at least 1.");
    }
    if (props.unitPrice < 0) {
      throw new Error("Unit price cannot be negative.");
    }

    this.id = props.id;
    this.productId = props.productId;
    this.sku = props.sku;
    this.title = props.title;
    this.unitPrice = props.unitPrice;
    this.quantity = props.quantity;
    this.thumbnailUrl = props.thumbnailUrl;
  }

  public get lineTotal(): number {
    return Math.round(this.unitPrice * this.quantity * 100) / 100;
  }
}
