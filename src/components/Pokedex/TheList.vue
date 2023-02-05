<script setup lang="ts">
import { computed, ref, onBeforeMount } from 'vue'
import { usePokemonStore } from '@/store/pokemon'
import { Item } from '.'
// import { RecycleScroller } from 'vue-virtual-scroller'
import Grid from 'vue-virtual-scroll-grid'
import TheIcon from '../TheIcon.vue'

const pokemonStore = usePokemonStore()
const keyword = ref('')

const list = computed(() => {
  return pokemonStore.data.filter((pokemon) =>
    pokemon.name
      .toLocaleLowerCase()
      .includes(keyword.value.toLocaleLowerCase()),
  )
})

const isLoading = computed(() => pokemonStore.loading)

const computedPageProvider = computed(() => {
  const filteredList = list.value
  return async function pageProvider(pageNumber: number, pageSize: number) {
    const pageData = filteredList.slice(
      pageNumber * pageSize,
      (pageNumber + 1) * pageSize,
    )
    return pageData
  }
})

onBeforeMount(async () => {
  await pokemonStore.getList()
})
</script>

<template>
  <div class="relative">
    <div class="sticky top-0 z-10 p-4">
      <div class="relative">
        <div class="absolute inset-y-0 left-0">
          <div
            class="flex h-full items-center justify-center p-2 text-slate-600"
          >
            <TheIcon name="search" />
          </div>
        </div>
        <input
          v-model="keyword"
          type="text"
          class="pixelated w-full rounded-md bg-white py-2 pl-10 pr-4 font-pixel text-slate-600 shadow-solid shadow-slate-600/40 ring ring-slate-600 focus:outline-none"
          placeholder="Search your Pokemon"
        />
      </div>
    </div>

    <Grid
      v-if="list.length > 0"
      :length="list.length"
      :page-size="30"
      :page-provider="computedPageProvider"
      class="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-3"
    >
      <template #probe>
        <Item />
      </template>

      <template #placeholder="{ style }">
        <Item :style="style" />
      </template>

      <template #default="{ item, style }">
        <Item :pokemon="item" :style="style" />
      </template>
    </Grid>

    <!-- <div ref="listEl" class="grid grid-cols-2 gap-2 sm:grid-cols-3">
      <Item v-for="pokemon in list" :key="pokemon.number" :pokemon="pokemon" />
    </div> -->
    <div v-if="isLoading" class="absolute inset-x-0 bottom-0">
      <div class="bg-white py-4 text-center">Loading</div>
    </div>
  </div>
</template>

<style scoped></style>
