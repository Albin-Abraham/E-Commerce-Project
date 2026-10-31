/**
 * Customer Infrastructure: Django Customer Repository
 */

import { apiClient } from "@platform/networking";
import { runtimeConfig } from "@platform/configuration";
import type {
  CustomerRepositoryPort,
  SaveAddressInput,
} from "../../application/ports/customer-repository.port";
import { CustomerAggregate } from "../../domain/aggregates/customer.aggregate";
import { CustomerAddressEntity } from "../../domain/entities/customer-address.entity";
import { CustomerMapper } from "../mappers/customer.mapper";

const SEEDED_MOCK_CUSTOMER = {
  id: "cust-root-01",
  user_id: "usr-admin-root",
  customer_code: "CUST-2026-0042",
  company_id: "comp-zenos-main",
  company_name: "Zenith Retail Corp",
  name: "Albin Abraham (Enterprise Staff)",
  email: "admin@zenos.local",
  phone: "+81 3-5555-0199",
  tier: "COMMERCIAL_B2B",
  credit_limit: 50000,
  tax_number: "JP-9948201",
};

const SEEDED_MOCK_ADDRESSES = [
  {
    id: "addr-1",
    recipient_name: "Albin Abraham",
    company_name: "Zenith Retail Corp",
    street_1: "1-1 Chiyoda, Chiyoda City",
    street_2: "Suite 400",
    city: "Tokyo",
    state: "Tokyo Prefecture",
    postal_code: "100-0001",
    country: "Japan",
    phone: "+81 3-5555-0199",
    is_default_shipping: true,
    is_default_billing: true,
  },
  {
    id: "addr-2",
    recipient_name: "Receiving Dock 4B",
    company_name: "Zenith Regional Logistics",
    street_1: "3-5-1 Umeda, Kita Ward",
    city: "Osaka",
    state: "Osaka Prefecture",
    postal_code: "530-0001",
    country: "Japan",
    phone: "+81 6-5555-0288",
    is_default_shipping: false,
    is_default_billing: false,
  },
];

export class DjangoCustomerRepository implements CustomerRepositoryPort {
  private localAddresses: CustomerAddressEntity[] = SEEDED_MOCK_ADDRESSES.map((a) =>
    CustomerMapper.toAddressEntity(a)
  );

  public async getCustomerProfile(): Promise<CustomerAggregate> {
    try {
      const customer = await apiClient.get<Record<string, unknown>>("/customers/me/");
      const rawAddresses = await apiClient.get<Record<string, unknown>[]>("/customer-addresses/");
      return CustomerMapper.toCustomerAggregate(customer, rawAddresses);
    } catch (err) {
      if (runtimeConfig.isDevelopment() || runtimeConfig.isTest() || runtimeConfig.isStorybook()) {
        return CustomerMapper.toCustomerAggregate(
          SEEDED_MOCK_CUSTOMER,
          this.localAddresses as any
        );
      }
      throw err;
    }
  }

  public async getAddresses(): Promise<CustomerAddressEntity[]> {
    try {
      const raw = await apiClient.get<Record<string, unknown>[]>("/customer-addresses/");
      return raw.map((a) => CustomerMapper.toAddressEntity(a));
    } catch (err) {
      if (runtimeConfig.isDevelopment() || runtimeConfig.isTest() || runtimeConfig.isStorybook()) {
        return [...this.localAddresses];
      }
      throw err;
    }
  }

  public async saveAddress(input: SaveAddressInput): Promise<CustomerAddressEntity> {
    try {
      const endpoint = input.id ? `/customer-addresses/${input.id}/` : "/customer-addresses/";
      const method = input.id ? "PUT" : "POST";
      const response = await apiClient.request<Record<string, unknown>>({
        path: endpoint,
        method,
        body: JSON.stringify(input),
      });
      return CustomerMapper.toAddressEntity(response);
    } catch (err) {
      if (runtimeConfig.isDevelopment() || runtimeConfig.isTest() || runtimeConfig.isStorybook()) {
        const id = input.id || `addr-${Date.now()}`;
        const newEntity = new CustomerAddressEntity({
          id,
          recipientName: input.recipientName,
          companyName: input.companyName,
          street1: input.street1,
          street2: input.street2,
          city: input.city,
          state: input.state,
          postalCode: input.postalCode,
          country: input.country,
          phone: input.phone,
          isDefaultShipping: Boolean(input.isDefaultShipping),
          isDefaultBilling: Boolean(input.isDefaultBilling),
        });

        if (input.id) {
          const idx = this.localAddresses.findIndex((a) => a.id === input.id);
          if (idx !== -1) this.localAddresses[idx] = newEntity;
        } else {
          this.localAddresses.push(newEntity);
        }

        return newEntity;
      }
      throw err;
    }
  }

  public async deleteAddress(addressId: string): Promise<void> {
    try {
      await apiClient.delete(`/customer-addresses/${addressId}/`);
    } catch (err) {
      if (runtimeConfig.isDevelopment() || runtimeConfig.isTest() || runtimeConfig.isStorybook()) {
        this.localAddresses = this.localAddresses.filter((a) => a.id !== addressId);
        return;
      }
      throw err;
    }
  }
}

export const customerRepository = new DjangoCustomerRepository();
