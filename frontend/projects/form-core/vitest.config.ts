import { defineConfig } from 'vitest/config'
import base from '../../vitest.config.base'

export default defineConfig({
  ...base,
  test: {
    ...base.test,
    name: 'form-core',
    include: [
      'src/core/form-core/**/*.test.ts',
      'src/core/form-core/**/*.test.tsx',
      'src/core/form-core/modules/**/*.test.ts',
      'src/shared/ui/form/hooks/__tests__/*.test.ts',
      'src/shared/ui/form/types/__tests__/*.test.ts',
      'src/shared/ui/form/layout/__tests__/*.test.tsx',
      'src/shared/ui/form/tests/formContract.test.tsx',
      'src/shared/ui/form/tests/schema-normalizer.test.ts',
      'src/shared/ui/form/tests/primitive-migration-guard.test.ts',
      'src/shared/ui/form/tests/engine-performance.test.ts',
      'src/shared/ui/form/tests/proxy-benchmark.test.ts',
      'src/shared/ui/form/tests/withViewModelAndSlots.test.tsx',
    ],
    pool: 'forks',
    poolOptions: { forks: { singleFork: true, maxForks: 2, minForks: 1 } },
    testTimeout: 30000,
    hookTimeout: 30000,
    coverage: {
      ...base.test.coverage,
      enabled: true,
      include: ['src/core/form-core/**/*.{ts,tsx}'],
      exclude: [
        'src/core/form-core/**/*.test.{ts,tsx}',
        'src/core/form-core/__tests__/**',
        'src/core/form-core/test-utils.ts',
      ],
      thresholds: {
        lines: 70,
        functions: 60,
        branches: 70,
        statements: 70,
      },
    },
  },
})