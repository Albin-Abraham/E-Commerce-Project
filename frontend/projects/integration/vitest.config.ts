import { defineConfig } from 'vitest/config'
import base from '../../vitest.config.base'

export default defineConfig({
  ...base,
  test: {
    ...base.test,
    name: 'integration',
    include: [
      'src/features/**/*.test.tsx',
      'src/shell/boot/**/*.test.tsx',
      'src/core/router/hooks/**/*.test.tsx',
      'src/core/router/adapters/**/*.test.ts',
      'src/core/router/helpers/**/*.test.tsx',
      'src/core/router/utils/**/*.test.ts',
      'src/core/http/__tests__/*.test.ts',
      'src/shared/testing/__tests__/FormDevTools.test.tsx',
      'src/shared/testing/__tests__/Debug.test.tsx',
    ],
    setupFiles: ['./vitest.setup.ts'],
    pool: 'forks',
    poolOptions: { forks: { singleFork: true, maxForks: 2, minForks: 1 } },
    testTimeout: 60000,
    hookTimeout: 60000,
    coverage: {
      ...base.test.coverage,
      enabled: true,
      thresholds: { lines: 25, functions: 25, branches: 20, statements: 25 },
    },
  },
})