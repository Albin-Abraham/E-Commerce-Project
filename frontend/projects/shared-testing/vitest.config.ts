import { defineConfig } from 'vitest/config'
import base from '../../vitest.config.base'

export default defineConfig({
  ...base,
  test: {
    ...base.test,
    name: 'shared-testing',
    include: [
      'src/shared/testing/infrastructure/**/*.test.ts',
      'src/shared/testing/drivers/**/*.test.tsx',
      'src/shared/testing/__tests__/test-infrastructure.test.tsx',
      'src/shared/testing/__tests__/failure-classification.test.ts',
      'src/shared/testing/__tests__/ProgrammaticHooks.test.tsx',
      'src/shared/testing/__tests__/StyleSystem.test.tsx',
      'src/shared/testing/__tests__/Debug.test.tsx',
    ],
    pool: 'forks',
    poolOptions: { forks: { singleFork: true, maxForks: 2, minForks: 1 } },
    testTimeout: 30000,
    hookTimeout: 30000,
    coverage: {
      ...base.test.coverage,
      enabled: false,
    },
  },
})