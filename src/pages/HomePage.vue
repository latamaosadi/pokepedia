<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { usePokemonStore } from '@/store/pokemon'
import TheIcon from '@/components/TheIcon.vue'
import { useScroll } from '@vueuse/core'
import { CardContainer, ListContainer } from '@/components/Pokedex'
import LoadingData from '@/components/LoadingData.vue'
import { LocationQuery, useRoute, useRouter } from 'vue-router'

const pokemonStore = usePokemonStore()
const cardMode = ref(true)
const timeout = ref<ReturnType<typeof setTimeout> | null>(null)
const keyword = ref('')
const route = useRoute()
const router = useRouter()

const isLoading = computed(() => pokemonStore.list.loading)

const { y, isScrolling, arrivedState, directions } = useScroll(window, {
  idle: 5000,
})

function searchPokemon(event: Event) {
  const keyword = (event.target as HTMLInputElement).value
  pokemonStore.setKeyword(keyword)
  if (timeout.value) {
    clearTimeout(timeout.value)
  }
  timeout.value = setTimeout(() => {
    const query: LocationQuery = {}
    if (keyword) {
      query.search = keyword
    }
    router.replace({ query })
  }, 200)
}

function toggleCardMode(state: boolean) {
  cardMode.value = state
}

onMounted(async () => {
  keyword.value = route.query['search'] as string
  if (keyword.value) {
    pokemonStore.setKeyword(keyword.value)
  }
  await pokemonStore.getList()
})
</script>

<template>
  <div class="px-2">
    <div class="sticky inset-x-0 top-0 z-10">
      <div
        class="relative mx-auto max-w-2xl rounded-bl-lg rounded-br-lg p-2 backdrop-blur-md transition-all duration-200"
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
                <TheIcon name="search" class="text-lime-700" />
              </div>
            </div>
            <input
              v-model="keyword"
              type="text"
              class="pixelated h-full w-full appearance-none rounded-sm bg-retro-green py-2 pl-10 pr-4 font-pixel text-lime-900 shadow-inner shadow-retro-black/40 placeholder:text-lime-900 focus:outline-none"
              placeholder="Search your Pokemon"
              @input="(event) => searchPokemon(event)"
            />
          </div>
          <div class="flex items-center justify-end gap-1">
            <button
              :class="['filter-btn', { active: cardMode }]"
              @click.prevent="toggleCardMode(true)"
            >
              <TheIcon class="h-6 w-6" name="card-stack" />
            </button>
            <button
              :class="['filter-btn', { active: !cardMode }]"
              @click.prevent="toggleCardMode(false)"
            >
              <TheIcon class="h-6 w-6" name="group" />
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
  @apply rounded border border-retro-red/40 p-1 text-center text-sm text-slate-300 shadow-3d hover:shadow-inner;
  /* @apply bg-retro-red; */
  /* @apply bg-white; */
}
.filter-btn.active {
  @apply shadow-inner;
}
</style>
