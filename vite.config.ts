import { fileURLToPath, URL } from 'node:url'

import { createLogger, defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA, VitePWAOptions } from 'vite-plugin-pwa'
import webfontDownload from 'vite-plugin-webfont-dl'
import { seoPages } from './scripts/seo-pages'

// Where the site is published, for canonical links, link previews and the sitemap.
const SITE_URL = process.env.SITE_URL ?? 'https://pokepedia.latamaosadi.com'

const pwaOptions: Partial<VitePWAOptions> = {
  manifest: {
    name: 'Poképedia - Fanmade Pokedex App',
    short_name: 'Poképedia',
    description: 'A fanmade pokedex app that works offline',
    theme_color: '#DE3C47',
    background_color: '#DE3C47',
  },
  registerType: 'prompt',
  pwaAssets: { image: 'public/logo.svg' },
  workbox: {
    globPatterns: ['**/*.{html,js,css,png,svg,ico,woff,woff2}'],
    // Per-page HTML exists for search engines and link previews; the app itself never loads it.
    globIgnores: ['dex.html', 'team.html', 'dex/**'],
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/raw\.githubusercontent\.com\/.*/i,
        handler: 'CacheFirst',
      },
      {
        // Move learners per game (public/learners), fetched when a move is opened.
        urlPattern: ({ sameOrigin, url }) => sameOrigin && url.pathname.startsWith('/learners/'),
        handler: 'StaleWhileRevalidate',
        options: { cacheName: 'learners' },
      },
      {
        urlPattern: /^https:\/\/pokeapi\.co\/api\/.*/i,
        handler: 'StaleWhileRevalidate',
        options: { cacheName: 'pokeapi', expiration: { maxEntries: 1000 } },
      },
    ],
  },
}

// https://vite.dev/config/
// Vue's dev-only HTML nesting check predates the customizable <select> (used by the type
// filter), which allows a <button> in a <select> and images in an <option>. The app has no
// SSR, so the hydration risk it warns about doesn't apply. Only these two exact warnings
// are dropped; any other nesting problem is still reported.
const logger = createLogger()
const warn = logger.warn
logger.warn = (message, options) => {
  if (/<(button> cannot be child of <select|img> cannot be child of <option)>/.test(message)) return
  warn(message, options)
}

export default defineConfig({
  customLogger: logger,
  plugins: [
    vue({
      // <selectedcontent> belongs to the browser's customizable <select>, not a component.
      template: { compilerOptions: { isCustomElement: (tag) => tag === 'selectedcontent' } },
    }),
    vueDevTools(),
    tailwindcss(),
    webfontDownload(),
    VitePWA(pwaOptions),
    seoPages(SITE_URL),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
