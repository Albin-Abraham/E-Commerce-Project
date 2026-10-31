/**
 * Customer Application: Repository Port Contract
 */

import type { CustomerAggregate } from "../../domain/aggregates/customer.aggregate";
import type { CustomerAddressEntity } from "../../domain/entities/customer-address.entity";

export interface SaveAddressInput {
  id?: string;
  recipientName: string;
  companyName?: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
  isDefaultShipping?: boolean;
  isDefaultBilling?: boolean;
}

export interface CustomerRepositoryPort {
  getCustomerProfile(): Promise<CustomerAggregate>;
  getAddresses(): Promise<CustomerAddressEntity[]>;
  saveAddress(input: SaveAddressInput): Promise<CustomerAddressEntity>;
  deleteAddress(addressId: string): Promise<void>;
}
