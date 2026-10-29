import { describe, it } from "vitest";

import { FormSystemDriver } from "../drivers/FormSystemDriver";

describe("Form System Debug", () => {
  it("lists all field IDs", async () => {
    const { container } = await FormSystemDriver.render();
    const ids = Array.from(container.querySelectorAll("[data-field-id]")).map(
      (el) => el.getAttribute("data-field-id")
    );
    console.log("Found IDs:", ids);
  });
});
