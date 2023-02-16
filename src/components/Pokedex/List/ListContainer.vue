<script setup lang="ts">
import { ListItem } from '..'
import { ref } from 'vue'
import { useElementSize } from '@vueuse/core'
import { RecycleScroller } from 'vue-virtual-scroller'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'
import { useGridItems } from '@/composables/grid-items'

const gridSizes = {
  default: 4,
  sm: 4,
  md: 6,
}
const placeholder = ref<HTMLElement | null>(null)
const { height: itemHeight } = useElementSize(placeholder)
const gridItems = useGridItems(gridSizes)
</script>

<template>
  <div>
    <div class="invisible absolute inset-x-0 top-0 -z-10">
      <div class="grid grid-cols-4 gap-1 md:grid-cols-6">
        <ListItem ref="placeholder" />
      </div>
    </div>
    <RecycleScroller
      ref="scroller"
      class="scroller"
      :items="gridItems"
      :item-size="itemHeight + 4"
      :emit-update="true"
      page-mode
    >
      <template #default="{ item: row }">
        <div class="grid grid-cols-4 gap-1 md:grid-cols-6">
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
