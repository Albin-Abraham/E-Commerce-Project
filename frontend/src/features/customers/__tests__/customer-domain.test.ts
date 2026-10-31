import { describe, expect, it } from "vitest";
import {
  CustomerAggregate,
  CustomerAddressEntity,
  CustomerCode,
  CustomerType,
  customerRepository,
  GetCustomerProfileQuery,
  SaveCustomerAddressCommand,
} from "../index";

describe("Customer Bounded Context", () => {
  describe("1. Customer Domain Invariants", () => {
    it("validates CustomerType tier rules", () => {
      const b2b = new CustomerType("COMMERCIAL_B2B");
      expect(b2b.isB2B()).toBe(true);
      expect(b2b.isRetail()).toBe(false);
      expect(b2b.getBadgeLabel()).toContain("B2B");

      const retail = new CustomerType("RETAIL_B2C");
      expect(retail.isRetail()).toBe(true);
      expect(retail.isB2B()).toBe(false);
    });

    it("validates CustomerCode formatting", () => {
      const code = new CustomerCode("cust-2026-0042");
      expect(code.value).toBe("CUST-2026-0042");
      expect(() => new CustomerCode("abc")).toThrow(/too short/);
    });

    it("manages addresses within CustomerAggregate", () => {
      const customer = new CustomerAggregate({
        id: "c-1",
        userId: "u-1",
        customerCode: new CustomerCode("CUST-1001"),
        displayName: "Acme Logistics",
        email: "billing@acme.com",
        tier: new CustomerType("COMMERCIAL_B2B"),
        addresses: [],
      });

      expect(customer.addresses.length).toBe(0);

      const address = new CustomerAddressEntity({
        id: "a-1",
        recipientName: "Acme HQ",
        street1: "100 Industrial Way",
        city: "Tokyo",
        state: "Kanto",
        postalCode: "100-0001",
        country: "Japan",
        isDefaultShipping: true,
        isDefaultBilling: true,
      });

      customer.addAddress(address);
      expect(customer.addresses.length).toBe(1);
      expect(customer.defaultShippingAddress?.recipientName).toBe("Acme HQ");
    });
  });

  describe("2. Application Queries & Commands", () => {
    it("executes GetCustomerProfileQuery successfully", async () => {
      const query = new GetCustomerProfileQuery(customerRepository);
      const profile = await query.execute();

      expect(profile).toBeDefined();
      expect(profile.customerCode.value).toBeTruthy();
      expect(profile.addresses.length).toBeGreaterThan(0);
    });

    it("executes SaveCustomerAddressCommand successfully", async () => {
      const cmd = new SaveCustomerAddressCommand(customerRepository);
      const saved = await cmd.execute({
        recipientName: "Dock 9 Warehouse",
        street1: "700 Harbor Rd",
        city: "Yokohama",
        state: "Kanagawa",
        postalCode: "220-0012",
        country: "Japan",
        isDefaultShipping: false,
        isDefaultBilling: false,
      });

      expect(saved.id).toBeTruthy();
      expect(saved.recipientName).toBe("Dock 9 Warehouse");
    });
  });
});
