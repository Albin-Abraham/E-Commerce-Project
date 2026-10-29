import React from "react";

import "@testing-library/jest-dom";
import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BaseDriver } from "../drivers/BaseDriver";

// A concrete implementation of BaseDriver for testing
class TestDriver extends BaseDriver {
  public static render(ui: React.ReactElement) {
    const { container } = render(ui);
    return new TestDriver(container);
  }
}

const MockForm = () => (
  <form data-field-id="root">
    {/* Text Input */}
    <div data-field-id="name-field">
      <label htmlFor="name">Name</label>
      <input id="name" type="text" defaultValue="" />
    </div>

    {/* Radio Group */}
    <div data-field-id="gender-field">
      <label>Gender</label>
      <input type="radio" id="gender-m" name="gender" value="male" />
      <input type="radio" id="gender-f" name="gender" value="female" />
    </div>

    {/* Checkbox */}
    <div data-field-id="terms-field">
      <input type="checkbox" id="terms" />
      <label htmlFor="terms">Accept Terms</label>
    </div>

    {/* Custom Select (Simulated) */}
    <div data-field-id="country-field">
      <button id="country" role="combobox" aria-expanded="false">
        Select Country
      </button>
      {/* The portal content would be rendered here by a real library, but we'll mock it */}
    </div>
  </form>
);

describe("Polymorphic Interactions (BaseDriver)", () => {
  it("should set and get values for standard text inputs", async () => {
    const driver = TestDriver.render(<MockForm />);

    await driver.setFieldValue("name", "John Doe");
    expect(await driver.getFieldValue("name")).toBe("John Doe");
  });

  it("should set and get values for radio groups", async () => {
    const driver = TestDriver.render(<MockForm />);

    await driver.setFieldValue("gender-m", "female"); // ID points to one, but it uses the name group
    expect(await driver.getFieldValue("gender-m")).toBe("female");

    const radioF = document.getElementById("gender-f") as HTMLInputElement;
    expect(radioF.checked).toBe(true);
  });

  it("should set and get values for checkboxes", async () => {
    const driver = TestDriver.render(<MockForm />);

    await driver.setFieldValue("terms", true);
    expect(await driver.getFieldValue("terms")).toBe(true);

    await driver.setFieldValue("terms", false);
    expect(await driver.getFieldValue("terms")).toBe(false);
  });

  it("should set values for custom selects via portal interaction", async () => {
    const driver = TestDriver.render(<MockForm />);

    // Simulate portal opening and rendering
    const trigger = document.getElementById("country")!;
    fireEvent.click(trigger);

    // Manually create the "portal" content
    const portal = document.createElement("div");
    portal.innerHTML = `
      <div role="option" data-value="usa">USA</div>
      <div role="option" data-value="uk">UK</div>
    `;
    document.body.appendChild(portal);

    await driver.setFieldValue("country", "usa");

    // Clean up portal
    document.body.removeChild(portal);
  });

  it("should provide storage power tools", () => {
    const driver = TestDriver.render(<MockForm />);

    driver.storage.set("user", { id: 1 });
    driver.storage.expectValue("user", { id: 1 });
    expect(driver.storage.get("user")).toEqual({ id: 1 });

    driver.storage.clear();
    expect(driver.storage.get("user")).toBeNull();
  });

  it("should mock BOM interactions", () => {
    const driver = TestDriver.render(<MockForm />);

    const alertSpy = driver.mockAlert();
    window.alert("test");
    expect(alertSpy).toHaveBeenCalledWith("test");

    const confirmSpy = driver.mockConfirm(true);
    const result = window.confirm("ok?");
    expect(confirmSpy).toHaveBeenCalledWith("ok?");
    expect(result).toBe(true);
  });
});
