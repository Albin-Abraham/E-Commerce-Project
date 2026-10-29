import { describe, expect, it } from "vitest";

import { FormDriver } from "../drivers/FormDriver";
import { COMPOSITE_TEST_FORM } from "../fixtures/CompositeTestFixture";

describe("Form Engine: Composite Expansion (DCS/ECS)", () => {
  it("should expand address-group metadata into a functional UI", async () => {
    // 1. Render the metadata-driven form
    const { driver } = await FormDriver.render(COMPOSITE_TEST_FORM);

    // 2. Verify expansion: Billing fields should exist by name
    await driver.expectVisible("billingAddress.street");
    await driver.expectVisible("billingAddress.city");
    await driver.expectVisible("billingAddress.zip");

    // 3. Verify intent inheritance (DCS -> ECS)
    // Billing address was primary
    const billingStreet = driver.getWrapperByName("billingAddress.street");
    // The surface/inputWrapper inside billing.street should have primary classes
    expect(billingStreet.innerHTML).toContain("text-primary");

    // 4. Verify Shipping expansion (success intent)
    await driver.expectVisible("shippingAddress.street");
    const shippingStreet = driver.getWrapperByName("shippingAddress.street");
    expect(shippingStreet.innerHTML).toContain("text-success");
  });

  it("should isolate state between different instances of the same composite", async () => {
    const { driver } = await FormDriver.render(COMPOSITE_TEST_FORM);

    // 1. Fill billing street
    await driver.fill("billingAddress.street", "123 Billing Lane");

    // 2. Verify billing has the value
    await driver.expectValue("billingAddress.street", "123 Billing Lane");

    // 3. Verify shipping street is still empty (Isolation check)
    await driver.expectValue("shippingAddress.street", "");

    // 4. Fill shipping city
    await driver.fill("shippingAddress.city", "Shipping City");
    await driver.expectValue("shippingAddress.city", "Shipping City");
    await driver.expectValue("billingAddress.city", "");
  });

  it("should handle mixed nesting and deep namespacing", async () => {
    // This test ensures that the expansion logic works recursively
    // if we ever wrap composites in composites.
    const nestedForm = {
      ...COMPOSITE_TEST_FORM,
      sections: [
        {
          id: "nested",
          fields: [
            {
              id: "parent",
              name: "parent",
              type: "container",
              fields: [
                {
                  id: "child",
                  name: "childAddress",
                  type: "address-group",
                },
              ],
            },
          ],
        },
      ],
    };

    const { driver } = await FormDriver.render(nestedForm as any);

    // Namespacing should be: childAddress.street (parent container doesn't prepend)
    await driver.expectVisible("childAddress.street");
  });
});
