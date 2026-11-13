<script setup lang="ts">
import { RouterView } from 'vue-router'
import { usePokemonStore } from '@/stores/pokemon'

const pokemonStore = usePokemonStore()
</script>

<template>
  <div class="mx-auto max-w-5xl p-6">
    <div
      v-if="pokemonStore.error"
      role="alert"
      class="mb-4 flex items-center justify-between gap-4 rounded-xl bg-red-100 p-4 text-red-800"
    >
      <span>Couldn't load the Pokédex. Check your connection and try again.</span>
      <button
        class="rounded-lg bg-red-700 px-3 py-1 font-bold text-white"
        @click="pokemonStore.getList()"
      >
        Retry
      </button>
    </div>
    <RouterView />
  </div>
</template>
