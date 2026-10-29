/**
 * Form Driver - Semantic Expert Layer for Form Testing
 * 
 * Inherits all mechanical power from BaseDriver but provides
 * business-logic oriented methods for testing forms.
 */

import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Form } from '@ui/form/Form';
import type { FormDefinition } from '@ui/form/types';
import { expect } from 'vitest';
import { renderWithProviders } from '../../test-utils';
import { BaseDriver } from '../base';

export class FormDriver extends BaseDriver {
  protected user: ReturnType<typeof userEvent.setup>;

  constructor(
    container: HTMLElement,
    user: ReturnType<typeof userEvent.setup> = userEvent.setup()
  ) {
    super(container);
    this.user = user;
  }

  static async render(
    definition: FormDefinition,
    theme?: any,
    initialData?: any,
    onSubmit?: (data: any) => Promise<any> | void
  ) {
    const user = userEvent.setup();
    const { container } = renderWithProviders(
      <Form
        definition={definition}
        theme={theme}
        initialData={initialData}
        onSubmit={onSubmit || (definition.events?.onSubmit as any)}
      />
    );

    return {
      driver: new FormDriver(container, user),
      container,
      user,
    };
  }

  static async renderGeneric(
    Component: React.ComponentType<any>,
    props: any = {}
  ) {
    const user = userEvent.setup();
    const { container } = renderWithProviders(<Component {...props} />);

    return {
      container,
      user,
    };
  }

  // --- Semantic Interactions ---

  public async fill(name: string, value: any) {
    await this.waitForFieldName(name);
    await this.setFieldValueByName(name, value);
    return this;
  }

  public async submit() {
    const button =
      (this.container.querySelector('button[type="submit"]') as HTMLElement) ||
      (this.container.querySelector('[data-part="submit-btn"]') as HTMLElement) ||
      (this.container.querySelector('.form-footer button:last-child') as HTMLElement) ||
      (await screen.findByRole('button', {
        name: /submit|save|complete|login|registration|next step|continue/i,
      }));

    if (!button)
      throw new Error(
        'Submit button not found (looked for type="submit", data-part="submit-btn", and common labels)'
      );

    await this.user.click(button);
    return this;
  }

  public async nextStep() {
    const button = await within(this.container).findByRole('button', {
      name: /next step|continue|register|submit|complete|save/i,
    });
    await this.user.click(button);
    await new Promise((r) => setTimeout(r, 600));
    return this;
  }

  public async prevStep() {
    const button = await within(this.container).findByRole('button', {
      name: /back|previous/i,
    });
    await this.user.click(button);
    await new Promise((r) => setTimeout(r, 600));
    return this;
  }

  // --- 5V Matrix Assertions ---

  public async expectVisible(name: string, visible: boolean = true) {
    if (visible) {
      await this.waitForFieldName(name);
      const wrapper = this.getWrapperByName(name);
      expect(wrapper).toBeInTheDocument();
      expect(wrapper).toBeVisible();
    } else {
      const wrapper = this.getWrapperByName(name);
      expect(wrapper).not.toBeInTheDocument();
    }
  }

  public async expectError(name: string, message: string | RegExp) {
    const wrapper = this.getWrapperByName(name);
    if (!wrapper) throw new Error(`Field ensemble for "${name}" not found`);

    await this.waitFor(() => {
      const el =
        wrapper.querySelector('[role="alert"]') ||
        wrapper.querySelector('.text-danger') ||
        within(wrapper).queryByText(message as any);
      if (!el) throw new Error(`Error message for "${name}" not found`);
    });

    const errorEl =
      wrapper.querySelector('[role="alert"]') ||
      wrapper.querySelector('.text-danger') ||
      within(wrapper).getByText(message as any);

    expect(errorEl.textContent).toMatch(message);
  }

  public async expectValue(name: string, value: any) {
    const actual = await this.getFieldValueByName(name);
    expect(actual).toEqual(value);
  }

  public async expectValues(values: Record<string, any>) {
    for (const [name, value] of Object.entries(values)) {
      await this.expectValue(name, value);
    }
  }

  public async expectValidationFailure() {
    const errorClasses = ['.text-danger', "[role='alert']", '.form-field__error'];

    await this.waitFor(() => {
      const hasError = errorClasses.some((cls) => this.container.querySelector(cls));
      if (!hasError)
        throw new Error('Expected validation failure, but no error elements found');
    });
  }

  public async expectDisabled(name: string) {
    const wrapper = this.getWrapperByName(name);
    const input = wrapper?.querySelector('input, select, textarea, button');
    expect(input).toBeDisabled();
  }

  public async expectEnabled(name: string) {
    const wrapper = this.getWrapperByName(name);
    const input = wrapper?.querySelector('input, select, textarea, button');
    expect(input).not.toBeDisabled();
  }

  public async expectRequired(name: string) {
    const wrapper = this.getWrapperByName(name);
    const input = wrapper?.querySelector('input, select, textarea');
    expect(input).toBeRequired();
  }

  public async expectOptional(name: string) {
    const wrapper = this.getWrapperByName(name);
    const input = wrapper?.querySelector('input, select, textarea');
    expect(input).not.toBeRequired();
  }

  public async expectFormValid() {
    const submitBtn = this.container.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(submitBtn).not.toBeDisabled();
  }

  public async expectFormInvalid() {
    const submitBtn = this.container.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(submitBtn).toBeDisabled();
  }
}

export { within };