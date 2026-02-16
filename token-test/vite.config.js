import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import mkcert from 'vite-plugin-mkcert'

// https://vitejs.dev/config/
// Custom hostname: Access your app at https://token-test.local.test:8976
export default defineConfig({
  plugins: [react(), mkcert()],
  server: {
    https: true,
    port: 8976,
    host: 'token-test.local.test',
    strictPort: true
  }
})
