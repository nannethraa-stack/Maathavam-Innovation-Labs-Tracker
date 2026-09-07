import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test/setup.js'],
  },
  server: {
    proxy: {
      '/api': 'http://localhost:5174',
      '/artifacts': 'http://localhost:5174',
      '/logo.jpg': 'http://localhost:5174',
    },
  },
})
