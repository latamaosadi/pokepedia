<script setup lang="ts">
import { IPokemon } from '@/types/pokemon'
import TypeBadge from '@/components/Pokedex/TypeBadge.vue'
import { padNumber } from '@/utils/string'
import CardPerspective from '@/components/CardPerspective.vue'
import { computed } from 'vue'

const props = defineProps<{
  pokemon?: IPokemon
}>()

const backgroundColor = computed(
  () => `bg-poke-${props.pokemon?.color || 'red'}/80`,
)
</script>

<template>
  <RouterLink :to="{ name: 'dex.detail', params: { id: pokemon?.name || 0 } }">
    <CardPerspective class="group">
      <div
        class="relative box-content aspect-card transform overflow-hidden rounded-lg p-2 text-slate-800 shadow-3d"
        :class="[backgroundColor]"
      >
        <div
          class="absolute inset-0 bg-gradient-to-b from-transparent via-white/60 to-transparent"
        ></div>
        <div
          class="card wave absolute inset-0 opacity-5 mix-blend-overlay transition-all duration-300 group-hover:opacity-10 group-hover:mix-blend-screen"
        ></div>
        <div
          class="card holographic-diagonal absolute inset-0 opacity-0 mix-blend-screen transition-all duration-500 group-hover:scale-x-125 group-hover:opacity-10"
        ></div>
        <div class="relative">
          <div class="relative">
            <div class="absolute inset-0 flex">
              <div
                class="m-auto h-32 w-32 rounded-full bg-white/40 blur-lg"
              ></div>
            </div>
            <div class="aspect-square">
              <img
                :key="pokemon?.number"
                v-lazy="pokemon?.artwork"
                height="160"
                width="160"
                class="relative w-full object-contain drop-shadow-solid-md duration-300"
              />
            </div>
          </div>
          <div class="-mt-2 box-content py-2 text-center">
            <TypeBadge :types="pokemon?.types || []" class="justify-center" />
          </div>
        </div>
        <div class="absolute inset-x-0 bottom-0">
          <div
            class="flex h-8 items-center justify-between bg-black/30 px-2 text-center font-pixel text-white sm:text-lg"
          >
            <span class=""
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
