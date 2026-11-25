<script setup lang="ts">
import { useEventListener } from '@vueuse/core'
import { useRegisterSW } from 'virtual:pwa-register/vue'

const CHECK_EVERY = 60 * 60 * 1000

let registration: ServiceWorkerRegistration | undefined
const checkForUpdate = () => registration?.update()

// The service worker serves the cached app first, so a deployment downloads in the
// background and waits; this offers to switch to it.
const { needRefresh, updateServiceWorker } = useRegisterSW({
  immediate: true,
  onRegisteredSW(_url, swRegistration) {
    registration = swRegistration
    if (!registration) return
    // workbox-window stops listening after the first update it finds, so an app left open
    // across two deployments would never offer the second. Watch every one here.
    registration.addEventListener('updatefound', () => {
      const worker = registration?.installing
      worker?.addEventListener('statechange', () => {
        if (worker.state === 'installed' && navigator.serviceWorker.controller) needRefresh.value = true
      })
    })
    // Browsers only look for updates on page loads; an app left open checks hourly too.
    setInterval(checkForUpdate, CHECK_EVERY)
  },
})

// Phones pause timers in the background, so also check whenever the app is brought back.
useEventListener(document, 'visibilitychange', () => {
  if (document.visibilityState === 'visible') checkForUpdate()
})

function reload() {
  // workbox-window only reloads for the update it was told about; this covers later ones.
  navigator.serviceWorker.addEventListener('controllerchange', () => window.location.reload())
  updateServiceWorker()
}
</script>

<template>
  <div
    v-if="needRefresh"
    role="status"
    class="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-sm items-center gap-3 rounded-xl bg-neutral-800 py-2 pr-2 pl-4 text-white shadow-lg dark:bg-neutral-100 dark:text-neutral-900"
  >
    <span class="flex-1 font-bold">New version available</span>
    <button
      type="button"
      class="rounded-lg bg-white px-3 py-1.5 font-bold text-neutral-900 outline-none hover:bg-neutral-200 focus-visible:ring-4 focus-visible:ring-blue-400 dark:bg-neutral-800 dark:text-white dark:hover:bg-neutral-700"
      @click="reload"
    >
      Reload
    </button>
    <button
      type="button"
      aria-label="Dismiss"
      class="rounded-lg px-2 py-1.5 font-bold outline-none hover:bg-white/10 focus-visible:ring-4 focus-visible:ring-blue-400 dark:hover:bg-black/10"
      @click="needRefresh = false"
    >
      ✕
    </button>
  </div>
</template>
