/**
 * Fixtures - Test Data Fixtures
 * 
 * Provides reusable test data fixtures for common entities.
 */

import { faker } from '@faker-js/faker';

// --- User Fixtures ---

export interface UserFixture {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: 'admin' | 'user' | 'manager' | 'viewer';
  status: 'active' | 'inactive' | 'pending';
  createdAt: string;
  updatedAt: string;
  avatar?: string;
  phone?: string;
  department?: string;
  employeeId?: string;
}

export function createUserFixture(overrides: Partial<UserFixture> = {}): UserFixture {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  
  return {
    id: faker.string.uuid(),
    email: faker.internet.email({ firstName, lastName }).toLowerCase(),
    firstName,
    lastName,
    fullName: `${firstName} ${lastName}`,
    role: faker.helpers.arrayElement(['admin', 'user', 'manager', 'viewer']),
    status: faker.helpers.arrayElement(['active', 'inactive', 'pending']),
    createdAt: faker.date.past({ years: 2 }).toISOString(),
    updatedAt: faker.date.recent({ days: 30 }).toISOString(),
    avatar: faker.image.avatar(),
    phone: faker.phone.number(),
    department: faker.helpers.arrayElement(['Engineering', 'Sales', 'Marketing', 'HR', 'Finance']),
    employeeId: faker.string.alphanumeric({ length: 8 }).toUpperCase(),
    ...overrides,
  };
}

export function createAdminUserFixture(overrides: Partial<UserFixture> = {}): UserFixture {
  return createUserFixture({ role: 'admin', status: 'active', ...overrides });
}

export function createInactiveUserFixture(overrides: Partial<UserFixture> = {}): UserFixture {
  return createUserFixture({ status: 'inactive', ...overrides });
}

// --- Company/Organization Fixtures ---

export interface CompanyFixture {
  id: string;
  name: string;
  code: string;
  domain: string;
  industry: string;
  size: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
  status: 'active' | 'inactive' | 'trial';
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
  contact: {
    email: string;
    phone: string;
    website?: string;
  };
  settings: {
    timezone: string;
    currency: string;
    language: string;
    dateFormat: string;
  };
  createdAt: string;
  updatedAt: string;
}

export function createCompanyFixture(overrides: Partial<CompanyFixture> = {}): CompanyFixture {
  const name = faker.company.name();
  
  return {
    id: faker.string.uuid(),
    name,
    code: name.substring(0, 4).toUpperCase(),
    domain: `${name.toLowerCase().replace(/\s+/g, '')}.com`,
    industry: faker.helpers.arrayElement(['Technology', 'Healthcare', 'Finance', 'Manufacturing', 'Retail']),
    size: faker.helpers.arrayElement(['startup', 'small', 'medium', 'large', 'enterprise']),
    status: faker.helpers.arrayElement(['active', 'inactive', 'trial']),
    address: {
      street: faker.location.streetAddress(),
      city: faker.location.city(),
      state: faker.location.state(),
      country: faker.location.country(),
      postalCode: faker.location.zipCode(),
    },
    contact: {
      email: faker.internet.email({ provider: name.toLowerCase().replace(/\s+/g, '') }),
      phone: faker.phone.number(),
      website: `https://${name.toLowerCase().replace(/\s+/g, '')}.com`,
    },
    settings: {
      timezone: faker.location.timeZone(),
      currency: 'USD',
      language: 'en',
      dateFormat: 'MM/DD/YYYY',
    },
    createdAt: faker.date.past({ years: 5 }).toISOString(),
    updatedAt: faker.date.recent({ days: 30 }).toISOString(),
    ...overrides,
  };
}

// --- Branch/Location Fixtures ---

export interface BranchFixture {
  id: string;
  companyId: string;
  name: string;
  code: string;
  type: 'headquarters' | 'regional' | 'store' | 'clinic' | 'warehouse';
  status: 'active' | 'inactive' | 'maintenance' | 'opening_soon';
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
  contact: {
    email: string;
    phone: string;
  };
  managerId?: string;
  capacity: number;
  operatingHours: {
    monday: { open: string; close: string; closed: boolean };
    tuesday: { open: string; close: string; closed: boolean };
    wednesday: { open: string; close: string; closed: boolean };
    thursday: { open: string; close: string; closed: boolean };
    friday: { open: string; close: string; closed: boolean };
    saturday: { open: string; close: string; closed: boolean };
    sunday: { open: string; close: string; closed: boolean };
  };
  createdAt: string;
  updatedAt: string;
}

export function createBranchFixture(overrides: Partial<BranchFixture> = {}): BranchFixture {
  const name = faker.company.name() + ' Branch';
  
  return {
    id: faker.string.uuid(),
    companyId: faker.string.uuid(),
    name,
    code: name.substring(0, 4).toUpperCase(),
    type: faker.helpers.arrayElement(['headquarters', 'regional', 'store', 'clinic', 'warehouse']),
    status: faker.helpers.arrayElement(['active', 'inactive', 'maintenance', 'opening_soon']),
    address: {
      street: faker.location.streetAddress(),
      city: faker.location.city(),
      state: faker.location.state(),
      country: faker.location.country(),
      postalCode: faker.location.zipCode(),
    },
    contact: {
      email: faker.internet.email(),
      phone: faker.phone.number(),
    },
    managerId: faker.string.uuid(),
    capacity: faker.number.int({ min: 10, max: 500 }),
    operatingHours: {
      monday: { open: '09:00', close: '17:00', closed: false },
      tuesday: { open: '09:00', close: '17:00', closed: false },
      wednesday: { open: '09:00', close: '17:00', closed: false },
      thursday: { open: '09:00', close: '17:00', closed: false },
      friday: { open: '09:00', close: '17:00', closed: false },
      saturday: { open: '10:00', close: '14:00', closed: true },
      sunday: { open: '10:00', close: '14:00', closed: true },
    },
    createdAt: faker.date.past({ years: 3 }).toISOString(),
    updatedAt: faker.date.recent({ days: 30 }).toISOString(),
    ...overrides,
  };
}

// --- Product Fixtures ---

export interface ProductFixture {
  id: string;
  sku: string;
  name: string;
  description: string;
  category: string;
  subcategory?: string;
  price: number;
  cost: number;
  currency: string;
  taxRate: number;
  unit: string;
  weight?: number;
  dimensions?: { length: number; width: number; height: number };
  tags: string[];
  attributes: Record<string, any>;
  status: 'active' | 'inactive' | 'discontinued' | 'draft';
  images: string[];
  createdAt: string;
  updatedAt: string;
}

export function createProductFixture(overrides: Partial<ProductFixture> = {}): ProductFixture {
  const name = faker.commerce.productName();
  
  return {
    id: faker.string.uuid(),
    sku: faker.string.alphanumeric({ length: 12 }).toUpperCase(),
    name,
    description: faker.commerce.productDescription(),
    category: faker.commerce.department(),
    subcategory: faker.commerce.department(),
    price: parseFloat(faker.commerce.price({ min: 10, max: 1000 })),
    cost: parseFloat(faker.commerce.price({ min: 1, max: 500 })),
    currency: 'USD',
    taxRate: parseFloat(faker.number.float({ min: 0, max: 0.2, fractionDigits: 2 }).toFixed(2)),
    unit: faker.helpers.arrayElement(['pcs', 'kg', 'm', 'l', 'box', 'pack']),
    weight: faker.number.float({ min: 0.1, max: 50, fractionDigits: 2 }),
    dimensions: {
      length: faker.number.int({ min: 10, max: 200 }),
      width: faker.number.int({ min: 10, max: 100 }),
      height: faker.number.int({ min: 5, max: 50 }),
    },
    tags: faker.helpers.arrayElements(['featured', 'sale', 'new', 'popular', 'eco-friendly'], { min: 0, max: 3 }),
    attributes: {
      color: faker.color.human(),
      material: faker.helpers.arrayElement(['plastic', 'metal', 'wood', 'glass', 'fabric']),
      warranty: faker.helpers.arrayElement(['1 year', '2 years', 'lifetime', 'none']),
    },
    status: faker.helpers.arrayElement(['active', 'inactive', 'discontinued', 'draft']),
    images: Array.from({ length: faker.number.int({ min: 1, max: 5 }) }, () => faker.image.url()),
    createdAt: faker.date.past({ years: 2 }).toISOString(),
    updatedAt: faker.date.recent({ days: 30 }).toISOString(),
    ...overrides,
  };
}

// --- Order/Transaction Fixtures ---

export interface OrderFixture {
  id: string;
  orderNumber: string;
  customerId: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  items: Array<{
    productId: string;
    productName: string;
    sku: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    discount?: number;
  }>;
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
  currency: string;
  shippingAddress: {
    name: string;
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
    phone: string;
  };
  billingAddress: {
    name: string;
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
  paymentMethod: 'credit_card' | 'debit_card' | 'bank_transfer' | 'paypal' | 'cash_on_delivery';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  notes?: string;
  createdAt: string;
  updatedAt: string;
  shippedAt?: string;
  deliveredAt?: string;
}

export function createOrderFixture(overrides: Partial<OrderFixture> = {}): OrderFixture {
  const itemCount = faker.number.int({ min: 1, max: 5 });
  const items = Array.from({ length: itemCount }, () => {
    const quantity = faker.number.int({ min: 1, max: 10 });
    const unitPrice = parseFloat(faker.commerce.price({ min: 10, max: 500 }));
    return {
      productId: faker.string.uuid(),
      productName: faker.commerce.productName(),
      sku: faker.string.alphanumeric({ length: 12 }).toUpperCase(),
      quantity,
      unitPrice,
      totalPrice: quantity * unitPrice,
      discount: faker.number.float({ min: 0, max: 0.2, fractionDigits: 2 }),
    };
  });

  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const discount = subtotal * (items[0]?.discount || 0);
  const tax = (subtotal - discount) * 0.1;
  const shipping = faker.number.float({ min: 0, max: 50, fractionDigits: 2 });
  const total = subtotal - discount + tax + shipping;

  return {
    id: faker.string.uuid(),
    orderNumber: `ORD-${faker.string.alphanumeric({ length: 8 }).toUpperCase()}`,
    customerId: faker.string.uuid(),
    status: faker.helpers.arrayElement(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']),
    items,
    subtotal,
    tax,
    shipping,
    discount,
    total,
    currency: 'USD',
    shippingAddress: {
      name: faker.person.fullName(),
      street: faker.location.streetAddress(),
      city: faker.location.city(),
      state: faker.location.state(),
      country: faker.location.country(),
      postalCode: faker.location.zipCode(),
      phone: faker.phone.number(),
    },
    billingAddress: {
      name: faker.person.fullName(),
      street: faker.location.streetAddress(),
      city: faker.location.city(),
      state: faker.location.state(),
      country: faker.location.country(),
      postalCode: faker.location.zipCode(),
    },
    paymentMethod: faker.helpers.arrayElement(['credit_card', 'debit_card', 'bank_transfer', 'paypal', 'cash_on_delivery']),
    paymentStatus: faker.helpers.arrayElement(['pending', 'paid', 'failed', 'refunded']),
    notes: faker.lorem.sentence(),
    createdAt: faker.date.past({ days: 30 }).toISOString(),
    updatedAt: faker.date.recent({ days: 7 }).toISOString(),
    ...overrides,
  };
}

// --- Employee/HR Fixtures ---

export interface EmployeeFixture {
  id: string;
  employeeId: string;
  userId: string;
  companyId: string;
  branchId?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  managerId?: string;
  hireDate: string;
  terminationDate?: string;
  status: 'active' | 'inactive' | 'on_leave' | 'terminated';
  employmentType: 'full_time' | 'part_time' | 'contractor' | 'intern';
  salary: {
    amount: number;
    currency: string;
    frequency: 'hourly' | 'monthly' | 'annual';
  };
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  bankDetails?: {
    bankName: string;
    accountNumber: string;
    routingNumber: string;
  };
  createdAt: string;
  updatedAt: string;
}

export function createEmployeeFixture(overrides: Partial<EmployeeFixture> = {}): EmployeeFixture {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  
  return {
    id: faker.string.uuid(),
    employeeId: `EMP-${faker.string.alphanumeric({ length: 6 }).toUpperCase()}`,
    userId: faker.string.uuid(),
    companyId: faker.string.uuid(),
    branchId: faker.string.uuid(),
    firstName,
    lastName,
    email: faker.internet.email({ firstName, lastName }).toLowerCase(),
    phone: faker.phone.number(),
    position: faker.person.jobTitle(),
    department: faker.helpers.arrayElement(['Engineering', 'Sales', 'Marketing', 'HR', 'Finance', 'Operations']),
    managerId: faker.string.uuid(),
    hireDate: faker.date.past({ years: 5 }).toISOString().split('T')[0],
    terminationDate: undefined,
    status: faker.helpers.arrayElement(['active', 'inactive', 'on_leave', 'terminated']),
    employmentType: faker.helpers.arrayElement(['full_time', 'part_time', 'contractor', 'intern']),
    salary: {
      amount: faker.number.int({ min: 30000, max: 200000 }),
      currency: 'USD',
      frequency: faker.helpers.arrayElement(['hourly', 'monthly', 'annual']),
    },
    address: {
      street: faker.location.streetAddress(),
      city: faker.location.city(),
      state: faker.location.state(),
      country: faker.location.country(),
      postalCode: faker.location.zipCode(),
    },
    emergencyContact: {
      name: faker.person.fullName(),
      relationship: faker.helpers.arrayElement(['spouse', 'parent', 'sibling', 'friend']),
      phone: faker.phone.number(),
    },
    bankDetails: {
      bankName: faker.finance.bankName(),
      accountNumber: faker.finance.accountNumber(),
      routingNumber: faker.finance.routingNumber(),
    },
    createdAt: faker.date.past({ years: 2 }).toISOString(),
    updatedAt: faker.date.recent({ days: 30 }).toISOString(),
    ...overrides,
  };
}

// --- Collection Fixtures ---

export function createMultipleFixtures<T>(
  factory: (overrides?: any) => T,
  count: number,
  overrides?: any
): T[] {
  return Array.from({ length: count }, (_, i) => factory({ ...overrides, index: i }));
}

export function createPaginatedFixture<T>(
  factory: (overrides?: any) => T,
  totalCount: number,
  page: number,
  pageSize: number,
  overrides?: any
): { data: T[]; pagination: { page: number; pageSize: number; totalCount: number; totalPages: number } } {
  const start = (page - 1) * pageSize;
  const end = Math.min(start + pageSize, totalCount);
  const data = Array.from({ length: end - start }, (_, i) => factory({ ...overrides, index: start + i }));
  
  return {
    data,
    pagination: {
      page,
      pageSize,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
    },
  };
}