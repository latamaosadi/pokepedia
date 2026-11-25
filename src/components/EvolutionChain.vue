<script setup lang="ts">
import { usePokemonStore } from '@/stores/pokemon'
import type { IEvolutionChain } from '@/types/pokemon'
import { padNumber } from '@/utils/string'
import { computed } from 'vue'
import TypeBadge from './TypeBadge.vue'

const { evolution, horizontal = false } = defineProps<{
  evolution: IEvolutionChain
  /** Left to right on large screens, for lines without wide branching. */
  horizontal?: boolean
}>()

const pokemonStore = usePokemonStore()
// From the selected game's Pokédex when it's in it, for that era's types.
const inDex = computed(() => pokemonStore.dex.find((p) => p.number === evolution.number))
const pokemon = computed(() => inDex.value ?? pokemonStore.list[evolution.number - 1])
// Final evolutions line up their cards, under method labels of different heights.
const allFinal = computed(() => evolution.evolvesTo.every((next) => !next.evolvesTo.length))
const tint = (percent: number) =>
  `color-mix(in oklab, var(--color-poke-${pokemon.value?.color ?? 'gray'}) ${percent}%, transparent)`
</script>

<template>
  <div :class="['flex flex-col items-center', horizontal && 'lg:flex-row']">
    <RouterLink
      :to="{ name: 'dex.detail', params: { id: evolution.name } }"
      :class="[
        'flex w-28 flex-col items-center rounded-2xl border-2 px-2 pb-2 text-center shadow-sm outline-none hover:-translate-y-0.5 focus-visible:ring-4 focus-visible:ring-blue-400 aria-[current=page]:ring-4 aria-[current=page]:ring-neutral-800 motion-safe:transition-transform dark:aria-[current=page]:ring-neutral-100',
        pokemonStore.game && !inDex && 'opacity-60',
      ]"
      :style="{ backgroundColor: tint(15), borderColor: tint(45) }"
    >
      <img
        :src="evolution.sprite"
        alt=""
        width="96"
        height="96"
        loading="lazy"
        class="drop-shadow-solid-sm -mb-2 size-24 [image-rendering:pixelated]"
      />
      <span class="text-xs font-bold text-neutral-500 dark:text-neutral-400">
        #{{ padNumber(evolution.number) }}
      </span>
      <span class="font-inter leading-tight font-black">{{ evolution.formattedName }}</span>
      <TypeBadge v-if="pokemon?.types" :types="pokemon.types" class="mt-1" />
      <span v-if="pokemonStore.game && !inDex" class="mt-1 text-xs font-bold">Not in the Pokédex</span>
    </RouterLink>

    <template v-if="evolution.evolvesTo.length">
      <svg
        viewBox="0 0 16 16"
        aria-hidden="true"
        :class="[
          'my-1 size-5 shrink-0 fill-current text-neutral-400 dark:text-neutral-500',
          horizontal && 'lg:mx-1 lg:-rotate-90',
        ]"
      >
        <path d="M7 1h2v10l3-3 1.5 1.5L8 15 2.5 9.5 4 8l3 3z" />
      </svg>
      <ul
        :class="[
          'flex flex-wrap justify-center gap-x-3 gap-y-4',
          allFinal ? 'items-end' : 'items-start',
          horizontal && 'lg:flex-col lg:flex-nowrap',
          evolution.evolvesTo.length > 1 &&
            'rounded-2xl border-2 border-dashed border-neutral-300 p-3 dark:border-neutral-600',
        ]"
      >
        <li
          v-for="next in evolution.evolvesTo"
          :key="next.name"
          :class="['flex flex-col items-center gap-1', horizontal && 'lg:flex-row lg:gap-2']"
        >
          <span class="sr-only">Evolves into {{ next.formattedName }}:</span>
          <div class="flex flex-col items-center gap-1">
            <span
              v-for="method in next.methods"
              :key="method.text"
              class="font-pixel flex max-w-28 items-center sm:max-w-36 gap-1 rounded-full bg-white px-2 text-center text-base leading-tight shadow-sm dark:bg-neutral-800"
            >
              <img v-if="method.itemSprite" :src="method.itemSprite" alt="" class="-my-1 size-6" />
              {{ method.text }}
            </span>
          </div>
          <EvolutionChain :evolution="next" :horizontal />
        </li>
      </ul>
    </template>
  </div>
</template>
