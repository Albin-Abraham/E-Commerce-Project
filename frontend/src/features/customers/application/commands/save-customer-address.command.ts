/**
 * Customer Application: Save Address Command
 */

import type { CustomerRepositoryPort, SaveAddressInput } from "../ports/customer-repository.port";
import type { CustomerAddressEntity } from "../../domain/entities/customer-address.entity";

export class SaveCustomerAddressCommand {
  constructor(private readonly repository: CustomerRepositoryPort) {}

  public execute(input: SaveAddressInput): Promise<CustomerAddressEntity> {
    return this.repository.saveAddress(input);
  }
}
