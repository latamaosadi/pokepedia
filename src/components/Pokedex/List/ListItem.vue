<script setup lang="ts">
import { IPokemon } from '@/types/pokemon'

defineProps<{
  pokemon?: IPokemon
}>()
</script>

<template>
  <RouterLink
    :to="{ name: 'dex.detail', params: { id: pokemon?.number || 0 } }"
  >
    <!-- <div class="pattern absolute inset-0 rounded-xl mix-blend-overlay"></div> -->
    <div
      class="group relative overflow-hidden rounded border-4 border-double"
      :class="`border-poke-${pokemon?.color}`"
    >
      <div class="absolute inset-0 flex">
        <div class="m-auto h-16 w-16 rounded-full bg-white/60 blur-lg"></div>
      </div>
      <div class="aspect-square" :class="[`bg-poke-${pokemon?.color}/50`]">
        <img
          :key="pokemon?.number"
          v-lazy="pokemon?.sprite"
          height="80"
          width="80"
          class="pixelated relative w-full object-contain drop-shadow-solid-md duration-300 group-hover:animate-wiggle"
        />
      </div>
    </div>
  </RouterLink>
</template>

<style scoped>
.pattern {
  opacity: 0.1;
  background-image: linear-gradient(#000 2px, transparent 2px),
    linear-gradient(90deg, #000 2px, transparent 2px),
    linear-gradient(#000 1px, transparent 1px),
    linear-gradient(90deg, #000 1px, #fff 1px);
  background-size: 50px 50px, 50px 50px, 10px 10px, 10px 10px;
  background-position: -2px -2px, -2px -2px, -1px -1px, -1px -1px;
}
</style>
