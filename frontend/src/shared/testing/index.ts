/**
 * Shared Testing Capabilities Layer
 * 
 * This is the main entry point for all testing capabilities.
 * Provides a unified API for testing across all layers.
 */

// Capabilities
export * from './capabilities/queries';
export * from './capabilities/interactions';
export * from './capabilities/assertions';
export * from './capabilities/async';
export * from './capabilities/diagnostics';

// Drivers
export * from './drivers/base';
export * from './drivers/form';
export * from './drivers/table';
export * from './drivers/navigation';
export * from './drivers/api';

// Fixtures & Factories
export * from './fixtures';
export * from './factories';

// Matchers & Assertions
export * from './matchers';

// Adapters
export * from './adapters';

// Test Context
export { setCurrentTestContext, getCurrentTestContext } from './test-context';

// Re-export commonly used testing utilities
export { renderWithProviders } from './test-utils';
export { createTestContext, type TestContext } from './infrastructure/isolation';
export { server } from './msw/server';