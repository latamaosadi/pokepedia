<script setup lang="ts">
import { CardItem } from '..'
import { ref } from 'vue'
import { useElementSize } from '@vueuse/core'
import { RecycleScroller } from 'vue-virtual-scroller'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'
import { useGridItems } from '@/composables/grid-items'

const gridSizes = {
  default: 2,
  sm: 3,
  md: 4,
}
const placeholder = ref<HTMLElement | null>(null)
const { height: itemHeight } = useElementSize(placeholder)
const gridItems = useGridItems(gridSizes)
</script>

<template>
  <div>
    <div class="invisible absolute inset-x-0 top-0 -z-10">
      <div class="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
        <CardItem ref="placeholder" />
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
        <div class="grid grid-cols-2 gap-2 py-1 sm:grid-cols-3 md:grid-cols-4">
          <CardItem
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
