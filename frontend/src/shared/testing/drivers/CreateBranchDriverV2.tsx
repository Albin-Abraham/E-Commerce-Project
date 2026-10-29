import { expect, vi } from "vitest";
import type userEvent from "@testing-library/user-event";

import CreateBranch from "@pages/static-pages/CreateBranch";

import { createFormDriver, renderComponent } from "./FormDriverV2";

export interface CreateBranchDriverOptions {
  container?: HTMLElement;
  testId?: string;
  testName?: string;
}

export interface CreateBranchDriver {
  container: HTMLElement;
  driver: ReturnType<typeof createFormDriver>;
  alertMock: ReturnType<typeof vi.spyOn>;
  
  deployBranch: (data: any) => Promise<CreateBranchDriver>;
  fillForm: (data: any) => Promise<CreateBranchDriver>;
  expectPremiumAesthetic: () => Promise<void>;
  expectIconFidelity: () => Promise<void>;
  expectSuccess: () => Promise<void>;
  expectValidationFailure: () => Promise<void>;
}

export function createCreateBranchDriver(options: CreateBranchDriverOptions = {}): CreateBranchDriver {
  const { container = document.body, testId = "create-branch-test", testName = "Create Branch Test" } = options;
  
  const formDriver = createFormDriver({ container, testId, testName });
  const alertMock = vi.spyOn(window, "alert").mockImplementation(() => {});
  
  const driver: CreateBranchDriver = {
    container,
    driver: formDriver,
    alertMock,
    
    async deployBranch(data: any) {
      await driver.fillForm(data);
      await driver.driver.submit();
      return driver;
    },
    
    async fillForm(data: any) {
      if (data.branchName) {
        await driver.driver.fill("branchName", data.branchName);
      }
      if (data.branchCode) {
        await driver.driver.fill("branchCode", data.branchCode);
      }
      if (data.region) {
        await driver.driver.fill("region", data.region);
      }
      if (data.city) {
        await driver.driver.fill("city", data.city);
      }
      if (data.address) {
        await driver.driver.fill("address", data.address);
      }
      if (data.managerName) {
        await driver.driver.fill("managerName", data.managerName);
      }
      if (data.managerEmail) {
        await driver.driver.fill("managerEmail", data.managerEmail);
      }
      if (data.managerPhone) {
        await driver.driver.fill("managerPhone", data.managerPhone);
      }
      if (data.operatingHours) {
        await driver.driver.fill("operatingHours", data.operatingHours);
      }
      if (data.servicesOffered) {
        await driver.driver.fill("servicesOffered", data.servicesOffered);
      }
      if (data.isHub !== undefined) {
        await driver.driver.fill("isHub", data.isHub);
      }
      if (data.status) {
        await driver.driver.fill("status", data.status);
      }
      return driver;
    },
    
    async expectPremiumAesthetic() {
      // Check for theme tokens, rounded corners, shadows
      const formEl = driver.container.querySelector("form");
      if (!formEl) throw new Error("Form not found");
      
      const formClasses = formEl.className;
      const hasAesthetic = 
        formClasses.includes("rounded") || 
        formClasses.includes("shadow") || 
        formClasses.includes("border");
        
      if (!hasAesthetic) {
        throw new Error("Form lacks expected design tokens (rounded, shadow, border)");
      }
    },
    
    async expectIconFidelity() {
      // Ensure specific fields have their respective icons rendered
      const fieldsWithIcons = ["branchName", "managerEmail", "managerPhone", "address"];
      for (const name of fieldsWithIcons) {
        const wrapper = driver.driver.query.getFormFieldByName(name).wrapper;
        if (!wrapper) {
          throw new Error(`Field "${name}" wrapper not found`);
        }
        const icon = wrapper.querySelector("svg");
        if (!icon) {
          throw new Error(`Icon missing for field "${name}"`);
        }
      }
    },
    
    async expectSuccess() {
      await driver.driver.wait.waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith(
          "Branch Deployed Successfully!"
        );
      }, { timeout: 4000 });
    },
    
    async expectValidationFailure() {
      await driver.driver.wait.waitFor(() => {
        const alerts = driver.container.querySelectorAll('[role="alert"]');
        if (alerts.length === 0) throw new Error("No validation alerts found");
      });
    },
  };
  
  return driver;
}

export interface RenderCreateBranchOptions {
  testId?: string;
  testName?: string;
}

export async function renderCreateBranch(options: RenderCreateBranchOptions = {}): Promise<{ driver: CreateBranchDriver; alertMock: ReturnType<typeof vi.spyOn>; container: HTMLElement; user: ReturnType<typeof userEvent.setup> }> {
  const alertMock = vi.spyOn(window, "alert").mockImplementation(() => {});
  
  const { container, user } = await renderComponent({
    component: CreateBranch,
    testId: options.testId,
    testName: options.testName,
  });
  
  const driver = createCreateBranchDriver({
    container,
    testId: options.testId,
    testName: options.testName,
  });
  
  return { driver, alertMock, container, user };
}

export function createCreateBranchDriverFactory() {
  return {
    create: createCreateBranchDriver,
    renderCreateBranch,
  };
}

export const createBranchDriverFactory = createCreateBranchDriverFactory();