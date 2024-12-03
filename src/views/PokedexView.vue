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

function getRandomNumberWithDecimal(min: number, max: number): number {
  const random = Math.random() * (max - min) + min
  return parseFloat(random.toFixed(1))
}

function scrollTo(index: number) {
  // @ts-expect-error containerEl is actually a component not a HTMLElement
  containerEl.value?.scrollToItem(index)
}
</script>
<template>
  <div class="grid h-screen items-center sm:grid-flow-col">
    <div class="p-6" v-if="selectedPokemon">
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
      class="scroller h-full max-h-80 overflow-x-hidden overflow-y-auto py-32 pl-4"
      :items="pokemonStore.list"
      :item-size="56"
      key-field="number"
      v-slot="{ item: pokemon, index }"
    >
      <ZoomableItem
        :container="containerEl"
        @select="selectPokemon(pokemon)"
        @click="scrollTo(index)"
      >
        <template #default="{ style, selected }">
          <div
            :class="[
              'flex items-center gap-2 rounded-l-full transition-all select-none',
              {
                'bg-blue-400/30': selected,
                'cursor-pointer hover:bg-blue-200/30': !selected,
              },
            ]"
            :style
          >
            <div
              class="relative size-10 overflow-hidden rounded-full inset-shadow-sm inset-shadow-white"
              :style="`background-color: var(--color-poke-${pokemon.color})`"
            >
              <div
                class="absolute inset-0 size-full blur-lg"
                :style="`background-color: var(--color-poke-${pokemon.color})`"
              ></div>
              <img
                v-lazy="pokemon.sprite"
                class="absolute inset-0 size-full bg-white/50 bg-contain"
              />
            </div>
            <div :class="['grid']">
              <h2 class="conde text-lg leading-tight font-bold">{{ pokemon.formattedName }}</h2>
              <span class="text-xs leading-none font-bold text-neutral-500"
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
