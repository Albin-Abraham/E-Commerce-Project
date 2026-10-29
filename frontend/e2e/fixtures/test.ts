import { test as base } from "@playwright/test";

import * as formActions from "../actions/formActions";
import * as tableActions from "../actions/tableActions";

// Define the type for our custom fixtures
type AppFixtures = {
  form: typeof formActions;
  table: typeof tableActions;
};

// Extend the base Playwright test with our functional fixtures
export const test = base.extend<AppFixtures>({
  form: async ({}, use) => {
    await use(formActions);
  },

  table: async ({}, use) => {
    await use(tableActions);
  },
});

// Re-export expect so we can just import from this custom fixture file
export { expect } from "@playwright/test";
