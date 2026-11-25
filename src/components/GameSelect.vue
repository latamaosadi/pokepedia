<script setup lang="ts">
import { usePokemonStore } from '@/stores/pokemon'
import { computed } from 'vue'

const pokemonStore = usePokemonStore()
const generations = computed(() =>
  [...new Set(pokemonStore.games.map((game) => game.generation))].map((generation) => ({
    generation,
    games: pokemonStore.games.filter((game) => game.generation === generation),
  })),
)
</script>

<template>
  <select
    v-model="pokemonStore.gameId"
    aria-label="Game"
    class="select-chevron min-w-0 shrink rounded-lg bg-white py-2 pr-10 pl-3 font-bold text-neutral-800 shadow-sm outline-none focus-visible:ring-4 focus-visible:ring-blue-400 dark:bg-neutral-800 dark:text-neutral-100"
  >
    <option value="">National Dex</option>
    <optgroup
      v-for="{ generation, games } in generations"
      :key="generation"
      :label="`Generation ${generation}`"
    >
      <option v-for="game in games" :key="game.id" :value="game.id">{{ game.name }}</option>
    </optgroup>
  </select>
</template>
