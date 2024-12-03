<script setup lang="ts">
import PokemonCard from '@/components/PokemonCard.vue'
import { useGridItems } from '@/composables/grid-items'
import { usePokemonStore } from '@/stores/pokemon'
import { useElementSize } from '@vueuse/core'
import { onMounted, ref } from 'vue'
import { RecycleScroller } from 'vue-virtual-scroller'

import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'

const pokemonStore = usePokemonStore()

onMounted(async () => {
  await pokemonStore.getList()
})

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
    <div class="invisible absolute inset-x-0 top-0 -z-10">
      <div
        class="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-6"
      >
        <PokemonCard ref="placeholder" />
      </div>
    </div>

    <RecycleScroller
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
          <PokemonCard
            v-for="pokemon in row.items"
            :key="pokemon.number"
            :pokemon="pokemon"
          />
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
