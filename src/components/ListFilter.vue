<script setup lang="ts">
import { usePokemonStore } from '@/stores/pokemon'
import { PokemonTypeEnum } from '@/types/pokemon'
import { typeIcon } from '@/utils/sprite'
import { titleCase } from '@/utils/string'
import { computed } from 'vue'
import GameSelect from './GameSelect.vue'
import ShinyToggle from './ShinyToggle.vue'

const pokemonStore = usePokemonStore()
// In the usual order, limited to the types that exist in the selected game.
const types = computed(() =>
  Object.values(PokemonTypeEnum).filter((t) => pokemonStore.availableTypes.includes(t)),
)
const views = [
  { name: 'home', label: 'Grid' },
  { name: 'dex', label: 'Pokédex' },
]
</script>

<template>
  <div>
    <div class="flex flex-wrap items-center gap-2">
      <nav
        aria-label="List view"
        class="flex shrink-0 rounded-lg bg-white p-1 text-sm font-bold shadow-sm dark:bg-neutral-800"
      >
        <RouterLink
          v-for="view in views"
          :key="view.name"
          :to="{ name: view.name }"
          class="rounded-md px-3 py-1 text-neutral-600 outline-none hover:text-neutral-900 focus-visible:ring-4 focus-visible:ring-blue-400 aria-[current=page]:bg-neutral-800 aria-[current=page]:text-white dark:text-neutral-300 dark:hover:text-white dark:aria-[current=page]:bg-neutral-100 dark:aria-[current=page]:text-neutral-900"
        >
          {{ view.label }}
        </RouterLink>
      </nav>
      <GameSelect />
      <input
        v-model="pokemonStore.query"
        type="search"
        placeholder="Search name or #"
        aria-label="Search Pokémon by name or number"
        class="min-w-40 flex-1 rounded-lg bg-white px-3 py-2 text-neutral-800 shadow-sm outline-none focus-visible:ring-4 focus-visible:ring-blue-400 dark:bg-neutral-800 dark:text-neutral-100"
      />
      <select
        v-model="pokemonStore.type"
        aria-label="Filter by type"
        class="type-select select-chevron rounded-lg bg-white py-2 pr-10 pl-3 text-neutral-800 shadow-sm outline-none focus-visible:ring-4 focus-visible:ring-blue-400 dark:bg-neutral-800 dark:text-neutral-100"
      >
        <button><selectedcontent></selectedcontent></button>
        <option value="" style="--type-color: var(--color-neutral-500)">All types</option>
        <option
          v-for="t in types"
          :key="t"
          :value="t"
          :style="{ '--type-color': `var(--color-type-${t})` }"
        >
          <img :src="typeIcon(t)" alt="" width="20" height="20" />
          {{ titleCase(t) }}
        </option>
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
