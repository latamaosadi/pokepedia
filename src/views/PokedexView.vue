<script lang="ts" setup>
import PokemonCard from '@/components/PokemonCard.vue'
import ZoomableItem from '@/components/Zoomable/ZoomableItem.vue'
import { usePokemonStore } from '@/stores/pokemon'
import type { IPokemon } from '@/types/pokemon'
import { padNumber } from '@/utils/string'
import { useDebounceFn } from '@vueuse/core'
import { onMounted, ref } from 'vue'
import { RecycleScroller } from 'vue-virtual-scroller'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'

const pokemonStore = usePokemonStore()
const containerEl = ref<HTMLElement | null>(null)
const selectedPokemon = ref<IPokemon>()
const tilt = ref(0.5)
const roll = ref(0.5)

const selectPokemon = useDebounceFn((pokemon: IPokemon) => {
  selectedPokemon.value = pokemon
}, 500)

onMounted(async () => {
  await pokemonStore.getList()
})
</script>
<template>
  <div class="grid h-[calc(100vh-48px)] items-center gap-6 sm:grid-flow-col">
    <div class="p-6">
      <PokemonCard
        class="mx-auto w-full max-w-xs"
        :pokemon="selectedPokemon"
        :interactive="false"
        :tilt
        :roll
      />
    </div>
    <RecycleScroller
      ref="containerEl"
      class="scroller relative h-full max-h-80 overflow-x-hidden overflow-y-auto rounded-xl bg-white py-4 pl-4 dark:bg-neutral-800"
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
                v-lazy="pokemon.sprite"
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
