import { defineConfig, loadEnv } from 'vite'
import type { PluginOption } from 'vite'
import vue from '@vitejs/plugin-vue'
// load @tailwindcss/vite dynamically to avoid CJS/ESM require() issues when Vite
// loads the config via a CJS runtime. We'll import it inside the config factory.

import { fileURLToPath, URL } from 'node:url'
import { viteElectronDev } from './plugins/vite.electron.dev'
import { viteElectronBuild } from './plugins/vite.electron.build'

import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers'

export default defineConfig(async ({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const isWebOnlyBuild = mode === 'web' || env.NSMUSICS_WEB_ONLY_BUILD === '1'
  // dynamically import tailwind plugin (handles ESM-only packages)
  const _tailwind = await import('@tailwindcss/vite')
  const tailwindcss = _tailwind && ('default' in _tailwind ? _tailwind.default : _tailwind)

  const plugins = [
    vue({ template: { compilerOptions: { hoistStatic: false } } }),
    !isWebOnlyBuild ? viteElectronDev() : null,
    !isWebOnlyBuild ? viteElectronBuild() : null,
    AutoImport({
      imports: [
        'vue',
        {
          'naive-ui': ['useDialog', 'useMessage', 'useNotification', 'useLoadingBar'],
        },
      ],
    }),
    Components({
      resolvers: [NaiveUiResolver()],
    }),
    tailwindcss(),
  ].filter(Boolean) as PluginOption[]

  return {
    plugins,
    base: './',
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      proxy: {
        '/api': {
          target: env.BACKEND_SERVICE || 'http://localhost:8082',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
  }
})
