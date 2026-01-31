import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import mkcert from 'vite-plugin-mkcert'

// https://vitejs.dev/config/
// Custom hostname: Access your app at https://pms-client.local.test:5677
export default defineConfig({
  plugins: [react(), mkcert()],
  server: {
    https: true,
    port: 5677,
    host: 'pms-client.local.test',
    strictPort: true
  }
})
