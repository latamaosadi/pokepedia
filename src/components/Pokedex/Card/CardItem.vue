<script setup lang="ts">
import { IPokemon } from '@/types/pokemon'
import TypeBadge from '@/components/Pokedex/TypeBadge.vue'
import { padNumber } from '@/utils/string'
import CardPerspective from '@/components/CardPerspective.vue'

defineProps<{
  pokemon?: IPokemon
}>()
</script>

<template>
  <RouterLink
    :to="{ name: 'dex.detail', params: { id: pokemon?.number || 0 } }"
  >
    <CardPerspective class="group">
      <div
        class="relative transform overflow-hidden rounded-xl p-2 text-slate-800 shadow-3d"
        :class="[
          `bg-gradient-to-br from-poke-${
            pokemon?.color || 'red'
          } via-gray-100 to-poke-${pokemon?.color || 'red'}`,
        ]"
      >
        <div
          class="pattern absolute inset-0 rounded-xl opacity-20 mix-blend-overlay transition-all duration-300 group-hover:mix-blend-screen"
        ></div>
        <div
          class="pattern absolute inset-0 rounded-xl opacity-0 mix-blend-screen transition-all duration-500 group-hover:opacity-60"
        ></div>
        <div class="relative rounded-lg">
          <div class="relative">
            <div class="absolute inset-0 flex">
              <div class="m-auto h-32 w-32 rounded-full bg-white/40 blur"></div>
            </div>
            <div class="aspect-square">
              <img
                :key="pokemon?.number"
                v-lazy="pokemon?.sprite"
                height="160"
                width="160"
                class="pixelated relative w-full object-contain drop-shadow-solid-md duration-300"
              />
            </div>
          </div>
          <div class="-mt-2 box-content h-14 py-2 text-center">
            <TypeBadge :types="pokemon?.types || []" class="justify-center" />
          </div>
        </div>
        <div class="absolute inset-x-0 bottom-0">
          <div
            class="flex h-10 items-center justify-between rounded bg-black/30 px-2 text-center font-pixel text-white sm:text-lg"
          >
            <span
              ><span class="text-sm">No</span
              >{{ padNumber(pokemon?.number || 0) }}</span
            >
            <span>{{ pokemon?.formattedName || '' }}</span>
          </div>
        </div>
      </div>
    </CardPerspective>
  </RouterLink>
</template>

<style scoped></style>
