import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:5174',
      '/artifacts': 'http://localhost:5174',
      '/logo.jpg': 'http://localhost:5174',
    },
  },
})
