<script setup lang="ts">
import { useMouseInElement } from '@vueuse/core'
import { ref, computed } from 'vue'

const card = ref<HTMLElement | null>(null)
const { elementX, elementY, isOutside, elementWidth, elementHeight } =
  useMouseInElement(card)

const rotateStyle = computed(() => {
  if (isOutside.value) {
    return `rotateX(0deg) rotateY(0deg)`
  }
  const lengthX = Math.floor(elementHeight.value / 2)
  const lengthY = Math.floor(elementWidth.value / 2)
  const distanceX = lengthX - elementY.value
  const distanceY = lengthY - elementX.value
  // const lengthZ = Math.floor(Math.abs(Math.hypot(distanceX, distanceY)))
  // const sinOfAngleX = Math.abs(distanceY) / lengthZ
  const rotateX = (distanceX / lengthX) * 25
  const rotateY = (distanceY / lengthY) * -15
  // const angleZ = (Math.asin(sinOfAngleX) * 180) / Math.PI
  // const rotateZ =
  //   angleZ > 0
  //     ? Math.sign(elementX.value * elementY.value) * (angleZ / 90) * 2
  //     : 0

  return `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`
})
</script>
<template>
  <div ref="card">
    <div class="perspective group relative">
      <!-- <div class="left absolute inset-y-0 left-0 z-10 w-full"></div> -->
      <!-- <div class="right absolute inset-y-0 right-0 z-10 w-20"></div> -->
      <div
        class="relative overflow-hidden duration-150 group-hover:drop-shadow-lg"
        :style="{
          transform: rotateStyle,
        }"
      >
        <!-- <div
          class="pattern absolute inset-0 z-10 rounded-xl opacity-0 mix-blend-screen transition-all duration-300 group-hover:opacity-60"
        ></div> -->
        <slot />
      </div>
    </div>
  </div>
</template>

<style scoped>
.perspective {
  perspective: 1500px;
}
/* .turn:hover {
  transform: rotateX(5deg) rotateY(-25deg) rotateZ(3deg);
} */
/* .left:hover ~ .turn {
  transform: rotateX(5deg) rotateY(-25deg) rotateZ(3deg);
} */
.right:hover ~ .turn {
  transform: rotateX(5deg) rotateY(25deg) rotateZ(-3deg);
}
</style>
