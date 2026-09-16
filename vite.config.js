import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'



// https://vite.dev/config/
export default defineConfig({
  define: {
    __BUNDLED_DEV__: false,
    __SERVER_FORWARD_CONSOLE__: false,
  },
  plugins: [react()],
  server: {
    allowedHosts: [
      "litigation-oclc-accounting-pulse.trycloudflare.com" //all hosts ending with .trycloudflare.com
    ]
  }
})
