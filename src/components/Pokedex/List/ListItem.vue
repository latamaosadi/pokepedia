<script setup lang="ts">
import { IPokemon } from '@/types/pokemon'

defineProps<{
  pokemon?: IPokemon
}>()
</script>

<template>
  <RouterLink :to="{ name: 'dex.detail', params: { id: pokemon?.name || 0 } }">
    <div
      class="group relative overflow-hidden rounded border-4 border-double bg-slate-100"
      :class="`border-poke-${pokemon?.color}`"
    >
      <div
        class="pattern-carbon absolute inset-0 opacity-40 mix-blend-overlay"
      ></div>
      <div
        class="pattern-carbon absolute inset-0 opacity-0 mix-blend-color-dodge transition-all duration-150 group-hover:opacity-60"
      ></div>
      <div class="absolute inset-0 flex">
        <div class="m-auto h-3/4 w-3/4 rounded-full bg-white/40 blur-xl"></div>
      </div>
      <div class="aspect-square" :class="[`bg-poke-${pokemon?.color}/60`]">
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

<style scoped></style>
