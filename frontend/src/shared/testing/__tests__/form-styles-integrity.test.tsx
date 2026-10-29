import { beforeEach, describe, expect, it } from "vitest";

import TestMultiStepFormModel from "@pages/static-pages/multi-step-form";

import { OnboardingFormDriver } from "../drivers/OnboardingFormDriver";
import { renderWithProviders } from "../test-utils";

describe("Form Styles Integrity Integration", () => {
  let driver: OnboardingFormDriver;

  beforeEach(() => {
    const { container } = renderWithProviders(<TestMultiStepFormModel />);
    driver = new OnboardingFormDriver(container);
  });

  it("should render the personal details header with text-center class", async () => {
    // Wait for the form-static-header to appear in the DOM
    await driver.waitFor(() => {
      const header = driver.query(".form-static-header");
      if (!header) throw new Error("Header not found");
      expect(header.className).toContain("text-center");
    });
  });

  it("should apply glassmorphic styles to the Status & Citizenship container", async () => {
    // The Status & Citizenship card renders with data-unit="card" and a
    // glass decoration Layer that carries the border-white/5 hairline.
    await driver.waitForField("martial_status_group");
    const wrapper = driver.getWrapper("martial_status_group");
    const container = wrapper?.querySelector('[data-unit="card"]');

    expect(container).toBeTruthy();
    expect(container?.className).toContain("bg-surface/90");
    expect(container?.className).toContain("backdrop-blur-md");
    expect(
      wrapper?.querySelector('[class*="border-white/5"]')
    ).toBeTruthy();
  });

  it("should scale spans correctly in the 2-column container", async () => {
    // Marital Status is columnSpan: 6 in a gridCols: 2 -> col-span-1
    await driver.waitForField("marital_status");
    const fieldWrapper = driver.getWrapper("marital_status");
    expect(fieldWrapper).toBeTruthy();
    expect(fieldWrapper?.className).toContain("col-span-1");
  });
});
