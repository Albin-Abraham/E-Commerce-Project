/**
 * Customer Domain: Customer Address Entity
 */

export interface CustomerAddressProps {
  id: string;
  recipientName: string;
  companyName?: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
  isDefaultShipping: boolean;
  isDefaultBilling: boolean;
}

export class CustomerAddressEntity {
  public readonly id: string;
  public recipientName: string;
  public companyName?: string;
  public street1: string;
  public street2?: string;
  public city: string;
  public state: string;
  public postalCode: string;
  public country: string;
  public phone?: string;
  public isDefaultShipping: boolean;
  public isDefaultBilling: boolean;

  constructor(props: CustomerAddressProps) {
    if (!props.recipientName || !props.street1 || !props.city || !props.postalCode) {
      throw new Error("Address recipient, street, city, and postal code are required.");
    }

    this.id = props.id;
    this.recipientName = props.recipientName.trim();
    this.companyName = props.companyName?.trim();
    this.street1 = props.street1.trim();
    this.street2 = props.street2?.trim();
    this.city = props.city.trim();
    this.state = props.state.trim();
    this.postalCode = props.postalCode.trim();
    this.country = props.country.trim();
    this.phone = props.phone?.trim();
    this.isDefaultShipping = props.isDefaultShipping;
    this.isDefaultBilling = props.isDefaultBilling;
  }

  public formatInline(): string {
    const parts = [
      this.street1,
      this.street2,
      this.city,
      this.state,
      this.postalCode,
      this.country,
    ].filter(Boolean);
    return parts.join(", ");
  }
}
