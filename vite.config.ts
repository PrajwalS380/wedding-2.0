/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Website 2.0 runs on its own ports so it never collides with Website 1.0 (5173).
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5174,
    strictPort: true,
  },
  preview: {
    port: 4180,
    strictPort: true,
  },
  build: {
    target: 'es2022',
    assetsInlineLimit: 2048,
    // three.js is only loaded with the intro scene (a lazy chunk), never by the main page
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (/node_modules\/(react|react-dom|scheduler)\//.test(id)) return 'react'
          if (/node_modules\/gsap\//.test(id)) return 'gsap'
          if (/node_modules\/three\//.test(id)) return 'three'
        },
      },
    },
  },
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
})
