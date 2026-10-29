import { defineConfig } from 'vitest/config'
import base from '../../vitest.config.base'

export default defineConfig({
  ...base,
  test: {
    ...base.test,
    name: 'mdap',
    include: [
      'src/shared/ui/form/tests/mdap/**/*.test.ts',
      'src/shared/ui/form/tests/mdap/**/*.test.tsx',
      'src/shared/ui/table/mdap/**/*.test.ts',
      'src/shared/testing/__tests__/production-schemas.test.ts',
    ],
    pool: 'forks',
    poolOptions: { forks: { singleFork: true, maxForks: 2, minForks: 1 } },
    testTimeout: 30000,
    hookTimeout: 30000,
    coverage: {
      ...base.test.coverage,
      enabled: true,
      thresholds: { lines: 35, functions: 35, branches: 30, statements: 35 },
    },
  },
})