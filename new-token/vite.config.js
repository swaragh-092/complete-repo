import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import mkcert from 'vite-plugin-mkcert'

// https://vitejs.dev/config/
// Custom hostname: Access your app at https://new-token.local.test:8769
export default defineConfig({
  plugins: [react(), mkcert()],
  server: {
    https: true,
    port: 8769,
    host: 'new-token.local.test',
    strictPort: true
  }
})
