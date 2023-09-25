<script setup lang="ts">
import { IEvolutionChain } from '@/types/pokemon'
import { computed, ref } from 'vue'
import TheIcon from '../TheIcon.vue'

const props = defineProps<{
  evolution?: IEvolutionChain
}>()
const currentPokemon = ref(null)

const hasAnotherEvolution = computed(() => nextEvolutions.value > 0)
const levelUpRequirement = computed(
  () =>
    props.evolution?.evolutionDetail.minLevel ||
    props.evolution?.evolutionDetail.location ||
    props.evolution?.evolutionDetail.minHappiness ||
    props.evolution?.evolutionDetail.timeOfDay,
)
const nextEvolutions = computed(() => props.evolution?.evolvesTo.length || 0)
</script>
<template>
  <div class="p-2 font-pixel">
    <div class="relative inline-block gap-2">
      <div
        class="absolute inset-x-0 h-full w-full rounded-full bg-white/50 blur-sm"
      ></div>
      <div
        v-if="evolution?.evolutionDetail.method"
        class="pointer-events-none absolute right-0 top-0 z-10"
      >
        <div class="rounded-xl bg-white/40">
          <!-- <p class="text-center font-pixel">
            {{ evolution?.evolutionDetail.method }}
          </p> -->
          <div v-if="evolution.evolutionDetail.method === 'level-up'">
            <span class="flex items-end rounded px-1 font-bold text-green-800">
              <!-- <div class="absolute top-0 right-0">
                <div class="-mt-1 -mr-2">
                  <TheIcon class="h-5 w-5 text-green-700" name="level-up" />
                </div>
              </div> -->
              <TheIcon class="h-5 w-5" name="level-up" />
              <span class="leading-none">{{ levelUpRequirement }}</span>
            </span>
          </div>
          <div v-else-if="evolution.evolutionDetail.method === 'use-item'">
            <div class="flex items-center">
              <img
                class="mx-auto"
                :src="evolution.evolutionDetail.item?.sprite || ''"
                alt=""
              />
              <span>{{ evolution.evolutionDetail.item?.name }}</span>
            </div>
          </div>
        </div>
      </div>
      <RouterLink
        :to="{ name: 'dex.detail', params: { id: evolution?.name || '' } }"
      >
        <div
          ref="currentPokemon"
          class="group relative rounded-md text-center duration-150"
        >
          <!-- <div
            v-if="hasAnotherEvolution"
            class="pointer-events-none absolute left-0 top-0"
          >
            <div class="mt-24 ml-24 h-10 w-10 border-t border-r"></div>
          </div> -->
          <div class="w-28 shrink-0">
            <img
              :key="evolution?.number"
              v-lazy="evolution?.sprite"
              height="160"
              width="160"
              class="pixelated relative w-full object-contain drop-shadow-solid-sm duration-300 group-hover:animate-wiggle"
            />
          </div>
          <div class="absolute inset-x-0 bottom-0">
            <div class="-mb-3">
              <span
                class="rounded-xl bg-black px-2 py-1 text-center text-white"
              >
                {{ evolution?.formattedName }}
              </span>
            </div>
          </div>
        </div>
      </RouterLink>
    </div>
    <template v-if="hasAnotherEvolution">
      <div
        class="ml-10 mt-2"
        :class="{
          'grid-cols-2 gap-4 sm:grid': nextEvolutions > 1,
        }"
      >
        <EvolutionChain
          v-for="(chain, index) in evolution?.evolvesTo"
          :key="index"
          :evolution="chain"
        />
      </div>
    </template>
  </div>
</template>
