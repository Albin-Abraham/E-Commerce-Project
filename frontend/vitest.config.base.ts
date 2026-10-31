import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { getVitestFailureReporter } from './src/shared/testing/reporting'

export default defineConfig({
  root: path.resolve(__dirname),
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@platform': path.resolve(__dirname, 'src/platform'),
      '@core': path.resolve(__dirname, 'src/core'),
      '@shared': path.resolve(__dirname, 'src/shared'),
      '@shell': path.resolve(__dirname, 'src/shell'),
      '@features': path.resolve(__dirname, 'src/features'),
      '@ui': path.resolve(__dirname, 'src/shared/ui'),
      '@components': path.resolve(__dirname, 'src/shared/ui'),
      '@hooks': path.resolve(__dirname, 'src/shared/hooks'),
      '@utils': path.resolve(__dirname, 'src/shared/utils'),
      '@constants': path.resolve(__dirname, 'src/shared/constants'),
      '@assets': path.resolve(__dirname, 'src/shared/assets'),
      '@styles': path.resolve(__dirname, 'src/shared/styles'),
      '@testing': path.resolve(__dirname, 'src/shared/testing'),
      '@libs': path.resolve(__dirname, 'src/core/libs'),
      '@contexts': path.resolve(__dirname, 'src/core/contexts'),
      '@configs': path.resolve(__dirname, 'src/core/configs'),
      '@debug': path.resolve(__dirname, 'src/core/debug'),
      '@i18n': path.resolve(__dirname, 'src/core/i18n'),
      '@services': path.resolve(__dirname, 'src/core/services'),
      '@stores': path.resolve(__dirname, 'src/core/state'),
      '@pages': path.resolve(__dirname, 'src/shell/pages'),
      // NEW: Core package aliases
      '@form-core': path.resolve(__dirname, 'src/core/form-core'),
      '@form-core/testing': path.resolve(__dirname, 'src/core/form-core/test-utils'),
      '@table-core': path.resolve(__dirname, 'src/core/table-core'),
      '@table-core/testing': path.resolve(__dirname, 'src/core/table-core/test-utils'),
      // Component aliases
      '@form-ui': path.resolve(__dirname, 'src/shared/ui/form/components'),
      '@table-ui': path.resolve(__dirname, 'src/shared/ui/table/ui'),
      '@form-hooks': path.resolve(__dirname, 'src/shared/ui/form/hooks'),
      '@table-hooks': path.resolve(__dirname, 'src/shared/ui/table/hooks'),
    },
  },
  test: {
    root: path.resolve(__dirname),
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    reporters: [
      'default',
      getVitestFailureReporter(),
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/**/*.stories.{ts,tsx}',
        'src/**/__tests__/**',
        'src/shared/testing/**',
        'src/shared/ui/form/tests/**',
      ],
    },
    isolate: true,
    fileParallelism: true,
    logHeapUsage: true,
  },
})