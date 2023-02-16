<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { usePokemonStore } from '@/store/pokemon'
import TheIcon from '@/components/TheIcon.vue'
import { useScroll } from '@vueuse/core'
import { CardContainer, ListContainer } from '@/components/Pokedex'
import LoadingData from '@/components/LoadingData.vue'

const pokemonStore = usePokemonStore()
const cardMode = ref(true)

const isLoading = computed(() => pokemonStore.list.loading)

const { y, isScrolling, arrivedState, directions } = useScroll(window, {
  idle: 5000,
})

function searchPokemon(event: Event) {
  pokemonStore.setKeyword((event.target as HTMLInputElement).value)
}

function toggleCardMode(state: boolean) {
  cardMode.value = state
}

onMounted(async () => {
  await pokemonStore.getList()
})
</script>

<template>
  <div class="px-2">
    <div class="sticky inset-x-0 top-0 z-10">
      <div
        class="relative mx-auto max-w-2xl p-2 backdrop-blur-md transition-all duration-200"
        :class="[
          {
            '-translate-y-full':
              (isScrolling && !directions.top && y > 72) ||
              (!isScrolling && y > 72),
            'translate-y-0':
              (isScrolling && directions.top) || arrivedState.top,
          },
        ]"
      >
        <div class="flex gap-4">
          <div class="relative flex-1">
            <div class="absolute inset-y-0 left-0">
              <div
                class="flex h-full items-center justify-center p-2 text-retro-black"
              >
                <TheIcon name="search" />
              </div>
            </div>
            <input
              type="text"
              class="pixelated w-full appearance-none rounded-sm bg-retro-green py-2 pl-10 pr-4 font-pixel text-retro-black shadow-inner shadow-retro-black/40 placeholder:text-retro-black focus:outline-none"
              placeholder="Search your Pokemon"
              @input="(event) => searchPokemon(event)"
            />
          </div>
          <div class="flex items-center justify-end gap-1">
            <button
              :class="['filter-btn', { active: cardMode }]"
              @click.prevent="toggleCardMode(true)"
            >
              <TheIcon class="h-7 w-7" name="card-stack" />
            </button>
            <button
              :class="['filter-btn', { active: !cardMode }]"
              @click.prevent="toggleCardMode(false)"
            >
              <TheIcon class="h-7 w-7" name="group" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="!isLoading" class="relative mt-4">
      <component :is="cardMode ? CardContainer : ListContainer" />
    </div>

    <div v-if="isLoading" class="fixed inset-0">
      <LoadingData class="h-screen" />
    </div>

    <RouterView :key="$route.fullPath" />
  </div>
</template>

<style scoped>
.filter-btn {
  @apply rounded  bg-retro-red p-1 text-center text-sm text-slate-300 shadow-3d hover:shadow-inner;
}
.filter-btn.active {
  @apply bg-retro-red-darker shadow-inner;
}
</style>
