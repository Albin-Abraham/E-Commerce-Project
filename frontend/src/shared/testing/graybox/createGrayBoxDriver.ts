import React from "react";
import userEvent from "@testing-library/user-event";
import { GrayBoxHarness, type GrayBoxHarnessOptions } from "./GrayBoxHarness";
import { BaseDriver } from "../drivers/BaseDriver";

export type GrayBoxDriverFactory<TDriver extends BaseDriver> = (
  container: HTMLElement,
  user: ReturnType<typeof userEvent.setup>,
  harness: GrayBoxHarness
) => TDriver;

export function createGrayBoxDriver<TDriver extends BaseDriver>(
  driverFactory: GrayBoxDriverFactory<TDriver>
) {
  return {
    async render(ui: React.ReactElement, options?: GrayBoxHarnessOptions) {
      const user = userEvent.setup();
      const harness = GrayBoxHarness.render(ui, options);
      const driver = driverFactory(harness.container, user, harness);
      return { driver, harness, user };
    },
  };
}
