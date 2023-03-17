import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        // enabled: true
      },
      manifest: {
        name: 'SC-VIEWER',
        short_name: 'SC-VIEWER',
        start_url: '.',
        description: 'A frontend for SCTranslationData',
        icons: [
          {
            src: '/icon/プロデューサー.webp',
            sizes: '180x180',
            type: 'image/webp',
          },
        ],
      },
    }),
  ],
  server: {
    host: '0.0.0.0',
  },
  resolve: {
    alias: [
      {
        find: 'vue-i18n',
        replacement: 'vue-i18n/dist/vue-i18n.cjs.js',
      },
    ],
  },
})
