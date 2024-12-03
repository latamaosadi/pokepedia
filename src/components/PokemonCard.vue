<script lang="ts" setup>
import { useElementSize, useMouseInElement } from '@vueuse/core'
import ParallaxContainer from './ParallaxContainer.vue'
import { computed, ref, type CSSProperties } from 'vue'
import type { IPokemon } from '@/types/pokemon'
import TypeBadge from './TypeBadge.vue'

const {
  pokemon,
  interactive = true,
  tilt: defaultTilt = 0,
  roll: defaultRoll = 0,
} = defineProps<{
  pokemon?: IPokemon
  interactive?: boolean
  tilt?: number
  roll?: number
}>()

const target = ref(null)
const { isOutside, elementX, elementY, elementWidth, elementHeight } = useMouseInElement(target)
const { width } = useElementSize(target)

const cardActive = computed(() => !interactive || !isOutside.value)

const backgroundStyle = computed((): CSSProperties => {
  return {
    position: 'absolute',
    inset: 0,
    background: `radial-gradient(circle at bottom left ,var(--color-poke-${pokemon?.color}) 35%, transparent 36%), radial-gradient(circle at top right ,var(--color-poke-${pokemon?.color}) 35%, transparent 36%), radial-gradient(circle at center ,var(--color-poke-${pokemon?.color}) 15%, transparent 16%)`,
    transition: isOutside.value ? '300ms ease-in-out all' : '50ms ease-in-out all',

    backgroundPosition: isOutside.value
      ? '0 0'
      : `${elementX.value / 15}px ${elementY.value / 15}px`,
    backgroundSize: `${elementWidth.value / 5}px ${elementWidth.value / 5}px`,
    opacity: isOutside.value ? 0.1 : 0.3,
  }
})

const orbStyle = computed((): CSSProperties => {
  return {
    backgroundImage: `radial-gradient(farthest-corner circle at ${elementWidth.value - elementX.value}px ${elementHeight.value - elementY.value}px, hsl(250 100% 100% / 0.5) 0%, hsl(50 48% 83% / 0.5) 15%, transparent 50%)`,
    filter: 'brightness(1.1) contrast(1.2) saturate(1.5)',
    mixBlendMode: 'difference',
    willChange: 'background-image',
    inset: 0,
    position: 'absolute',
    transition: isOutside.value ? '300ms ease-in-out all' : 'none',
    opacity: isOutside.value ? 0 : 0.7,
  }
})
const orb2Style = computed((): CSSProperties => {
  const size = 400
  if (isOutside.value) return { position: 'absolute', display: 'none' }
  return {
    opacity: 0.6,
    position: 'absolute',
    backgroundColor: `var(--color-poke-${pokemon?.color})`,
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: `${size}px`,
    filter: `blur(${size / 4}px)`,
    mixBlendMode: 'darken',
    top: `${elementY.value - size / 2}px`,
    left: `${elementX.value - size / 2}px`,
  }
})
</script>

<template>
  <ParallaxContainer class="group" ref="target" :interactive :tilt :roll>
    <div
      :class="[
        'relative aspect-[3/4] overflow-hidden rounded-[0.75em] p-2 text-center',
        { 'z-30 shadow-lg shadow-neutral-700/40': cardActive },
      ]"
      :style="`background-color: color-mix(in oklab, var(--color-poke-${pokemon?.color}) 100%, transparent);`"
    >
      <div class="absolute inset-0 bg-white/40"></div>
      <div
        :class="[
          'absolute inset-0 z-10 bg-linear-45 from-indigo-500 via-purple-500 to-pink-500 opacity-0 mix-blend-color-burn transition-all duration-500',
          { 'opacity-30': cardActive },
        ]"
      ></div>
      <div class="absolute inset-0 isolate">
        <div :style="backgroundStyle"></div>
        <div :style="orb2Style"></div>
        <div :style="orbStyle"></div>
      </div>
      <div class="absolute inset-x-0 top-0">
        <div class="p-2">
          <h2
            class="font-inter text-left leading-none font-black text-white drop-shadow-sm"
            :style="`font-size: ${width / 7.5}px;`"
          >
            {{ pokemon?.formattedName }}
          </h2>
        </div>
      </div>
      <div class="absolute inset-x-0 bottom-0">
        <div class="px-2">
          <h2
            class="font-inter text-left font-black text-white drop-shadow-sm"
            :style="`font-size: ${width / 7.5}px;`"
          >
            #{{ pokemon?.number }}
          </h2>
        </div>
      </div>
      <div class="absolute right-0 bottom-0">
        <div class="relative -mt-2 box-content p-2 text-center">
          <TypeBadge :types="pokemon?.types || []" class="justify-center" />
        </div>
      </div>
      <img
        :class="[
          'absolute inset-0 mx-auto size-full rounded-xl object-contain object-center drop-shadow-lg transition-all duration-300',
          { 'scale-125': cardActive },
        ]"
        v-lazy="pokemon?.artwork"
      />
    </div>
  </ParallaxContainer>
</template>

<style>
img[lazy='loading'] {
  opacity: 0.4;
  filter: blur(2px);
}
</style>
