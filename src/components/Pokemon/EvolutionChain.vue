<script setup lang="ts">
import { IEvolutionChain } from '@/types/pokemon'
import { computed } from 'vue'
import TheIcon from '../TheIcon.vue'

const props = defineProps<{
  evolution?: IEvolutionChain
}>()

const hasAnotherEvolution = computed(() => props.evolution?.evolvesTo.length)
</script>
<template>
  <div class="flex items-center justify-center gap-2">
    <div class="flex items-center gap-1">
      <div v-if="evolution?.evolutionDetail.method" class="relative">
        <TheIcon class="mx-auto h-4" name="arrow-right" />
        <div class="hidden">
          <p class="text-center font-pixel">
            {{ evolution?.evolutionDetail.method }}
          </p>
          <div v-if="evolution.evolutionDetail.method === 'use-item'">
            <img :src="evolution.evolutionDetail.item?.sprite || ''" alt="" />
            <span class="font-pixel">{{
              evolution.evolutionDetail?.item?.name
            }}</span>
          </div>
        </div>
      </div>
      <div class="w-24 shrink-0 rounded-full">
        <img
          :key="evolution?.number"
          v-lazy="evolution?.sprite"
          height="160"
          width="160"
          class="pixelated relative w-full object-contain drop-shadow-solid-md duration-300 group-hover:animate-wiggle"
        />
        <p class="text-center font-pixel text-sm">{{ evolution?.name }}</p>
      </div>
    </div>
    <template v-if="hasAnotherEvolution">
      <div class="flex items-center">
        <div class="grid gap-2">
          <EvolutionChain
            v-for="(chain, index) in evolution?.evolvesTo"
            :key="index"
            :evolution="chain"
          />
        </div>
      </div>
    </template>
  </div>
</template>
