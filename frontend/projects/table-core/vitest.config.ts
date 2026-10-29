import { defineConfig } from 'vitest/config'
import base from '../../vitest.config.base'

export default defineConfig({
  ...base,
  test: {
    ...base.test,
    name: 'table-core',
    include: [
      'src/core/table-core/**/*.test.ts',
      'src/core/table-core/**/*.test.tsx',
      'src/core/table-core/modules/**/*.test.ts',
      'src/core/table-core/modules/**/*.test.tsx',
      'src/shared/ui/table/plugins/**/*.test.ts',
      'src/shared/ui/table/plugins/**/*.test.tsx',
      'src/shared/ui/table/hooks/**/*.test.ts',
      'src/shared/ui/table/hooks/**/*.test.tsx',
      'src/shared/ui/table/hooks/data/**/*.test.ts',
      'src/shared/ui/table/hooks/data/**/*.test.tsx',
      'src/shared/ui/table/meta/**/*.test.ts',
      'src/shared/ui/table/url/**/*.test.ts',
      'src/shared/ui/table/url/categories/**/*.test.ts',
      'src/shared/ui/table/url/categories/**/*.test.ts',
      'src/shared/ui/table/url/parser/**/*.test.ts',
      'src/shared/ui/table/utils/__tests__/*.test.ts',
      'src/shared/ui/table/utils/__tests__/*.test.tsx',
      'src/shared/testing/__tests__/ZenithTable.core.test.tsx',
      'src/shared/testing/__tests__/ZenithTable.edgecases.test.tsx',
      'src/shared/testing/__tests__/ZenithTable.regression.test.tsx',
      'src/shared/testing/__tests__/ZenithTable.url.test.tsx',
    ],
    pool: 'forks',
    poolOptions: { forks: { singleFork: true, maxForks: 2, minForks: 1 } },
    testTimeout: 30000,
    hookTimeout: 30000,
    coverage: {
      ...base.test.coverage,
      enabled: true,
      thresholds: { lines: 15, functions: 35, branches: 45, statements: 15 },
    },
  },
})