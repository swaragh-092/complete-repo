import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import mkcert from 'vite-plugin-mkcert'

// https://vitejs.dev/config/
// Custom hostname: Access your app at https://non-docker.local.test:7877
export default defineConfig({
  plugins: [react(), mkcert()],
  server: {
    https: true,
    port: 7877,
    host: 'non-docker.local.test',
    strictPort: true
  }
})
