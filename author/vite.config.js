import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import mkcert from 'vite-plugin-mkcert'

// https://vitejs.dev/config/
// Custom hostname: Access your app at https://author.local.test:9890
export default defineConfig({
  plugins: [react(), mkcert()],
  server: {
    https: true,
    port: 9890,
    host: 'author.local.test',
    strictPort: true
  }
})
