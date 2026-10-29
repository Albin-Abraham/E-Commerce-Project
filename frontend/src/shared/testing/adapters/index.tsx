/**
 * Adapters - Testing Adapters
 * 
 * Provides adapters for integrating with different testing libraries and frameworks.
 */

import { render } from '@testing-library/react';
import type { RenderOptions, RenderResult } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import type { InitialEntry } from 'react-router-dom';
import React from 'react';

// --- RTL Adapter ---

export interface RTLAdapterOptions extends Omit<RenderOptions, 'wrapper'> {
  route?: string;
  routerOptions?: {
    initialEntries?: InitialEntry[];
    initialIndex?: number;
    basename?: string;
  };
  queryClientOptions?: ConstructorParameters<typeof QueryClient>[0];
  providers?: React.ComponentType<{ children: React.ReactNode }>;
}

export interface RTLAdapterResult extends RenderResult {
  queryClient: QueryClient;
  router: ReturnType<typeof createMemoryRouter>;
}

export function createRTLAdapter() {
  return {
    render: (ui: React.ReactElement, options: RTLAdapterOptions = {}): RTLAdapterResult => {
      const {
        route,
        routerOptions,
        queryClientOptions,
        providers,
        ...renderOptions
      } = options;

      const queryClient = new QueryClient({
        ...queryClientOptions,
        defaultOptions: {
          ...queryClientOptions?.defaultOptions,
          queries: {
            retry: false,
            ...queryClientOptions?.defaultOptions?.queries,
          },
        },
      });

      const router = createMemoryRouter(
        [{ path: '*', element: ui }],
        {
          initialEntries: routerOptions?.initialEntries ?? [route ?? '/'],
          initialIndex: routerOptions?.initialIndex,
          basename: routerOptions?.basename,
        }
      );

      const AdditionalProviders = providers;

      const wrapper = (
        <QueryClientProvider client={queryClient}>
          {AdditionalProviders ? (
            <AdditionalProviders>
              <RouterProvider router={router} />
            </AdditionalProviders>
          ) : (
            <RouterProvider router={router} />
          )}
        </QueryClientProvider>
      );

      const result = render(wrapper, renderOptions);
      
      return {
        ...result,
        queryClient,
        router,
      };
    },

    renderWithProviders: (ui: React.ReactElement, options: RTLAdapterOptions = {}) => {
      return createRTLAdapter().render(ui, options);
    },
  };
}

export const rtlAdapter = createRTLAdapter();

// --- Vitest Adapter ---

export interface VitestAdapterConfig {
  globals?: boolean;
  environment?: 'jsdom' | 'node' | 'happy-dom';
  setupFiles?: string[];
  include?: string[];
  exclude?: string[];
  testTimeout?: number;
  hookTimeout?: number;
  pool?: 'forks' | 'threads' | 'vmForks' | 'vmThreads';
  poolOptions?: {
    forks?: { singleFork?: boolean; maxForks?: number; minForks?: number };
    threads?: { singleThread?: boolean; maxThreads?: number; minThreads?: number };
  };
  coverage?: {
    enabled?: boolean;
    provider?: 'v8' | 'istanbul';
    reporter?: string[];
    thresholds?: {
      lines?: number;
      functions?: number;
      branches?: number;
      statements?: number;
    };
  };
}

export function createVitestAdapter(config: VitestAdapterConfig = {}) {
  const defaultConfig: VitestAdapterConfig = {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: ['**/e2e/**', '**/*.spec.ts'],
    testTimeout: 30000,
    hookTimeout: 30000,
    pool: 'forks',
    poolOptions: {
      forks: { singleFork: true, maxForks: 2, minForks: 1 },
    },
    coverage: {
      enabled: true,
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      thresholds: { lines: 80, functions: 80, branches: 70, statements: 80 },
    },
    ...config,
  };

  return {
    getConfig: () => defaultConfig,
    merge: (overrides: Partial<VitestAdapterConfig>) => createVitestAdapter({ ...defaultConfig, ...overrides }),
  };
}

// --- Playwright Adapter ---

export interface PlaywrightAdapterConfig {
  testDir?: string;
  timeout?: number;
  expect?: { timeout?: number };
  fullyParallel?: boolean;
  workers?: number;
  forbidOnly?: boolean;
  retries?: number;
  reporter?: any[];
  use?: {
    baseURL?: string;
    storageState?: string;
    trace?: 'on' | 'off' | 'on-first-retry' | 'retain-on-failure';
    screenshot?: 'on' | 'off' | 'only-on-failure';
    video?: 'on' | 'off' | 'retain-on-failure';
  };
  projects?: Array<{ name: string; use: any }>;
  webServer?: {
    command: string;
    url: string;
    reuseExistingServer?: boolean;
    timeout?: number;
  };
}

export function createPlaywrightAdapter(config: PlaywrightAdapterConfig = {}) {
  const defaultConfig: PlaywrightAdapterConfig = {
    testDir: './e2e',
    timeout: 30000,
    expect: { timeout: 5000 },
    fullyParallel: true,
    workers: 1,
    forbidOnly: true,
    retries: 2,
    reporter: [
      ['list'],
      ['html', { outputFolder: './test-results/e2e/html', open: 'never' }],
      ['json', { outputFile: './test-results/e2e/report.json' }],
    ],
    use: {
      baseURL: process.env.PLAYWRIGHT_BASE_URL,
      storageState: './e2e/auth/state.json',
      trace: 'on-first-retry',
      screenshot: 'only-on-failure',
      video: 'retain-on-failure',
    },
    projects: [
      { name: 'chromium', use: { ...require('@playwright/test').devices['Desktop Chrome'] } },
      { name: 'firefox', use: { ...require('@playwright/test').devices['Desktop Firefox'] } },
      { name: 'webkit', use: { ...require('@playwright/test').devices['Desktop Safari'] } },
      { name: 'mobile-chrome', use: { ...require('@playwright/test').devices['Pixel 5'] } },
      { name: 'mobile-safari', use: { ...require('@playwright/test').devices['iPhone 12'] } },
    ],
    webServer: {
      command: process.env.CI ? 'npm run preview' : 'npm run dev -- --port 4173',
      url: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:4173',
      reuseExistingServer: true,
      timeout: 120000,
    },
    ...config,
  };

  return {
    getConfig: () => defaultConfig,
    merge: (overrides: Partial<PlaywrightAdapterConfig>) => createPlaywrightAdapter({ ...defaultConfig, ...overrides }),
  };
}

// --- MSW Adapter ---

export interface MSWAdapterConfig {
  baseUrl?: string;
  handlers?: any[];
  onUnhandledRequest?: 'bypass' | 'warn' | 'error';
}

export function createMSWAdapter(config: MSWAdapterConfig = {}) {
  const { setupServer } = require('msw/node');
  const { http, HttpResponse } = require('msw');

  const server = setupServer(...(config.handlers || []), {
    onUnhandledRequest: config.onUnhandledRequest || 'error',
  });

  return {
    server,
    http,
    HttpResponse,
    
    start: (options?: { onUnhandledRequest?: 'bypass' | 'warn' | 'error' }) => {
      server.listen({ onUnhandledRequest: options?.onUnhandledRequest || 'error' });
    },
    
    stop: () => server.close(),
    
    reset: () => server.resetHandlers(),
    
    use: (...handlers: any[]) => server.use(...handlers),
    
    restore: () => server.restoreHandlers(),
    
    // Helper methods
    mockGet: (url: string | RegExp, response: any, options: { status?: number; headers?: Record<string, string>; delay?: number } = {}) => {
      server.use(http.get(url, () => HttpResponse.json(response.body, { status: response.status || 200, headers: options.headers })));
    },
    
    mockPost: (url: string | RegExp, response: any, options: { status?: number; headers?: Record<string, string>; delay?: number } = {}) => {
      server.use(http.post(url, () => HttpResponse.json(response.body, { status: response.status || 200, headers: options.headers })));
    },
    
    mockPaginated: (url: string | RegExp, items: any[], pageSize = 10) => {
      server.use(http.get(url, ({ request }: any) => {
        const url = new URL(request.url);
        const page = parseInt(url.searchParams.get('page') || '1') - 1;
        const size = parseInt(url.searchParams.get('pageSize') || String(pageSize));
        const start = page * size;
        const end = start + size;
        return HttpResponse.json({ data: items.slice(start, end), pagination: { page: page + 1, pageSize: size, totalCount: items.length } });
      }));
    },
    
    mockEntityCrud: <T extends { id: string }>(_baseUrl: string, initialEntities: T[] = []) => {
      const entities = new Map<string, T>();
      initialEntities.forEach(e => entities.set(e.id, e));
      
      return {
        getEntities: () => Array.from(entities.values()),
        reset: () => { entities.clear(); initialEntities.forEach(e => entities.set(e.id, e)); },
      };
    },
  };
}

// --- Test Environment Adapter ---

export interface TestEnvironmentAdapter {
  setup: () => void | Promise<void>;
  teardown: () => void | Promise<void>;
  beforeEach: (context: any) => void | Promise<void>;
  afterEach: (context: any) => void | Promise<void>;
  beforeAll: () => void | Promise<void>;
  afterAll: () => void | Promise<void>;
}

export function createTestEnvironmentAdapter(): TestEnvironmentAdapter {
  let interceptedFetch: typeof globalThis.fetch;
  const { server } = require('../../msw/server');
  const { setupTestIsolation, teardownTestIsolation, setupTestNetworkIsolation, teardownTestNetworkIsolation, createTestContext } = require('../../infrastructure/isolation');
  const { setCurrentTestContext } = require('../../test-context');
  const { getVitestFailureReporter } = require('../../reporting');
  const { cleanup } = require('@testing-library/react');
  const { setupAccessibilityMatchers } = require('../../capabilities/assertions/impl/accessibility');

  const vitestFailureReporter = getVitestFailureReporter();

  return {
    async setup() {
      server.listen({ onUnhandledRequest: 'error' });
      interceptedFetch = globalThis.fetch;
      setupAccessibilityMatchers();
    },

    async teardown() {
      server.close();
      if (globalThis.fetch !== interceptedFetch) {
        globalThis.fetch = interceptedFetch;
      }
    },

    async beforeEach(context: any) {
      const testId = `test-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const testName = context.task?.name || 'unknown-test';
      
      const testContext = createTestContext(testId, testName, 'component', 'full');
      setCurrentTestContext(testContext);
      
      await setupTestIsolation(testContext);
      await setupTestNetworkIsolation(testContext);
    },

    async afterEach(context: any) {
      if (context.task?.result?.state === 'fail' && context.task?.result?.error) {
        vitestFailureReporter.onTestFailed(context.task, context.task.result.error);
      }
      
      const testContext = { testId: '', testName: '', profile: '', isolationLevel: 'full' as const, sharedResources: new Map(), cleanupFns: [] };
      await teardownTestNetworkIsolation(testContext);
      await teardownTestIsolation(testContext);
      setCurrentTestContext(null);
      
      cleanup();
      server.resetHandlers();
      
      if (globalThis.fetch !== interceptedFetch) {
        globalThis.fetch = interceptedFetch;
      }
    },

    async beforeAll() {
      // Global setup if needed
    },

    async afterAll() {
      // Global teardown if needed
    },
  };
}

// --- Adapter Registry ---

export const adapters = {
  rtl: createRTLAdapter(),
  vitest: createVitestAdapter(),
  playwright: createPlaywrightAdapter(),
  msw: createMSWAdapter(),
  testEnvironment: createTestEnvironmentAdapter(),
} as const;

export type AdapterRegistry = typeof adapters;