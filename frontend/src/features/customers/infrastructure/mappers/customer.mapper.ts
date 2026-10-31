/**
 * Customer Infrastructure: DTO Mappers
 */

import { CustomerAggregate } from "../../domain/aggregates/customer.aggregate";
import { CustomerCode } from "../../domain/value-objects/customer-code.vo";
import { CustomerType, type CommercialTier } from "../../domain/value-objects/customer-type.vo";
import { CustomerAddressEntity } from "../../domain/entities/customer-address.entity";

export class CustomerMapper {
  public static toAddressEntity(dto: Record<string, unknown>): CustomerAddressEntity {
    return new CustomerAddressEntity({
      id: String(dto.id),
      recipientName: String(dto.recipient_name ?? dto.name ?? "Resident"),
      companyName: typeof dto.company_name === "string" ? dto.company_name : undefined,
      street1: String(dto.street_1 ?? dto.street1 ?? dto.address_line1 ?? "100 Enterprise Blvd"),
      street2: typeof dto.street_2 === "string" ? dto.street_2 : undefined,
      city: String(dto.city ?? "Tokyo"),
      state: String(dto.state ?? dto.province ?? "Kanto"),
      postalCode: String(dto.postal_code ?? dto.zip_code ?? "100-0001"),
      country: String(dto.country ?? "Japan"),
      phone: typeof dto.phone === "string" ? dto.phone : undefined,
      isDefaultShipping: Boolean(dto.is_default_shipping ?? dto.is_default),
      isDefaultBilling: Boolean(dto.is_default_billing),
    });
  }

  public static toCustomerAggregate(
    customerDto: Record<string, unknown>,
    addressesDto: Record<string, unknown>[] = []
  ): CustomerAggregate {
    const id = String(customerDto.id ?? "cust-root-01");
    const userId = String(customerDto.user_id ?? customerDto.user ?? "usr-admin-root");
    const customerCode = new CustomerCode(String(customerDto.code ?? customerDto.customer_code ?? "CUST-2026-0042"));
    const displayName = String(customerDto.name ?? customerDto.display_name ?? "Albin Abraham (Enterprise Staff)");
    const email = String(customerDto.email ?? "admin@zenos.local");
    const phone = typeof customerDto.phone === "string" ? customerDto.phone : "+81 3-5555-0199";

    const tierVal = (customerDto.tier ?? customerDto.customer_type ?? "COMMERCIAL_B2B") as CommercialTier;
    const tier = new CustomerType(tierVal);

    const addresses = addressesDto.map((a) => this.toAddressEntity(a));

    return new CustomerAggregate({
      id,
      userId,
      customerCode,
      companyId: customerDto.company_id as any,
      companyName: customerDto.company_name as any,
      displayName,
      email,
      phone,
      tier,
      addresses,
      creditLimit: Number(customerDto.credit_limit ?? 50000),
      taxNumber: customerDto.tax_number as any,
    });
  }
}
