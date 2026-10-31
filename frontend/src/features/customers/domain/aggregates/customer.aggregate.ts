/**
 * Customer Domain: Customer Root Aggregate
 *
 * Models commercial relationship decoupled from generic authentication identity.
 */

import { CustomerCode } from "../value-objects/customer-code.vo";
import { CustomerType } from "../value-objects/customer-type.vo";
import { CustomerAddressEntity } from "../entities/customer-address.entity";

export interface CustomerAggregateProps {
  id: string;
  userId: string;
  customerCode: CustomerCode;
  companyId?: string | number;
  companyName?: string;
  displayName: string;
  email: string;
  phone?: string;
  tier: CustomerType;
  addresses: CustomerAddressEntity[];
  creditLimit?: number;
  taxNumber?: string;
}

export class CustomerAggregate {
  public readonly id: string;
  public readonly userId: string;
  public readonly customerCode: CustomerCode;
  public companyId?: string | number;
  public companyName?: string;
  public displayName: string;
  public email: string;
  public phone?: string;
  public tier: CustomerType;
  private _addresses: CustomerAddressEntity[];
  public creditLimit?: number;
  public taxNumber?: string;

  constructor(props: CustomerAggregateProps) {
    if (!props.displayName || !props.email) {
      throw new Error("Customer display name and email are required.");
    }

    this.id = props.id;
    this.userId = props.userId;
    this.customerCode = props.customerCode;
    this.companyId = props.companyId;
    this.companyName = props.companyName;
    this.displayName = props.displayName.trim();
    this.email = props.email.trim();
    this.phone = props.phone?.trim();
    this.tier = props.tier;
    this._addresses = props.addresses;
    this.creditLimit = props.creditLimit;
    this.taxNumber = props.taxNumber;
  }

  public get addresses(): ReadonlyArray<CustomerAddressEntity> {
    return this._addresses;
  }

  public get defaultShippingAddress(): CustomerAddressEntity | undefined {
    return this._addresses.find((a) => a.isDefaultShipping) || this._addresses[0];
  }

  public get defaultBillingAddress(): CustomerAddressEntity | undefined {
    return this._addresses.find((a) => a.isDefaultBilling) || this._addresses[0];
  }

  public addAddress(address: CustomerAddressEntity): void {
    if (address.isDefaultShipping) {
      for (const a of this._addresses) {
        a.isDefaultShipping = false;
      }
    }
    if (address.isDefaultBilling) {
      for (const a of this._addresses) {
        a.isDefaultBilling = false;
      }
    }
    this._addresses.push(address);
  }
}
