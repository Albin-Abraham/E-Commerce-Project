import { defineConfig } from 'vitest/config'
import base from './vitest.config.base'

export default defineConfig({
  ...base,
  test: {
    ...base.test,
    projects: [
      './projects/unit/vitest.config.ts',
      './projects/form-core/vitest.config.ts',
      './projects/table-core/vitest.config.ts',
      './projects/component/vitest.config.ts',
      './projects/integration/vitest.config.ts',
      './projects/mdap/vitest.config.ts',
      './projects/shared-testing/vitest.config.ts',
    ],
  },
})
