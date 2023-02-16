<script setup lang="ts">
import { ListItem } from '..'
import { ref } from 'vue'
import { useElementSize } from '@vueuse/core'
import { RecycleScroller } from 'vue-virtual-scroller'
import { useGridItems } from '@/composables/grid-items'

const gridSizes = {
  default: 3,
  sm: 4,
  md: 6,
  lg: 8,
  xl: 10,
  '2xl': 12,
}
const placeholder = ref<HTMLElement | null>(null)
const { height: itemHeight } = useElementSize(placeholder)
const gridItems = useGridItems(gridSizes)
</script>

<template>
  <div>
    <div class="invisible absolute inset-x-0 top-0 -z-10">
      <div
        class="grid grid-cols-3 gap-1 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 2xl:grid-cols-12"
      >
        <ListItem ref="placeholder" />
      </div>
    </div>
    <RecycleScroller
      class="scroller"
      :items="gridItems"
      :item-size="itemHeight + 4"
      :emit-update="true"
      page-mode
    >
      <template #default="{ item: row }">
        <div
          class="grid grid-cols-3 gap-1 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 2xl:grid-cols-12"
        >
          <ListItem
            v-for="pokemon in row.items"
            :key="pokemon.number"
            :pokemon="pokemon"
          />
        </div>
      </template>
    </RecycleScroller>
  </div>
</template>

<style scoped>
.filter-btn {
  @apply rounded bg-slate-400 p-1 text-white;
}
</style>
