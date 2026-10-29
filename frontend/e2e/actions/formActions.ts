import { expect } from "@playwright/test";
import type { Page } from "@playwright/test";
/**
 * Functional Actions for Form Interaction
 * These are pure-ish functions that take the Playwright Page and act upon it.
 */

export const fillTextInput = async (
  page: Page,
  nameOrLabel: string,
  value: string
) => {
  // Use Playwright's robust getByRole/getByLabel fallback mechanism
  const input = page
    .getByRole("textbox", { name: nameOrLabel })
    .first()
    .or(
      page
        .locator(
          `input[name="${nameOrLabel}"], input[placeholder="${nameOrLabel}"], [aria-label="${nameOrLabel}"]`
        )
        .first()
    );
  await input.fill(value);
};

export const selectDropdownOption = async (
  page: Page,
  nameOrLabel: string,
  optionText: string
) => {
  // Assumes standard select or combobox accessibility patterns
  const select = page
    .locator(
      `select[name="${nameOrLabel}"], [role="combobox"][aria-label="${nameOrLabel}"]`
    )
    .first();
  await select.selectOption({ label: optionText });
};

export const toggleCheckbox = async (
  page: Page,
  nameOrLabel: string,
  check: boolean
) => {
  const checkbox = page.getByRole("checkbox", { name: nameOrLabel });
  if (check) {
    await checkbox.check();
  } else {
    await checkbox.uncheck();
  }
};

export const submitForm = async (page: Page, formSelector: string = "form") => {
  const submitBtn = page
    .locator(formSelector)
    .locator(
      'button[type="submit"], input[type="submit"], [data-part="submit-btn"]'
    )
    .first();
  await submitBtn.click();
  // Optional: wait for network idle if submission triggers API calls
  // await page.waitForLoadState('networkidle');
};

export const assertFieldError = async (
  page: Page,
  _nameOrLabel: string,
  errorMessage: string
) => {
  // A generic way to find sibling or related error messages based on standard ARIA patterns or class names
  const errorElement = page.locator(`text="${errorMessage}"`);
  await expect(errorElement).toBeVisible();
};

export const clearForm = async (page: Page, formSelector: string = "form") => {
  const resetBtn = page
    .locator(formSelector)
    .locator('button[type="reset"], input[type="reset"]')
    .first();
  if (await resetBtn.isVisible()) {
    await resetBtn.click();
  }
};
