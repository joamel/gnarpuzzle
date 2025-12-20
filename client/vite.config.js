import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        changeOrigin: true,
        target: process.env.VITE_API_URL || "http://localhost:3001",
        rewrite: path => path.replace(/^\/api/, '')
      }
    }
  }
})
