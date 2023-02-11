<script setup lang="ts">
import { IPokemon } from '@/types/pokemon'
import TypeBadge from '@/components/Pokedex/TypeBadge.vue'

defineProps<{
  pokemon?: IPokemon
}>()
</script>

<template>
  <RouterLink
    :to="{ name: 'dex.detail', params: { id: pokemon?.number || 0 } }"
  >
    <div class="group relative">
      <!-- <div class="pattern absolute inset-0 rounded-xl mix-blend-overlay"></div> -->
      <div class="relative flex items-center gap-2">
        <div class="relative w-16 shrink-0 sm:w-20">
          <div class="absolute inset-0 flex">
            <div class="m-auto h-8 w-8 rounded-full bg-white/40 blur"></div>
          </div>
          <div
            class="aspect-square rounded-lg"
            :class="[`bg-poke-${pokemon?.color}/50`]"
          >
            <img
              :key="pokemon?.number"
              v-lazy="pokemon?.sprite"
              height="80"
              width="80"
              class="relative w-full object-contain drop-shadow-solid-md duration-300 group-hover:animate-wiggle"
            />
          </div>
        </div>
        <div class="flex-1">
          <div class="font-pixel">
            <p>{{ pokemon?.name || '' }}</p>
            <!-- <p>#{{ padNumber(pokemon?.number || 0) }}</p> -->
          </div>
          <ul class="mt-1 flex gap-0.5">
            <TypeBadge
              v-for="(type, index) in pokemon?.types"
              :key="index"
              :type="type"
            />
          </ul>
        </div>
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
