<script setup lang="ts">
import { useMouseInElement, useParallax } from '@vueuse/core'
import { computed, reactive, ref } from 'vue'

const {
  interactive = true,
  tilt: defaultTilt = 0,
  roll: defaultRoll = 0,
} = defineProps<{
  interactive?: boolean
  tilt?: number
  roll?: number
}>()
const target = ref(null)

const { isOutside } = useMouseInElement(target)

const parallax = reactive(useParallax(target))

const isDesktop = computed(() => isOutside.value)

const cardStyle = computed(() => {
  const rotateX = !interactive ? defaultRoll : isDesktop.value ? 0 : parallax.roll
  const rotateY = !interactive ? defaultTilt : isDesktop.value ? 0 : parallax.tilt
  const rotateZ = !interactive
    ? defaultTilt * (defaultRoll * -1)
    : isDesktop.value
      ? 0
      : parallax.tilt * (parallax.roll * -1)
  return {
    transition: '.3s ease-out all',
    transform: `rotateX(${rotateX * 20}deg) rotateY(${rotateY * 20}deg) rotateZ(${rotateZ * 10}deg)`,
  }
})
</script>

<template>
  <div ref="target" class="perspective-midrange">
    <div :style="cardStyle">
      <slot />
    </div>
  </div>
</template>
