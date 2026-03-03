import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/tesla-api': {
        target: 'https://www.tesla.com',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/tesla-api/, ''),
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Referer': 'https://www.tesla.com/inventory/used/m3',
          'Origin': 'https://www.tesla.com',
          'Cookie': 'tsla-locale=en_US',
        },
      },
    },
  },
})
