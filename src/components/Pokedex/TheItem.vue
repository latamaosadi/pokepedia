<script setup lang="ts">
import { IPokemon } from '@/types/pokemon'
import TypeBadge from './TypeBadge.vue'
import { padNumber } from '@/utils/string'

defineProps<{
  pokemon?: IPokemon
}>()
</script>

<template>
  <div
    class="group relative rounded-xl p-2 text-slate-800 shadow-3d"
    :class="[
      `bg-gradient-to-br from-poke-${
        pokemon?.color || 'red'
      } via-white to-poke-${pokemon?.color || 'red'}`,
    ]"
  >
    <div class="pattern absolute inset-0 rounded-xl mix-blend-overlay"></div>
    <div class="relative rounded-lg">
      <div class="relative">
        <div class="absolute inset-0 flex">
          <div class="m-auto h-32 w-32 rounded-full bg-white/40 blur"></div>
        </div>
        <div class="absolute bottom-0 left-0 z-10">
          <div class="text-shadow p-2 font-pixel text-lg font-bold text-white">
            {{ padNumber(pokemon?.number || 0) }}
          </div>
        </div>
        <div class="aspect-square">
          <img
            loading="lazy"
            class="pixelated relative w-full transform object-contain drop-shadow-lg duration-300 group-hover:-translate-y-6 group-hover:-rotate-2 group-hover:scale-125"
            :src="pokemon?.sprite || ''"
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
        <p
          class="mt-2 rounded bg-black/30 text-center font-pixel text-xl text-white"
        >
          {{ pokemon?.name || '' }}
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pattern {
  opacity: 0.2;
  background-image: linear-gradient(#000 2px, transparent 2px),
    linear-gradient(90deg, #000 2px, transparent 2px),
    linear-gradient(#000 1px, transparent 1px),
    linear-gradient(90deg, #000 1px, #fff 1px);
  background-size: 50px 50px, 50px 50px, 10px 10px, 10px 10px;
  background-position: -2px -2px, -2px -2px, -1px -1px, -1px -1px;
}
</style>
