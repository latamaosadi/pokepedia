<script setup lang="ts">
import ListFilter from '@/components/ListFilter.vue'
import PokemonCard from '@/components/PokemonCard.vue'
import { useGridItems } from '@/composables/grid-items'
import { usePokemonStore } from '@/stores/pokemon'
import { useElementSize } from '@vueuse/core'
import { onMounted, ref, watch } from 'vue'
import { RecycleScroller } from 'vue-virtual-scroller'

import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'

const pokemonStore = usePokemonStore()

onMounted(async () => {
  await pokemonStore.getList()
})

// A new filter means a new list; start it from the top.
watch([() => pokemonStore.query, () => pokemonStore.type], () => window.scrollTo({ top: 0 }))

const gridSizes = {
  default: 2,
  sm: 3,
  md: 4,
  lg: 5,
  xl: 6,
  '2xl': 6,
}
const placeholder = ref<HTMLElement | null>(null)
const { height: itemHeight } = useElementSize(placeholder)
const gridItems = useGridItems(gridSizes)
</script>

<template>
  <main class="relative">
    <div
      class="sticky top-0 z-40 -mx-6 mb-2 bg-neutral-100/90 px-6 py-3 backdrop-blur dark:bg-neutral-700/90"
    >
      <ListFilter />
    </div>
    <p
      v-if="pokemonStore.list.length && !pokemonStore.filtered.length"
      class="font-pixel py-12 text-center text-2xl text-neutral-500 dark:text-neutral-400"
    >
      No Pokémon match your search.
    </p>

    <div class="invisible absolute inset-x-0 top-0 -z-10">
      <div
        class="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-6"
      >
        <PokemonCard ref="placeholder" />
      </div>
    </div>

    <RecycleScroller
      :key="pokemonStore.filterKey"
      class="scroller"
      :items="gridItems"
      :item-size="itemHeight + 8"
      :emit-update="true"
      page-mode
    >
      <template #default="{ item: row }">
        <div
          class="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-6"
        >
          <RouterLink
            v-for="pokemon in row.items"
            :key="pokemon.number"
            :to="{ name: 'dex.detail', params: { id: pokemon.name } }"
            class="rounded-[0.75em] outline-none focus-visible:ring-4 focus-visible:ring-blue-400"
          >
            <PokemonCard :pokemon="pokemon" :shiny="pokemonStore.shiny" />
          </RouterLink>
        </div>
      </template>
    </RecycleScroller>
  </main>
</template>

<style>
.vue-recycle-scroller__item-wrapper {
  overflow: visible;
}
</style>
