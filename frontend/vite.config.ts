import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import figlet from 'figlet'
import path from 'path'
import { visualizer } from 'rollup-plugin-visualizer'
import { defineConfig, loadEnv } from 'vite'
import type { Plugin } from 'vite'

const mockApiPlugin = (): Plugin => ({
  name: 'mock-api',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

      if (req.method === 'OPTIONS') {
        res.statusCode = 200
        res.end()
        return
      }

      if (req.url?.includes('/api/v1/org/companies')) {
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify([{ id: 1, name: 'Yafei Health Corp (Mock)' }]))
        return
      }
      if (req.url?.includes('/api/v1/org/business-units') || req.url?.includes('/api/v1/org/branches')) {
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify([{ id: 1, name: 'Main HQ (Mock)' }]))
        return
      }
      next()
    })
  },
})

const zenosBannerPlugin = (): Plugin => ({
  name: 'zenos-banner',
  configureServer(server) {
    server.httpServer?.once('listening', () => {
      try {
        const art = figlet.textSync('ZenOS', { font: 'ANSI Shadow' })
        const banner = `\x1b[36m\n${art}\n :: ZenOS Modular Frontend ::\n [ React 19 • Vite 7 • Tailwind v4 • HeroUI ]\x1b[0m\n`
        console.log(banner)
      } catch {
        console.log('ZenOS Frontend started')
      }
    })
  },
})

export default defineConfig(({ mode }) => {
  const env = {
    ...loadEnv(mode, __dirname, ''),
    ...loadEnv(mode, process.cwd(), ''),
  }

  const appEnv = env.VITE_APP_ENV
  if (!appEnv) {
    throw new Error(
      `[vite] VITE_APP_ENV is not set for mode "${mode}".\n` +
        `  Every .env* path is gitignored, so a fresh clone has none of them.\n` +
        `  Run "pnpm env:init" (or "make env-init") to materialise them from\n` +
        `  .env.example and docker/env/${mode}.env.`
    )
  }
  if (mode === 'production' && appEnv !== 'production') {
    throw new Error(
      `[vite] Production build resolved VITE_APP_ENV="${appEnv}". ` +
        `Refusing to ship the "${appEnv}" profile to production.`
    )
  }
  const KNOWN_PROFILES = ['development', 'production', 'staging', 'testing']
  if (!KNOWN_PROFILES.includes(appEnv)) {
    throw new Error(
      `[vite] VITE_APP_ENV="${appEnv}" is not a known axios profile. ` +
        `Expected one of: ${KNOWN_PROFILES.join(', ')}.\n` +
        `  Note the Vite mode is "test" but the axios profile is "testing"; ` +
        `scripts/build_app.js maps between them. An unknown name silently ` +
        `falls back to the development profile.`
    )
  }

  return {
    plugins: [
      react(),
      zenosBannerPlugin(),
      mockApiPlugin(),
      tailwindcss(),
      visualizer({
        open: false,
        filename: 'stats.html',
        gzipSize: true,
        brotliSize: true,
      }),
    ],

    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
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
        // Core package aliases (also in vitest.config.base.ts for tests)
        '@form-core': path.resolve(__dirname, 'src/core/form-core'),
        '@form-core/testing': path.resolve(__dirname, 'src/core/form-core/test-utils'),
        '@table-core': path.resolve(__dirname, 'src/core/table-core'),
        '@table-core/testing': path.resolve(__dirname, 'src/core/table-core/test-utils'),
        '@form-ui': path.resolve(__dirname, 'src/shared/ui/form/components'),
        '@table-ui': path.resolve(__dirname, 'src/shared/ui/table/ui'),
        '@form-hooks': path.resolve(__dirname, 'src/shared/ui/form/hooks'),
        '@table-hooks': path.resolve(__dirname, 'src/shared/ui/table/hooks'),
      },
    },

    envPrefix: ['VITE_', 'API_'],

    server: {
      host: true,
      port: 8090,
      proxy: {
        '/api': {
          target: env.VITE_API_URL || env.API_URL,
          changeOrigin: true,
          secure: false,
        },
      },
    },

    define: {
      __APP_NAME__: JSON.stringify(env.APP_NAME),
      __APP_VERSION__: JSON.stringify(env.APP_VERSION),
      __API_URL__: JSON.stringify(env.VITE_API_URL || env.API_URL),
    },

    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            // 1. PDF Generation & Processing Engine
            if (
              id.includes('node_modules/@react-pdf') ||
              id.includes('node_modules/pdfjs-dist') ||
              id.includes('node_modules/yoga-layout') ||
              id.includes('node_modules/fontkit') ||
              id.includes('node_modules/restructure') ||
              id.includes('node_modules/unicode-properties') ||
              id.includes('node_modules/png-js')
            ) {
              return 'pdf-engine';
            }

            // 2. Form Builder Subsystem (Editor Panels & Canvas)
            if (
              id.includes('/src/features/form-builder/') ||
              id.includes('/src/shared/ui/form/builder/')
            ) {
              return 'form-builder';
            }

            // 3. React Core Ecosystem
            if (
              id.includes('node_modules/react/') ||
              id.includes('node_modules/react-dom/') ||
              id.includes('node_modules/react-router/') ||
              id.includes('node_modules/react-router-dom/')
            ) {
              return 'react-vendor';
            }

            // 4. HeroUI & React Aria UI Primitives
            if (
              id.includes('node_modules/@heroui/') ||
              id.includes('node_modules/@react-aria/') ||
              id.includes('node_modules/react-aria/') ||
              id.includes('node_modules/react-aria-components/')
            ) {
              return 'heroui-vendor';
            }

            // 5. TanStack Data Tables & Async Queries
            if (
              id.includes('node_modules/@tanstack/react-table') ||
              id.includes('node_modules/@tanstack/react-query') ||
              id.includes('node_modules/@tanstack/query-core')
            ) {
              return 'table-vendor';
            }

            // 6. Animation Engine
            if (
              id.includes('node_modules/framer-motion') ||
              id.includes('node_modules/motion-dom')
            ) {
              return 'motion-vendor';
            }

            // 7. Lucide Icons
            if (id.includes('node_modules/lucide-react')) {
              return 'icons-vendor';
            }
          },
        },
      },
    },
  }
})