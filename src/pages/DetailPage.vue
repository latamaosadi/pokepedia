<script setup lang="ts">
import { onBeforeMount, computed, onBeforeUnmount } from 'vue'
import { usePokemonStore } from '@/store/pokemon'
import { useRoute } from 'vue-router'
import TypeBadge from '@/components/Pokedex/TypeBadge.vue'
import EvolutionChain from '@/components/Pokemon/EvolutionChain.vue'
import { padNumber } from '@/utils/string'

const pokemonStore = usePokemonStore()
const route = useRoute()

const pokemon = computed(() => pokemonStore.info)

onBeforeMount(async () => {
  await pokemonStore.getInfo(parseInt(route.params.id as string))
})

onBeforeUnmount(() => {
  pokemonStore.clearInfo()
})
</script>

<template>
  <div>
    <Transition name="fade-up">
      <div v-if="!!pokemon" class="fixed inset-x-0 bottom-0 z-10">
        <div class="fixed inset-0 bg-white/40"></div>
        <div class="relative mx-auto max-h-screen max-w-xl bg-white shadow-lg">
          <div
            class="pattern-carbon absolute inset-0 opacity-20 bg-blend-overlay"
          ></div>
          <!-- <div class="absolute inset-x-0 top-0 -translate-y-1/2">
            <div
              class="mx-auto w-52 rounded-full border-8 border-slate-300 p-4"
              :class="[
                `bg-gradient-to-br from-poke-${pokemon.color} via-white to-poke-${pokemon.color}`,
              ]"
            >
              <div class="aspect-square">
                <img
                  :key="pokemon.number"
                  v-lazy="pokemon.animatedSprite"
                  height="160"
                  width="160"
                  class="pixelated relative h-full w-full object-contain object-center"
                />
              </div>
            </div>
          </div> -->
          <div class="relative">
            <div
              class="flex gap-4 py-2 px-4"
              :class="`bg-poke-${pokemon.color}/60`"
            >
              <div>
                <div class="mx-auto w-32">
                  <div class="aspect-square">
                    <img
                      :key="pokemon.number"
                      v-lazy="pokemon.sprite"
                      height="160"
                      width="160"
                      class="pixelated relative h-full w-full object-contain object-center"
                    />
                  </div>
                </div>
              </div>
              <div class="relative">
                <h1 class="font-pixel text-lg">
                  <span class="text-sm">No.</span
                  >{{ padNumber(pokemon?.number || 0) }}
                  {{ pokemon.name }}
                </h1>
                <p class="font-pixel">{{ pokemon.genus }}</p>
                <ul class="mt-1 flex gap-0.5">
                  <TypeBadge
                    v-for="(type, index) in pokemon.types"
                    :key="index"
                    :type="type"
                  />
                </ul>
                <div class="mt-1">
                  <ol class="font-pixel text-sm">
                    <li>Height: {{ pokemon.height }}</li>
                    <li>Weight: {{ pokemon.weight }}</li>
                  </ol>
                </div>
              </div>
            </div>
            <div class="p-4" :class="`bg-poke-${pokemon.color}/30`">
              <div
                class="relative border p-2 font-pixel"
                :class="`border-poke-${pokemon.color}/70 bg-poke-${pokemon.color}/20`"
              >
                {{ pokemon.description }}
              </div>
              <EvolutionChain
                class="mt-2"
                :evolution="pokemon.evolutionChain"
              />
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.fade-up-enter-active,
.fade-up-leave-active {
  transition: all 0.2s ease;
}

.fade-up-enter-from,
.fade-up-leave-to {
  opacity: 0;
  transform: translateY(100%);
}
</style>
