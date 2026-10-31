/**
 * Customer Bounded Context Public API
 */

// Domain
export { CustomerAggregate } from "./domain/aggregates/customer.aggregate";
export { CustomerAddressEntity } from "./domain/entities/customer-address.entity";
export { CustomerType, type CommercialTier } from "./domain/value-objects/customer-type.vo";
export { CustomerCode } from "./domain/value-objects/customer-code.vo";

// Application
export type {
  CustomerRepositoryPort,
  SaveAddressInput,
} from "./application/ports/customer-repository.port";
export {
  GetCustomerProfileQuery,
  GetCustomerAddressesQuery,
} from "./application/queries/get-customer-profile.query";
export { SaveCustomerAddressCommand } from "./application/commands/save-customer-address.command";

// Infrastructure
export { DjangoCustomerRepository, customerRepository } from "./infrastructure/repositories/django-customer.repository";
export { CustomerMapper } from "./infrastructure/mappers/customer.mapper";
