<script setup lang="ts">
import { computed, ref, onBeforeMount, defineAsyncComponent } from 'vue'
import { usePokemonStore } from '@/store/pokemon'
import TheIcon from '@/components/TheIcon.vue'
import { useScroll } from '@vueuse/core'

const pokemonStore = usePokemonStore()
const keyword = ref('')
const cardMode = ref(true)

const list = computed(() => {
  return pokemonStore.list.data.filter((pokemon) =>
    pokemon.formattedName
      .toLocaleLowerCase()
      .includes(keyword.value.toLocaleLowerCase()),
  )
})

const isLoading = computed(() => pokemonStore.list.loading)

const { y, isScrolling, arrivedState, directions } = useScroll(window, {
  idle: 5000,
})

const listComponent = computed(() => {
  const isCardMode = cardMode.value
  return defineAsyncComponent(() => {
    return isCardMode
      ? import('@/components/Pokedex/Card/CardContainer.vue')
      : import('@/components/Pokedex/List/ListContainer.vue')
  })
})

function searchPokemon(event: Event) {
  keyword.value = (event.target as HTMLInputElement).value
}
function toggleCardMode(state: boolean) {
  cardMode.value = state
}

onBeforeMount(async () => {
  await pokemonStore.getList()
})
</script>

<template>
  <div class="px-2">
    <div class="sticky inset-x-0 top-0 z-10 p-2">
      <div
        class="relative transition-all duration-200"
        :class="[
          {
            '-translate-y-full':
              (isScrolling && !directions.top && y > 88) ||
              (!isScrolling && y > 88),
            'translate-y-0':
              (isScrolling && directions.top) || arrivedState.top,
          },
        ]"
      >
        <div class="absolute inset-y-0 left-0">
          <div
            class="flex h-full items-center justify-center p-2 text-slate-600"
          >
            <TheIcon name="search" class="" />
          </div>
        </div>
        <div class="flex gap-4">
          <input
            type="text"
            class="pixelated w-full appearance-none rounded-sm bg-white py-2 pl-10 pr-4 font-pixel text-slate-600 shadow-solid-sm shadow-slate-600/40 ring-1 ring-slate-600 focus:outline-none"
            placeholder="Search your Pokemon"
            @input="(event) => searchPokemon(event)"
          />
          <button class="bg-white px-2">
            <TheIcon class="h-4" name="sliders" />
          </button>
        </div>
      </div>
    </div>

    <div class="mt-8 flex justify-center gap-2">
      <button
        :class="['filter-btn', { active: cardMode }]"
        @click.prevent="toggleCardMode(true)"
      >
        <TheIcon name="card-stack" />
        <span>Card</span>
      </button>
      <button
        :class="['filter-btn', { active: !cardMode }]"
        @click.prevent="toggleCardMode(false)"
      >
        <TheIcon name="group" />
        <span>Grid</span>
      </button>
    </div>

    <component :is="listComponent" :list="list" class="mt-4" />

    <div v-if="isLoading" class="absolute inset-x-0 bottom-0">
      <div class="bg-white py-4 text-center">Loading</div>
    </div>

    <RouterView :key="$route.fullPath" />
  </div>
</template>

<style scoped>
.filter-btn {
  @apply flex items-center gap-2 rounded-md py-1 px-3 text-center font-pixel;
}
.filter-btn span {
  @apply drop-shadow-solid;
}
.filter-btn.active {
  @apply font-bold;
}
</style>
