import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Form } from "@ui/form/Form";
import type { FormDefinition } from "@ui/form/types";
import { expect } from "vitest";

import { renderWithProviders } from "../test-utils";
import { BaseDriver } from "./BaseDriver";

export class LogicBranchingDriver extends BaseDriver {
  private user: ReturnType<typeof userEvent.setup>;

  constructor(
    container: HTMLElement,
    user: ReturnType<typeof userEvent.setup>
  ) {
    super(container);
    this.user = user;
  }

  static async render(definition: FormDefinition) {
    const user = userEvent.setup();
    const { container } = renderWithProviders(<Form definition={definition} />);
    return {
      driver: new LogicBranchingDriver(container, user),
      container,
    };
  }

  // --- Actions ---

  async selectOption(label: string) {
    // Choice field might be lazy loaded
    await this.waitForField("path-select");

    const trigger = await screen.findByRole("combobox");
    await this.user.click(trigger);

    const option = await screen.findByText(label);
    await this.user.click(option);
  }

  async clickNext() {
    const nextBtn = screen.getByRole("button", { name: /next/i });
    await this.user.click(nextBtn);
    await new Promise((r) => setTimeout(r, 600));
  }

  async clickBack() {
    const backBtn = screen.getByRole("button", { name: /back/i });
    await this.user.click(backBtn);
    await new Promise((r) => setTimeout(r, 600));
  }

  // --- Assertions ---

  async expectStep(title: string) {
    const heading = await screen.findByRole("heading", { name: title });
    expect(heading).toBeInTheDocument();
  }

  async expectField(id: string) {
    const field = this.container.querySelector(`#${id}`);
    expect(field).toBeInTheDocument();
  }

  async expectFieldGone(id: string) {
    const field = this.container.querySelector(`#${id}`);
    expect(field).toBeNull();
  }
}
