/**
 * Factories - Test Data Factories
 * 
 * Provides factory functions for generating test data with customizable overrides.
 * Uses the builder pattern for complex object creation.
 */

import { faker } from '@faker-js/faker';
import * as fixtures from '../fixtures';

// --- Base Factory ---

export interface FactoryOptions<T> {
  overrides?: Partial<T>;
  count?: number;
  sequence?: (index: number) => Partial<T>;
}

export abstract class BaseFactory<T> {
  public abstract createEntity(overrides?: Partial<T>): T;

  create(overrides?: Partial<T>): T {
    return this.createEntity(overrides);
  }

  createMany(count: number, overrides?: Partial<T>): T[] {
    return Array.from({ length: count }, () => this.createEntity(overrides));
  }

  createSequence(count: number, sequence: (index: number) => Partial<T>): T[] {
    return Array.from({ length: count }, (_, i) => this.createEntity(sequence(i)));
  }

  createWithOptions(options: FactoryOptions<T>): T | T[] {
    if (options.count && options.count > 1) {
      if (options.sequence) {
        return this.createSequence(options.count, options.sequence);
      }
      return this.createMany(options.count, options.overrides);
    }
    return this.createEntity(options.overrides);
  }
}

// --- Concrete Factories ---

export class UserFactory extends BaseFactory<fixtures.UserFixture> {
  public createEntity(overrides?: Partial<fixtures.UserFixture>): fixtures.UserFixture {
    return fixtures.createUserFixture(overrides);
  }

  createAdmin(overrides?: Partial<fixtures.UserFixture>): fixtures.UserFixture {
    return this.createEntity({ role: 'admin', status: 'active', ...overrides });
  }

  createInactive(overrides?: Partial<fixtures.UserFixture>): fixtures.UserFixture {
    return this.createEntity({ status: 'inactive', ...overrides });
  }

  createWithDepartment(department: string, overrides?: Partial<fixtures.UserFixture>): fixtures.UserFixture {
    return this.createEntity({ department, ...overrides });
  }
}

export class CompanyFactory extends BaseFactory<fixtures.CompanyFixture> {
  public createEntity(overrides?: Partial<fixtures.CompanyFixture>): fixtures.CompanyFixture {
    return fixtures.createCompanyFixture(overrides);
  }

  createEnterprise(overrides?: Partial<fixtures.CompanyFixture>): fixtures.CompanyFixture {
    return this.createEntity({ size: 'enterprise', status: 'active', ...overrides });
  }

  createStartup(overrides?: Partial<fixtures.CompanyFixture>): fixtures.CompanyFixture {
    return this.createEntity({ size: 'startup', status: 'trial', ...overrides });
  }

  createWithIndustry(industry: string, overrides?: Partial<fixtures.CompanyFixture>): fixtures.CompanyFixture {
    return this.createEntity({ industry, ...overrides });
  }
}

export class BranchFactory extends BaseFactory<fixtures.BranchFixture> {
  public createEntity(overrides?: Partial<fixtures.BranchFixture>): fixtures.BranchFixture {
    return fixtures.createBranchFixture(overrides);
  }

  createHeadquarters(overrides?: Partial<fixtures.BranchFixture>): fixtures.BranchFixture {
    return this.createEntity({ type: 'headquarters', status: 'active', ...overrides });
  }

  createStore(overrides?: Partial<fixtures.BranchFixture>): fixtures.BranchFixture {
    return this.createEntity({ type: 'store', status: 'active', ...overrides });
  }

  createClinic(overrides?: Partial<fixtures.BranchFixture>): fixtures.BranchFixture {
    return this.createEntity({ type: 'clinic', status: 'active', ...overrides });
  }
}

export class ProductFactory extends BaseFactory<fixtures.ProductFixture> {
  public createEntity(overrides?: Partial<fixtures.ProductFixture>): fixtures.ProductFixture {
    return fixtures.createProductFixture(overrides);
  }

  createActive(overrides?: Partial<fixtures.ProductFixture>): fixtures.ProductFixture {
    return this.createEntity({ status: 'active', ...overrides });
  }

  createDraft(overrides?: Partial<fixtures.ProductFixture>): fixtures.ProductFixture {
    return this.createEntity({ status: 'draft', ...overrides });
  }

  createWithCategory(category: string, overrides?: Partial<fixtures.ProductFixture>): fixtures.ProductFixture {
    return this.createEntity({ category, ...overrides });
  }

  createWithPriceRange(min: number, max: number, overrides?: Partial<fixtures.ProductFixture>): fixtures.ProductFixture {
    const price = faker.number.float({ min, max, fractionDigits: 2 });
    const cost = faker.number.float({ min: 1, max: price * 0.8, fractionDigits: 2 });
    return this.createEntity({ price, cost, ...overrides });
  }
}

export class OrderFactory extends BaseFactory<fixtures.OrderFixture> {
  public createEntity(overrides?: Partial<fixtures.OrderFixture>): fixtures.OrderFixture {
    return fixtures.createOrderFixture(overrides);
  }

  createPending(overrides?: Partial<fixtures.OrderFixture>): fixtures.OrderFixture {
    return this.createEntity({ status: 'pending', paymentStatus: 'pending', ...overrides });
  }

  createCompleted(overrides?: Partial<fixtures.OrderFixture>): fixtures.OrderFixture {
    return this.createEntity({ 
      status: 'delivered', 
      paymentStatus: 'paid',
      shippedAt: faker.date.recent({ days: 7 }).toISOString(),
      deliveredAt: faker.date.recent({ days: 2 }).toISOString(),
      ...overrides 
    });
  }

  createCancelled(overrides?: Partial<fixtures.OrderFixture>): fixtures.OrderFixture {
    return this.createEntity({ status: 'cancelled', paymentStatus: 'refunded', ...overrides });
  }

  createHighValue(overrides?: Partial<fixtures.OrderFixture>): fixtures.OrderFixture {
    const items = Array.from({ length: faker.number.int({ min: 3, max: 8 }) }, () => ({
      productId: faker.string.uuid(),
      productName: faker.commerce.productName(),
      sku: faker.string.alphanumeric({ length: 12 }).toUpperCase(),
      quantity: faker.number.int({ min: 2, max: 20 }),
      unitPrice: parseFloat(faker.commerce.price({ min: 100, max: 2000 })),
      totalPrice: 0,
      discount: faker.number.float({ min: 0, max: 0.15, fractionDigits: 2 }),
    }));

    // Calculate totals
    items.forEach(item => {
      item.totalPrice = item.quantity * item.unitPrice;
    });

    const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
    const discount = subtotal * (items[0]?.discount || 0);
    const tax = (subtotal - discount) * 0.1;
    const shipping = faker.number.float({ min: 20, max: 100, fractionDigits: 2 });
    const total = subtotal - discount + tax + shipping;

    return this.createEntity({
      items,
      subtotal,
      tax: subtotal * 0.1,
      shipping: faker.number.float({ min: 20, max: 100, fractionDigits: 2 }),
      discount,
      total,
      ...overrides,
    });
  }
}

export class EmployeeFactory extends BaseFactory<fixtures.EmployeeFixture> {
  public createEntity(overrides?: Partial<fixtures.EmployeeFixture>): fixtures.EmployeeFixture {
    return fixtures.createEmployeeFixture(overrides);
  }

  createFullTime(overrides?: Partial<fixtures.EmployeeFixture>): fixtures.EmployeeFixture {
    return this.createEntity({ employmentType: 'full_time', status: 'active', ...overrides });
  }

  createContractor(overrides?: Partial<fixtures.EmployeeFixture>): fixtures.EmployeeFixture {
    return this.createEntity({ 
      employmentType: 'contractor', 
      salary: { amount: 0, currency: 'USD', frequency: 'hourly' },
      ...overrides 
    });
  }

  createManager(overrides?: Partial<fixtures.EmployeeFixture>): fixtures.EmployeeFixture {
    return this.createEntity({ 
      position: 'Engineering Manager',
      department: 'Engineering',
      salary: { amount: faker.number.int({ min: 120000, max: 200000 }), currency: 'USD', frequency: 'annual' },
      ...overrides 
    });
  }

  createWithDepartment(department: string, overrides?: Partial<fixtures.EmployeeFixture>): fixtures.EmployeeFixture {
    return this.createEntity({ department, ...overrides });
  }
}

// --- Factory Registry ---

export const factories = {
  user: new UserFactory(),
  company: new CompanyFactory(),
  branch: new BranchFactory(),
  product: new ProductFactory(),
  order: new OrderFactory(),
  employee: new EmployeeFactory(),
} as const;

export type FactoryRegistry = typeof factories;

// --- Factory Builder Pattern ---

export interface Builder<T> {
  with<K extends keyof T>(key: K, value: T[K]): this;
  build(): T;
  buildMany(count: number): T[];
}

export function createBuilder<T>(factory: BaseFactory<T>): Builder<T> {
  const overrides: Partial<T> = {};

  return {
    with<K extends keyof T>(key: K, value: T[K]): Builder<T> {
      overrides[key] = value;
      return this;
    },
    build(): T {
      return factory.createEntity(overrides);
    },
    buildMany(count: number): T[] {
      return factory.createMany(count, overrides);
    },
  };
}

// --- Pre-built Builders ---

export const userBuilder = createBuilder(factories.user);
export const companyBuilder = createBuilder(factories.company);
export const branchBuilder = createBuilder(factories.branch);
export const productBuilder = createBuilder(factories.product);
export const orderBuilder = createBuilder(factories.order);
export const employeeBuilder = createBuilder(factories.employee);

// --- Data Generators ---

export class DataGenerator {
  static *users(count: number): Generator<fixtures.UserFixture> {
    for (let i = 0; i < count; i++) {
      yield fixtures.createUserFixture({ 
        email: `test-user-${i}@example.com`,
        employeeId: `EMP${String(i).padStart(6, '0')}`,
      });
    }
  }

  static *companies(count: number): Generator<fixtures.CompanyFixture> {
    for (let i = 0; i < count; i++) {
      yield fixtures.createCompanyFixture({ 
        code: `COMP${String(i).padStart(4, '0')}`,
      });
    }
  }

  static *products(count: number): Generator<fixtures.ProductFixture> {
    for (let i = 0; i < count; i++) {
      yield fixtures.createProductFixture({ 
        sku: `PROD${String(i).padStart(8, '0')}`,
      });
    }
  }

  static *orders(count: number): Generator<fixtures.OrderFixture> {
    for (let i = 0; i < count; i++) {
      yield fixtures.createOrderFixture({ 
        orderNumber: `ORD-${String(i).padStart(8, '0')}`,
      });
    }
  }

  static *employees(count: number): Generator<fixtures.EmployeeFixture> {
    for (let i = 0; i < count; i++) {
      yield fixtures.createEmployeeFixture({ 
        employeeId: `EMP${String(i).padStart(6, '0')}`,
      });
    }
  }
}

// --- Scenario Builders ---

export interface ScenarioBuilder<T> {
  withData(data: T): this;
  withDefaults(defaults: Partial<T>): this;
  withVariations(variations: Array<Partial<T>>): this;
  build(): T[];
  buildSingle(): T;
}

export function createScenarioBuilder<T>(factory: BaseFactory<T>): ScenarioBuilder<T> {
  let baseData: T | null = null;
  let defaults: Partial<T> = {};
  let variations: Array<Partial<T>> = [];

  return {
    withData(data: T): ScenarioBuilder<T> {
      baseData = data;
      return this;
    },
    withDefaults(defaults: Partial<T>): ScenarioBuilder<T> {
      defaults = defaults;
      return this;
    },
    withVariations(variations: Array<Partial<T>>): ScenarioBuilder<T> {
      variations = variations;
      return this;
    },
    build(): T[] {
      if (baseData) {
        return [factory.createEntity(baseData)];
      }
      if (variations.length > 0) {
        return variations.map(v => factory.createEntity({ ...defaults, ...v }));
      }
      return [factory.createEntity(defaults)];
    },
    buildSingle(): T {
      if (baseData) {
        return factory.createEntity(baseData);
      }
      return factory.createEntity(defaults);
    },
  };
}