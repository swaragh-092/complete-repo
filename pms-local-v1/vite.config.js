import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import mkcert from 'vite-plugin-mkcert'

// https://vitejs.dev/config/
// Custom hostname: Access your app at https://pms-local-v1.local.test:9877
export default defineConfig({
  plugins: [react(), mkcert()],
  server: {
    https: true,
    port: 9877,
    host: 'pms-local-v1.local.test',
    strictPort: true
  }
})
