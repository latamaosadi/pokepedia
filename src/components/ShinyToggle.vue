<script setup lang="ts">
import { usePokemonStore } from '@/stores/pokemon'

const pokemonStore = usePokemonStore()
</script>

<template>
  <button
    type="button"
    :aria-pressed="pokemonStore.shiny"
    :class="[
      'shrink-0 rounded-full px-3 py-1 text-sm font-bold shadow-sm outline-none focus-visible:ring-4 focus-visible:ring-blue-400',
      pokemonStore.shiny
        ? 'bg-amber-950 text-amber-200 ring-2 ring-amber-400'
        : 'bg-white text-neutral-800 hover:bg-neutral-50 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700',
    ]"
    @click="pokemonStore.shiny = !pokemonStore.shiny"
  >
    ✨ Shiny
  </button>
</template>
