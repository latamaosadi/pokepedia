<script setup lang="ts">
import { usePokemonStore } from '@/stores/pokemon'
import { PokemonTypeEnum } from '@/types/pokemon'
import { titleCase } from '@/utils/string'
import ShinyToggle from './ShinyToggle.vue'

const pokemonStore = usePokemonStore()
const types = Object.values(PokemonTypeEnum).filter((t) => t !== 'unknown' && t !== 'shadow')
</script>

<template>
  <div class="flex items-center gap-2">
    <input
      v-model="pokemonStore.query"
      type="search"
      placeholder="Search name or number"
      aria-label="Search Pokémon by name or number"
      class="min-w-0 flex-1 rounded-lg bg-white px-3 py-2 text-neutral-800 shadow-sm outline-none focus-visible:ring-4 focus-visible:ring-blue-400 dark:bg-neutral-800 dark:text-neutral-100"
    />
    <select
      v-model="pokemonStore.type"
      aria-label="Filter by type"
      class="select-chevron rounded-lg bg-white py-2 pr-10 pl-3 text-neutral-800 shadow-sm outline-none focus-visible:ring-4 focus-visible:ring-blue-400 dark:bg-neutral-800 dark:text-neutral-100"
    >
      <option value="">All types</option>
      <option v-for="t in types" :key="t" :value="t">{{ titleCase(t) }}</option>
    </select>
    <ShinyToggle />
  </div>
</template>
