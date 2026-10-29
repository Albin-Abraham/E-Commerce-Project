import { renderWithProviders } from "../test-utils";
import { Form } from "@ui/form/Form";
import type { FormDefinition } from "@form-core/domain";
import userEvent from "@testing-library/user-event";

import { createQueryCapability } from "../capabilities/queries";
import { createInteractionCapability } from "../capabilities/interactions";
import { createAssertionCapability } from "../capabilities/assertions";
import { createAsyncCapability } from "../capabilities/async";
import { createDiagnosticsCapability } from "../capabilities/diagnostics";
import { createIsolationCapability } from "../infrastructure/isolation";

export interface FormDriverOptions {
  container: HTMLElement;
  user?: ReturnType<typeof userEvent.setup>;
  testId?: string;
  testName?: string;
}

export interface IFormDriver {
  container: HTMLElement;
  user: ReturnType<typeof userEvent.setup>;
  testId: string;
  testName: string;
  
  // Queries
  query: ReturnType<typeof createQueryCapability>;
  
  // Interactions
  interact: ReturnType<typeof createInteractionCapability>;
  
  // Assertions
  expect: ReturnType<typeof createAssertionCapability>;
  
  // Async
  wait: ReturnType<typeof createAsyncCapability>;
  
  // Diagnostics
  diagnose: ReturnType<typeof createDiagnosticsCapability>;
  
  // Isolation
  isolate: ReturnType<typeof createIsolationCapability>;
  
  // Form-specific semantic methods
  fill: (name: string, value: any) => Promise<IFormDriver>;
  submit: () => Promise<IFormDriver>;
  nextStep: () => Promise<IFormDriver>;
  prevStep: () => Promise<IFormDriver>;
  expectVisible: (name: string, visible?: boolean) => Promise<void>;
  expectError: (name: string, message: string | RegExp) => Promise<void>;
  expectValue: (name: string, value: any) => Promise<void>;
  expectValues: (values: Record<string, any>) => Promise<void>;
  expectValidationFailure: () => Promise<void>;
  expectFormValid: () => Promise<void>;
  expectAccessible: (options?: any) => Promise<void>;
}

export type FormDriverInstance = IFormDriver;

export function createFormDriver(options: FormDriverOptions): IFormDriver {
  const { container, user = userEvent.setup(), testId = "form-test", testName = "Form Test" } = options;
  
  const query = createQueryCapability(container);
  const interact = createInteractionCapability(container);
  const expect = createAssertionCapability(container);
  const wait = createAsyncCapability(container);
  const diagnose = createDiagnosticsCapability(container);
  const isolate = createIsolationCapability();
  
  const driver: IFormDriver = {
    container,
    user,
    testId,
    testName,
    query,
    interact,
    expect,
    wait,
    diagnose,
    isolate,
    
    // Form-specific semantic methods
    async fill(name: string, value: any) {
      await interact.fillFieldByName(name, value);
      return driver;
    },
    
    async submit() {
      await interact.submitForm();
      return driver;
    },
    
    async nextStep() {
      await interact.clickNextStep();
      return driver;
    },
    
    async prevStep() {
      await interact.clickPrevStep();
      return driver;
    },
    
    async expectVisible(name: string, visible: boolean = true) {
      if (visible) {
        await expect.expectFieldVisible({ name });
      } else {
        await expect.expectFieldNotVisible({ name });
      }
    },
    
    async expectError(name: string, message: string | RegExp) {
      await expect.expectFieldError({ name }, message);
    },
    
    async expectValue(name: string, value: any) {
      await expect.expectFieldValue({ name }, value);
    },
    
    async expectValues(values: Record<string, any>) {
      for (const [name, value] of Object.entries(values)) {
        await driver.expectValue(name, value);
      }
    },
    
    async expectValidationFailure() {
      await expect.expectFormInvalid();
    },
    
    async expectFormValid() {
      await expect.expectFormValid();
    },
    
    async expectAccessible(options?: any) {
      await expect.expectAccessible(options);
    },
  };
  
  return driver;
}

export interface RenderFormOptions {
  definition: FormDefinition;
  theme?: any;
  initialData?: any;
  onSubmit?: (data: any) => Promise<any> | void;
  testId?: string;
  testName?: string;
}

export async function renderForm(options: RenderFormOptions): Promise<{ driver: IFormDriver; container: HTMLElement; user: ReturnType<typeof userEvent.setup> }> {
  const user = userEvent.setup();
  
  const { container } = renderWithProviders(
    <Form
      definition={options.definition}
      theme={options.theme}
      initialData={options.initialData}
      onSubmit={options.onSubmit}
    />
  );
  
  const driver = createFormDriver({
    container,
    user,
    testId: options.testId,
    testName: options.testName,
  });
  
  return { driver, container, user };
}

export interface RenderComponentOptions {
  component: React.ComponentType<any>;
  props?: any;
  testId?: string;
  testName?: string;
}

export async function renderComponent(options: RenderComponentOptions): Promise<{ driver: IFormDriver; container: HTMLElement; user: ReturnType<typeof userEvent.setup> }> {
  const user = userEvent.setup();
  
  const { container } = renderWithProviders(<options.component {...options.props} />);
  
  const driver = createFormDriver({
    container,
    user,
    testId: options.testId,
    testName: options.testName,
  });
  
  return { driver, container, user };
}

export function createFormDriverFactory() {
  return {
    create: createFormDriver,
    renderForm,
    renderComponent,
  };
}

export const formDriverFactory = createFormDriverFactory();

/**
 * @deprecated Use createFormDriver() and the composed capability interface instead.
 * This class provides backward compatibility for existing tests using the old FormDriver API.
 */
export class FormDriver {
  protected container: HTMLElement;
  protected user: ReturnType<typeof userEvent.setup>;
  protected driver: IFormDriver;

  constructor(
    container: HTMLElement,
    user: ReturnType<typeof userEvent.setup> = userEvent.setup()
  ) {
    this.container = container;
    this.user = user;
    this.driver = createFormDriver({ container, user });
  }

  // --- Delegated capability access ---
  get query() { return this.driver.query; }
  get interact() { return this.driver.interact; }
  get expect() { return this.driver.expect; }
  get wait() { return this.driver.wait; }
  get diagnose() { return this.driver.diagnose; }
  get isolate() { return this.driver.isolate; }

  // --- Static factory methods (backward compatible) ---
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

  // --- Legacy method delegation ---
  async fill(name: string, value: any) {
    return this.driver.fill(name, value);
  }

  async submit() {
    return this.driver.submit();
  }

  async nextStep() {
    return this.driver.nextStep();
  }

  async prevStep() {
    return this.driver.prevStep();
  }

  async expectVisible(name: string, visible: boolean = true) {
    return this.driver.expectVisible(name, visible);
  }

  async expectError(name: string, message: string | RegExp) {
    return this.driver.expectError(name, message);
  }

  async expectValue(name: string, value: any) {
    return this.driver.expectValue(name, value);
  }

  async expectValues(values: Record<string, any>) {
    return this.driver.expectValues(values);
  }

  async expectValidationFailure() {
    return this.driver.expectValidationFailure();
  }

  async expectAccessible(options?: any) {
    return this.driver.expectAccessible(options);
  }

  // --- BaseDriver methods (delegated to capabilities) ---
  protected waitFor(callback: () => void | Promise<void>, timeout = 4000) {
    return this.driver.wait.waitFor(callback, { timeout });
  }

  protected waitForField(id: string) {
    return this.driver.wait.waitForElement({ selector: `#${id}` });
  }

  protected waitForFieldName(name: string) {
    const field = this.driver.query.getFormFieldByName(name);
    return this.driver.wait.waitFor(() => {
      if (!field.wrapper) throw new Error(`Field "${name}" not found in DOM`);
      const pulse = field.wrapper.querySelector(".animate-pulse");
      if (pulse) throw new Error(`Field "${name}" is still loading (skeleton active)`);
    });
  }

  getWrapper(id: string) {
    return this.container.querySelector(`[data-field-id="${id}"]`);
  }

  getWrapperByName(name: string) {
    return this.container.querySelector(`[data-field-name="${name}"]`);
  }

  hasButton(text: string | RegExp): boolean {
    const buttons = Array.from(this.container.querySelectorAll("button")) as HTMLButtonElement[];
    return buttons.some((btn) => {
      const content = btn.textContent?.trim() || "";
      return typeof text === "string"
        ? content.includes(text)
        : text.test(content);
    });
  }
}