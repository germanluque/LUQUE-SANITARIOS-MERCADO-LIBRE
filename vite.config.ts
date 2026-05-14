import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/espn': {
        target: 'http://site.api.espn.com/apis',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/espn/, '')
      }
    }
  }
})
