import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import mkcert from 'vite-plugin-mkcert'

export default defineConfig(({ mode }) => {
  const isDev = mode === 'development'

  return {
    plugins: [
      react(),
      // mkcert only needed in dev for self-signed HTTPS
      ...(isDev ? [mkcert()] : []),
    ],

    // Dev server (ignored during `vite build`)
    server: {
      https: isDev,
      port: 7000,
      host: 'localhost',
      strictPort: true,
    },

    build: {
      target: 'es2020',
      sourcemap: false,
      minify: 'esbuild',
      cssCodeSplit: true,
      // Route-level code splitting via React.lazy() is the primary optimisation.
      // Vite/Rollup handles vendor chunk splitting automatically — manual splits
      // for deeply inter-dependent packages (recharts, nivo, d3) cause CJS→ESM
      // ordering failures at runtime ("undefined is not a function").
      chunkSizeWarningLimit: 2000,
    },
  }
})
