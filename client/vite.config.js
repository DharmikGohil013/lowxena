import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-oauth': ['@react-oauth/google', 'jwt-decode'],
          'vendor-lottie': ['lottie-react'],
          'vendor-icons': ['lucide-react'],
        }
      }
    },
    cssCodeSplit: true,
  }
})
