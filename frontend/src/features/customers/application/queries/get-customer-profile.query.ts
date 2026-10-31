/**
 * Customer Application: Queries
 */

import type { CustomerRepositoryPort } from "../ports/customer-repository.port";
import type { CustomerAggregate } from "../../domain/aggregates/customer.aggregate";
import type { CustomerAddressEntity } from "../../domain/entities/customer-address.entity";

export class GetCustomerProfileQuery {
  constructor(private readonly repository: CustomerRepositoryPort) {}

  public execute(): Promise<CustomerAggregate> {
    return this.repository.getCustomerProfile();
  }
}

export class GetCustomerAddressesQuery {
  constructor(private readonly repository: CustomerRepositoryPort) {}

  public execute(): Promise<CustomerAddressEntity[]> {
    return this.repository.getAddresses();
  }
}
