<script setup lang="ts">
import { IPokemon } from '@/types/pokemon'
import TypeBadge from '@/components/Pokedex/TypeBadge.vue'
import { padNumber } from '@/utils/string'

defineProps<{
  pokemon?: IPokemon
}>()
</script>

<template>
  <RouterLink
    :to="{ name: 'dex.detail', params: { id: pokemon?.number || 0 } }"
  >
    <div
      class="group relative transform overflow-hidden rounded-xl p-2 text-slate-800 shadow-3d"
      :class="[
        `bg-gradient-to-br from-poke-${
          pokemon?.color || 'red'
        } via-gray-100 to-poke-${pokemon?.color || 'red'}`,
      ]"
    >
      <div
        class="pattern absolute inset-0 rounded-xl opacity-30 mix-blend-overlay"
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
              class="pixelated relative w-full object-contain drop-shadow-solid-md duration-300 group-hover:animate-wiggle"
            />
          </div>
        </div>
        <div class="-mt-2 box-content h-14 py-2">
          <ul class="flex justify-center gap-0.5">
            <TypeBadge
              v-for="(type, index) in pokemon?.types"
              :key="index"
              :type="type"
            />
          </ul>
          <div
            class="mt-2 flex items-center justify-between rounded bg-black/30 px-2 text-center font-pixel text-white sm:text-lg"
          >
            <span
              ><span class="text-sm">No.</span
              >{{ padNumber(pokemon?.number || 0) }}</span
            >
            <span>{{ pokemon?.name || '' }}</span>
          </div>
        </div>
      </div>
    </div>
  </RouterLink>
</template>

<style scoped></style>
