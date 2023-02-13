<script setup lang="ts">
import { ListItem } from '..'
import Grid from 'vue-virtual-scroll-grid'
import { computed } from 'vue'

const props = defineProps<{
  list: []
}>()

const computedPageProvider = computed(() => {
  const filteredList = props.list
  return async function pageProvider(pageNumber: number, pageSize: number) {
    const pageData = filteredList.slice(
      pageNumber * pageSize,
      (pageNumber + 1) * pageSize,
    )
    return pageData
  }
})
</script>

<template>
  <Grid
    v-if="list.length > 0"
    :length="list.length"
    :page-size="50"
    :page-provider="computedPageProvider"
    class="grid grid-cols-4 gap-2 md:grid-cols-6"
  >
    <template #probe>
      <ListItem />
    </template>

    <template #placeholder="{ style }">
      <ListItem :style="style" />
    </template>

    <template #default="{ item, style }">
      <ListItem :pokemon="item" :style="style" />
    </template>
  </Grid>
</template>

<style scoped>
.filter-btn {
  @apply rounded bg-slate-400 p-1 text-white;
}
</style>
