<script setup lang="ts">
import { usePokemonStore } from '@/stores/pokemon'
import { PokemonTypeEnum } from '@/types/pokemon'
import { titleCase } from '@/utils/string'
import ShinyToggle from './ShinyToggle.vue'

const pokemonStore = usePokemonStore()
const types = Object.values(PokemonTypeEnum).filter((t) => t !== 'unknown' && t !== 'shadow')
</script>

<template>
  <div>
    <div class="flex flex-wrap items-center gap-2">
      <input
        v-model="pokemonStore.query"
        type="search"
        placeholder="Search name or number"
        aria-label="Search Pokémon by name or number"
        class="w-full min-w-0 rounded-lg bg-white px-3 py-2 text-neutral-800 shadow-sm outline-none focus-visible:ring-4 focus-visible:ring-blue-400 sm:w-auto sm:flex-1 dark:bg-neutral-800 dark:text-neutral-100"
      />
      <select
        v-model="pokemonStore.type"
        aria-label="Filter by type"
        class="select-chevron rounded-lg bg-white py-2 pr-10 pl-3 text-neutral-800 shadow-sm outline-none focus-visible:ring-4 focus-visible:ring-blue-400 dark:bg-neutral-800 dark:text-neutral-100"
      >
        <option value="">All types</option>
        <option v-for="t in types" :key="t" :value="t">{{ titleCase(t) }}</option>
      </select>
      <button
        type="button"
        :aria-pressed="pokemonStore.favoritesOnly"
        :class="[
          'shrink-0 rounded-full px-3 py-1 text-sm font-bold shadow-sm outline-none focus-visible:ring-4 focus-visible:ring-blue-400',
          pokemonStore.favoritesOnly
            ? 'bg-rose-600 text-white'
            : 'bg-white text-neutral-800 hover:bg-neutral-50 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700',
        ]"
        @click="pokemonStore.favoritesOnly = !pokemonStore.favoritesOnly"
      >
        ★ Favorites
      </button>
      <ShinyToggle />
    </div>
    <p
      v-if="!pokemonStore.filtered.length"
      class="font-pixel py-10 text-center text-2xl text-neutral-500 dark:text-neutral-400"
    >
      <template v-if="pokemonStore.favoritesOnly && !pokemonStore.favorites.length">
        No favorites yet. Open a Pokémon and tap “☆ Favorite” to add it.
      </template>
      <template v-else>No Pokémon match your search.</template>
    </p>
  </div>
</template>
