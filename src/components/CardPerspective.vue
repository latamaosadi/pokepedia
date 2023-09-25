<script setup lang="ts">
import { useMouseInElement } from '@vueuse/core'
import { ref, watch, onMounted } from 'vue'

interface IRotation {
  x: number
  y: number
  z: number
}

const props = withDefaults(
  defineProps<{
    interactive?: boolean
    rotation?: IRotation
    resetOnHover?: boolean
  }>(),
  {
    interactive: true,
    rotation: () => ({ x: 0, y: 0, z: 0 }),
    resetOnHover: false,
  },
)

const card = ref<HTMLElement | null>(null)
const innerCard = ref<HTMLElement | null>(null)
const { elementX, elementY, isOutside, elementWidth, elementHeight } =
  useMouseInElement(card, {
    handleOutside: false,
    touch: false,
  })

onMounted(() => {
  animateCard(props.rotation)
})

watch([elementX, elementY, isOutside], ([pointX, pointY, outsideEl]) => {
  if (!props.interactive) {
    return
  }
  if (outsideEl) {
    animateCard(props.rotation)
    return
  }
  if (props.resetOnHover) {
    animateCard({ x: 0, y: 0, z: 0 }, 600)
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
  animateCard({ x: rotateX, y: rotateY, z: rotateZ })
})

function animateCard(rotation: IRotation, duration = 300) {
  if (!innerCard.value?.animate) {
    return
  }

  innerCard.value.animate(
    {
      'will-change': 'transform',
      transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) rotateZ(${rotation.z}deg)`,
    },
    { duration, fill: 'forwards' },
  )
}
</script>
<template>
  <div ref="card" class="perspective relative">
    <div ref="innerCard">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.perspective {
  perspective: 1500px;
}
</style>
