<script lang="ts">
// Kept outside the component so it survives leaving and re-entering the view.
let savedIndex = 0
</script>

<script lang="ts" setup>
import ListFilter from '@/components/ListFilter.vue'
import PokemonCard from '@/components/PokemonCard.vue'
import { usePokemonStore } from '@/stores/pokemon'
import type { IPokemon } from '@/types/pokemon'
import * as dexScroll from '@/utils/dex-scroll'
import { padNumber } from '@/utils/string'
import {
  until,
  useDebounceFn,
  useEventListener,
  usePreferredReducedMotion,
  useResizeObserver,
  useTitle,
} from '@vueuse/core'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch, type CSSProperties } from 'vue'
import { useRouter } from 'vue-router'
import { RecycleScroller } from 'vue-virtual-scroller'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'

const pokemonStore = usePokemonStore()
// Matches the title of the prerendered page (scripts/seo-pages.ts).
useTitle('Pokédex · Poképedia')
const router = useRouter()
const containerEl = ref<HTMLElement | null>(null)
const selectedPokemon = ref<IPokemon>()
const tilt = ref(0.5)
const roll = ref(0.5)

const reducedMotion = usePreferredReducedMotion()

// Clicking a row scrolls it onto the selection line, which selects it.
function selectRow(index: number) {
  scrollerEl()?.scrollTo({
    top: dexScroll.snapPoint(geometry.value, index),
    behavior: reducedMotion.value === 'reduce' ? 'auto' : 'smooth',
  })
}

function openSelected() {
  if (selectedPokemon.value)
    router.push({ name: 'dex.detail', params: { id: selectedPokemon.value.name } })
}

const selectPokemon = useDebounceFn((pokemon: IPokemon) => {
  selectedPokemon.value = pokemon
}, 100)

// containerEl holds the RecycleScroller component; its root element is what scrolls.
const scrollerEl = () => (containerEl.value as unknown as { $el?: HTMLElement } | null)?.$el

// Rows are a fixed height, so every position below is computed from the row index
// and scroll offset instead of measured. Measuring went stale when the virtual list
// recycled rows during fast scrollbar drags, leaving them un-zoomed.
const ITEM_SIZE = 56
// At least this much space above the first row and below the last, so the zoomed first
// and last rows aren't clipped; short lists get more (see dexScroll.listPadding).
const LIST_PADDING = 16
// Tracked by hand rather than with useScroll, which keeps reporting the old list's offset
// after a filter change remounts the list, until the new one is scrolled.
const scrollTop = ref(0)
useEventListener(
  scrollerEl,
  'scroll',
  (event: Event) => {
    scrollTop.value = (event.target as HTMLElement).scrollTop
  },
  { passive: true },
)
// The visible height including the padding. A plain ResizeObserver rather than
// useElementSize, which briefly resets the height to 0 while attaching and would put the
// snap markers (and a restored position) in the wrong place for a frame.
const viewHeight = ref(0)
useResizeObserver(scrollerEl, ([entry]) => {
  viewHeight.value = entry.borderBoxSize?.[0]?.blockSize ?? entry.contentRect.height
})
const geometry = computed(() => {
  const count = pokemonStore.filtered.length
  return {
    itemSize: ITEM_SIZE,
    count,
    viewHeight: viewHeight.value,
    padding: dexScroll.listPadding(count, viewHeight.value, ITEM_SIZE, LIST_PADDING),
  }
})
const selectedIndex = computed(() => dexScroll.selectedIndex(geometry.value, scrollTop.value))
// Invisible markers at these offsets are the snap targets; unlike the rows they're
// never virtualized away, so long jumps (End, restoring the position) still snap.
const snapPoints = computed(() =>
  pokemonStore.filtered.map((_, index) => dexScroll.snapPoint(geometry.value, index)),
)

function rowStyle(index: number): CSSProperties {
  const distance =
    Math.abs(dexScroll.offsetFromLine(geometry.value, index, scrollTop.value)) / (viewHeight.value || 1)
  return {
    transform: `scale(${Math.max(0.5, 1.4 - distance * 0.9)}) translateZ(0)`,
    transformOrigin: 'center left',
    opacity: Math.max(0.2, 1 - distance * 0.8),
  }
}

watch(
  () => pokemonStore.filtered[selectedIndex.value],
  (pokemon) => pokemon && selectPokemon(pokemon),
  { immediate: true },
)

// A new filter means a new list (remounted, see filterKey); start it from the top.
watch(
  () => pokemonStore.filterKey,
  () => {
    scrollTop.value = 0
  },
)

onMounted(async () => {
  // Restore the selected row rather than a pixel offset: the list can still settle after
  // mounting, and the browser keeps it snapped to the same row's marker when it does.
  // Wait for the list's height so the snap markers are in place too.
  await until(viewHeight).toMatch((h) => h > 0, { timeout: 1000 })
  await nextTick()
  const el = scrollerEl()
  const index = Math.min(savedIndex, pokemonStore.filtered.length - 1)
  if (!el || index <= 0) return
  // Jump with snapping off: while the list is still mounting, the browser can snap the
  // jump to a neighbouring row. Back on once it has settled, already on the right row.
  el.style.scrollSnapType = 'none'
  el.scrollTop = dexScroll.snapPoint(geometry.value, index)
  scrollTop.value = el.scrollTop
  requestAnimationFrame(() => requestAnimationFrame(() => (el.style.scrollSnapType = '')))
})

onBeforeUnmount(() => {
  savedIndex = selectedIndex.value
})
</script>
<template>
  <div class="grid h-[calc(100vh-48px)] items-center gap-6 sm:grid-cols-2">
    <div class="p-6">
      <p class="sr-only" aria-live="polite">{{ selectedPokemon?.formattedName }}</p>
      <RouterLink
        v-if="selectedPokemon"
        :to="{ name: 'dex.detail', params: { id: selectedPokemon.name } }"
        class="mx-auto block w-full max-w-xs rounded-[0.75em] outline-none focus-visible:ring-4 focus-visible:ring-blue-400"
      >
        <PokemonCard
          :pokemon="selectedPokemon"
          :shiny="pokemonStore.shiny"
          :interactive="false"
          :tilt
          :roll
        />
      </RouterLink>
      <PokemonCard v-else class="mx-auto w-full max-w-xs" :interactive="false" :tilt :roll />
    </div>
    <div class="flex flex-col gap-3">
      <ListFilter />
      <RecycleScroller
        :key="pokemonStore.filterKey"
        v-show="pokemonStore.filtered.length"
        ref="containerEl"
        tabindex="0"
        aria-label="Pokémon list, use arrow keys to browse and Enter to open"
        @keydown.enter="openSelected"
        class="scroller relative h-80 snap-y snap-mandatory overflow-x-hidden overflow-y-auto rounded-xl bg-white pl-4 outline-none focus-visible:ring-4 focus-visible:ring-blue-400 dark:bg-neutral-800"
        :style="{ paddingBlock: `${geometry.padding}px` }"
        :items="pokemonStore.filtered"
        :item-size="ITEM_SIZE"
        key-field="number"
      >
        <template #before>
          <div aria-hidden="true" class="pointer-events-none absolute top-0 left-0 w-px">
            <div
              v-for="(top, index) in snapPoints"
              :key="index"
              class="absolute h-px w-px snap-start"
              :style="{ top: `${top}px` }"
            ></div>
          </div>
        </template>
        <template #default="{ item: pokemon, index }">
          <div class="flex h-14 cursor-pointer items-center" @click="selectRow(index)">
            <div
              :class="[
                'flex grow items-center gap-2 rounded-l-full transition-colors select-none',
                {
                  'bg-blue-400/30 inset-shadow-sm inset-shadow-white/80 dark:bg-indigo-700/60 dark:inset-shadow-white/20':
                    index === selectedIndex,
                },
              ]"
              :style="rowStyle(index)"
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
          </div>
        </template>
      </RecycleScroller>
    </div>
  </div>
</template>

<style>
.vue-recycle-scroller__item-wrapper {
  overflow: visible;
}
</style>
