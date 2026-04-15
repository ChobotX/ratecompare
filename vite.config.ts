import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

function disableRocketLoader() {
  return {
    name: 'disable-cloudflare-rocket-loader',
    transformIndexHtml(html: string) {
      return html.replace(/<script(?![^>]*data-cfasync)/g, '<script data-cfasync="false"')
    },
  }
}

export default defineConfig({
  plugins: [vue(), disableRocketLoader()],
  server: {
    port: process.env.PORT ? Number(process.env.PORT) : 5173,
    strictPort: true,
  },
})
