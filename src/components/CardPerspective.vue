<script setup lang="ts">
import { useMouseInElement } from '@vueuse/core'
import { ref, watch } from 'vue'

const card = ref<HTMLElement | null>(null)
const innerCard = ref<HTMLElement | null>(null)
const { elementX, elementY, isOutside, elementWidth, elementHeight } =
  useMouseInElement(card, { handleOutside: false, touch: false })

watch([elementX, elementY, isOutside], ([pointX, pointY, outsideEl]) => {
  if (outsideEl && innerCard.value?.animate) {
    innerCard.value.animate(
      {
        'will-change': 'transform',
        transform: `rotateX(0deg) rotateY(0deg) rotateZ(0deg)`,
      },
      { duration: 600, fill: 'forwards' },
    )
    return
  }
  const newHeight = Math.floor(elementHeight.value / 2)
  const newWidth = Math.floor(elementWidth.value / 2)

  const distanceVertical = newHeight - pointY
  const distanceHorizontal = newWidth - pointX

  const rotateX = (distanceVertical / newHeight) * 25
  const rotateY = (distanceHorizontal / newWidth) * -15

  const height = distanceVertical < 0 ? pointY - newHeight : newHeight - pointY
  const length = distanceHorizontal < 0 ? pointX - newWidth : newWidth - pointX
  const lengthZ = Math.floor(Math.abs(Math.hypot(height, length)))
  const sinus = height / lengthZ
  const sinAngle = 45 - Math.abs(45 - (Math.asin(sinus) * 180) / Math.PI)
  const rotateZ =
    sinAngle > 0
      ? Math.sign(distanceVertical * distanceHorizontal) * (sinAngle / 45) * 3
      : 0
  if (innerCard.value?.animate) {
    innerCard.value.animate(
      {
        'will-change': 'transform',
        transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg)`,
      },
      { duration: 300, fill: 'forwards' },
    )
  }
})
</script>
<template>
  <div ref="card">
    <div class="perspective group relative">
      <div
        ref="innerCard"
        class="relative overflow-hidden duration-150 group-hover:drop-shadow-lg"
      >
        <slot />
      </div>
    </div>
  </div>
</template>

<style scoped>
.perspective {
  perspective: 1500px;
}
</style>
