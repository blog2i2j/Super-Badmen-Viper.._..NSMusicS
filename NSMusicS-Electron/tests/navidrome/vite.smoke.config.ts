import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('../../src', import.meta.url)),
      'naive-ui': fileURLToPath(new URL('./naive-ui.stub.ts', import.meta.url)),
    },
  },
})
