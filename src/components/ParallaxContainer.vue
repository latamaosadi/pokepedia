<script setup lang="ts">
import { computed } from 'vue'

const { tilt = 0, roll = 0 } = defineProps<{
  tilt?: number
  roll?: number
}>()

const cardStyle = computed(() => ({
  transition: '.3s ease-out all',
  transform: `rotateX(${roll * 20}deg) rotateY(${tilt * 20}deg) rotateZ(${tilt * -roll * 10}deg)`,
}))
</script>

<template>
  <div class="perspective-midrange">
    <div :style="cardStyle">
      <slot />
    </div>
  </div>
</template>
