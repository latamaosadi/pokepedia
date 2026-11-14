<script lang="ts">
// Kept outside the component so it survives leaving and re-entering the view.
let savedScrollTop = 0
</script>

<script lang="ts" setup>
import PokemonCard from '@/components/PokemonCard.vue'
import ZoomableItem from '@/components/Zoomable/ZoomableItem.vue'
import { usePokemonStore } from '@/stores/pokemon'
import type { IPokemon } from '@/types/pokemon'
import { padNumber } from '@/utils/string'
import { useDebounceFn } from '@vueuse/core'
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { RecycleScroller } from 'vue-virtual-scroller'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'

const pokemonStore = usePokemonStore()
const router = useRouter()
const containerEl = ref<HTMLElement | null>(null)
const selectedPokemon = ref<IPokemon>()
const tilt = ref(0.5)
const roll = ref(0.5)

function openSelected() {
  if (selectedPokemon.value)
    router.push({ name: 'dex.detail', params: { id: selectedPokemon.value.name } })
}

const selectPokemon = useDebounceFn((pokemon: IPokemon) => {
  selectedPokemon.value = pokemon
}, 500)

// containerEl holds the RecycleScroller component; its root element is what scrolls.
const scrollerEl = () => (containerEl.value as unknown as { $el?: HTMLElement } | null)?.$el

onMounted(async () => {
  await pokemonStore.getList()
  await nextTick()
  const el = scrollerEl()
  if (el) el.scrollTop = savedScrollTop
})

onBeforeUnmount(() => {
  savedScrollTop = scrollerEl()?.scrollTop ?? savedScrollTop
})
</script>
<template>
  <div class="grid h-[calc(100vh-48px)] items-center gap-6 sm:grid-flow-col">
    <div class="p-6">
      <p class="sr-only" aria-live="polite">{{ selectedPokemon?.formattedName }}</p>
      <RouterLink
        v-if="selectedPokemon"
        :to="{ name: 'dex.detail', params: { id: selectedPokemon.name } }"
        class="mx-auto block w-full max-w-xs rounded-[0.75em] outline-none focus-visible:ring-4 focus-visible:ring-blue-400"
      >
        <PokemonCard :pokemon="selectedPokemon" :interactive="false" :tilt :roll />
      </RouterLink>
      <PokemonCard v-else class="mx-auto w-full max-w-xs" :interactive="false" :tilt :roll />
    </div>
    <RecycleScroller
      ref="containerEl"
      tabindex="0"
      aria-label="Pokémon list, use arrow keys to browse and Enter to open"
      @keydown.enter="openSelected"
      class="scroller relative outline-none focus-visible:ring-4 focus-visible:ring-blue-400 h-full max-h-80 overflow-x-hidden overflow-y-auto rounded-xl bg-white py-4 pl-4 dark:bg-neutral-800"
      :items="pokemonStore.list"
      :item-size="56"
      key-field="number"
      v-slot="{ item: pokemon }"
    >
      <ZoomableItem :container="containerEl" @select="selectPokemon(pokemon)">
        <template #default="{ style, selected }">
          <div
            :class="[
              'flex items-center gap-2 rounded-l-full transition-colors select-none',
              {
                'bg-blue-400/30 inset-shadow-sm inset-shadow-white/80 dark:bg-indigo-700/60 dark:inset-shadow-white/20':
                  selected,
              },
            ]"
            :style
          >
            <div
              class="relative size-10 overflow-hidden rounded-full inset-shadow-sm inset-shadow-neutral-800/60 dark:inset-shadow-neutral-300"
            >
              <div
                class="absolute inset-0 size-full scale-75 rounded-full blur-sm"
                :style="`background-color: var(--color-poke-${pokemon.color})`"
              ></div>
              <img
                :key="pokemon.sprite"
                :src="pokemon.sprite"
                loading="lazy"
                :alt="`${pokemon.formattedName} Sprite`"
                class="absolute inset-0 size-full bg-white/50 bg-contain dark:bg-neutral-800/40"
              />
            </div>
            <div :class="['grid']">
              <h2
                class="conde text-lg leading-tight font-bold text-neutral-800 dark:text-neutral-200"
              >
                {{ pokemon.formattedName }}
              </h2>
              <span
                class="text-xs leading-none font-bold text-neutral-400 dark:text-neutral-500"
                >#{{ padNumber(pokemon.number) }}</span
              >
            </div>
          </div>
        </template>
      </ZoomableItem>
    </RecycleScroller>
  </div>
</template>

<style>
.vue-recycle-scroller__item-wrapper {
  overflow: visible;
}
</style>
