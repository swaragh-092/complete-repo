import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import mkcert from 'vite-plugin-mkcert'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), mkcert()],
  server: {
    https: true,
    host: 'account.local.test',
    port: 5174,
    strictPort: true,
  },
})



// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'
// import mkcert from 'vite-plugin-mkcert'

// export default defineConfig({
//   plugins: [react(), mkcert()],
//   server: {
//     https: true,
//     host: 'account.local.test',
//     port: 5174,
//     strictPort: true,

//     proxy: {
//       // All calls to /auth/* will go to your backend
//       '/auth': {
//         target: 'http://auth.local.test:4000',
//         changeOrigin: true,
//         secure: false,
//         rewrite: (path) => path,  // keep /auth prefix
//       }
//     }
//   }
// })
