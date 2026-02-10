import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import mkcert from 'vite-plugin-mkcert'

// https://vitejs.dev/config/
// Custom hostname: Access your app at https://final-fn-pms.local.test:7000
export default defineConfig({
  plugins: [react(), mkcert()],
  server: {
    https: true,
    port: 7000,
    host: 'final-fn-pms.local.test',
    strictPort: true
  }
})
