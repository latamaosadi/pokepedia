import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA, VitePWAOptions } from 'vite-plugin-pwa'
import webfontDownload from 'vite-plugin-webfont-dl'

const pwaOptions: Partial<VitePWAOptions> = {
  manifest: {
    name: 'Poképedia - Fanmade Pokedex App',
    short_name: 'Poképedia',
    description: 'A fanmade pokedex app that works offline',
    theme_color: '#DE3C47',
    background_color: '#DE3C47',
  },
  registerType: 'autoUpdate',
  pwaAssets: { image: 'public/logo.svg' },
  workbox: {
    globPatterns: ['**/*.{js,css,png,svg,ico,woff,woff2}'],
    navigateFallback: undefined,
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/raw\.githubusercontent\.com\/.*/i,
        handler: 'CacheFirst',
      },
    ],
  },
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    tailwindcss(),
    webfontDownload(),
    VitePWA(pwaOptions),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
