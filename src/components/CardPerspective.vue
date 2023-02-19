<script setup lang="ts">
import {
  // useDeviceOrientation,
  useMouseInElement,
} from '@vueuse/core'
import {
  ref,
  computed,
  // reactive
} from 'vue'

const card = ref<HTMLElement | null>(null)
const { elementX, elementY, isOutside, elementWidth, elementHeight } =
  useMouseInElement(card, { handleOutside: false, touch: false })
// const motion = reactive(useDeviceOrientation())

const rotateStyle = computed(() => {
  // if (motion.isSupported && (motion.alpha || motion.beta || motion.gamma)) {
  //   return `rotateX(${motion.beta}deg) rotateY(${motion.gamma}deg) rotateZ(${motion.alpha}deg)`
  // }
  if (isOutside.value) {
    return `rotateX(0deg) rotateY(0deg) rotateZ(0deg)`
  }
  const newHeight = Math.floor(elementHeight.value / 2)
  const newWidth = Math.floor(elementWidth.value / 2)

  const distanceVertical = newHeight - elementY.value
  const distanceHorizontal = newWidth - elementX.value

  const rotateX = (distanceVertical / newHeight) * 25
  const rotateY = (distanceHorizontal / newWidth) * -15

  const height =
    distanceVertical < 0
      ? elementY.value - newHeight
      : newHeight - elementY.value
  const length =
    distanceHorizontal < 0
      ? elementX.value - newWidth
      : newWidth - elementX.value
  const lengthZ = Math.floor(Math.abs(Math.hypot(height, length)))
  const sinus = height / lengthZ
  const sinAngle = 45 - Math.abs(45 - (Math.asin(sinus) * 180) / Math.PI)
  const rotateZ =
    sinAngle > 0
      ? Math.sign(distanceVertical * distanceHorizontal) * (sinAngle / 45) * -1
      : 0

  return `rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg)`
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
