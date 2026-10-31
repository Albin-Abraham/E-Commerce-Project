import { defineConfig } from 'vitest/config'
import base from '../../vitest.config.base'

export default defineConfig({
  ...base,
  test: {
    ...base.test,
    name: 'unit',
    include: [
      'src/platform/**/*.test.ts',
      'src/core/**/*.test.ts',
      'src/shared/hooks/**/*.test.ts',
      'src/shared/utils/**/*.test.ts',
      'src/shared/auth/**/*.test.ts',
      'src/shared/apps/**/*.test.ts',
      'src/features/**/*.test.ts',
      'architecture/**/*.test.ts',
      'src/shared/ui/form/utils/**/*.test.ts',
      'src/shared/ui/table/utils/**/*.test.ts',
    ],
    pool: 'forks',
    poolOptions: { forks: { singleFork: true, maxForks: 4, minForks: 1 } },
    testTimeout: 5000,
    hookTimeout: 5000,
    coverage: {
      ...base.test.coverage,
      enabled: true,
      thresholds: { lines: 10, functions: 40, branches: 40, statements: 10 },
    },
  },
})