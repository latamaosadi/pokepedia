<script lang="ts" setup>
import { useElementBounding, useElementSize, useScroll } from '@vueuse/core'
import { computed, onMounted, ref, watch, type CSSProperties } from 'vue'

const { container } = defineProps<{
  container: HTMLElement | null
}>()

const emit = defineEmits(['select'])

const { top: containerTop, height: containerHeight } =
  useElementBounding(container)
const { y: containerVerticalScroll } = useScroll(container)
const itemEl = ref(null)
const { top, height } = useElementBounding(itemEl)

const scrollHeight = computed(() => {
  // @ts-expect-error containerEl is actually a component not a HTMLElement
  return (container.totalSize as number) - (containerHeight.value - 32)
})

const topScroll = computed(
  () => top.value + height.value / 2 - containerTop.value,
)

const selectionLine = computed(() => {
  const containerMiddlePoint = containerHeight.value / 2
  const elementMiddlePoint = height.value / 2 + 16
  if (containerVerticalScroll.value < containerMiddlePoint - elementMiddlePoint)
    return containerVerticalScroll.value + elementMiddlePoint
  else if (
    containerVerticalScroll.value >
    scrollHeight.value - containerMiddlePoint + elementMiddlePoint
  )
    return (
      containerMiddlePoint +
      (containerMiddlePoint -
        (scrollHeight.value - containerVerticalScroll.value)) -
      elementMiddlePoint
    )
  else return containerMiddlePoint
})

const distance = computed(() => {
  const middlePoint = selectionLine.value
  return Math.abs(topScroll.value - middlePoint) / containerHeight.value
})

const selected = computed(() => {
  const startBoundary = top.value - containerTop.value
  const endBoundary = startBoundary + height.value + 17
  const middlePoint = selectionLine.value
  return startBoundary < middlePoint && endBoundary > middlePoint
})

watch(
  () => selected.value,
  (value) => {
    if (value) {
      emit('select')
    }
  },
)

const scale = computed(() => {
  const calculatedScale = 1.4 - distance.value * 0.9
  return calculatedScale < 0.5 ? 0.5 : calculatedScale
})

const opacity = computed(() => {
  const calculatedOpacity = 1 - distance.value * 0.8
  return calculatedOpacity < 0.2 ? 0.2 : calculatedOpacity
})

const itemStyle = computed((): CSSProperties => {
  return {
    transform: `scale(${scale.value}) translateZ(0)`,
    transformOrigin: 'center left',
    willChange: 'transform',
    opacity: opacity.value,
  }
})
</script>

<template>
  <div ref="itemEl">
    <slot
      :style="itemStyle"
      :selected
      :distance
      :selectionLine
      :containerVerticalScroll
      :containerTop
      :scale
      :topScroll
      :top="top - containerTop"
    />
  </div>
</template>
