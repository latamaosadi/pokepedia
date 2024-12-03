<script lang="ts" setup>
import { useElementBounding } from '@vueuse/core'
import { computed, ref, watch, type CSSProperties } from 'vue'

const { container } = defineProps<{
  container: HTMLElement | null
}>()

const emit = defineEmits(['select'])

const { top: containerTop, height: containerHeight } = useElementBounding(container)
const itemEl = ref(null)
const { top, height } = useElementBounding(itemEl)

const selected = computed(() => {
  const startBoundary = top.value - containerTop.value - 13.5
  const endBoundary = startBoundary + height.value + 13.5
  const middlePoint = containerHeight.value / 2
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

const topScroll = computed(() => top.value + height.value / 2 - containerTop.value)
const distance = computed(() => {
  const middlePoint = containerHeight.value / 2
  return ((middlePoint - Math.abs(topScroll.value - middlePoint)) / middlePoint) * 0.7
})

const itemStyle = computed((): CSSProperties => {
  return {
    transition: '.150s ease-out all',
    transform:
      topScroll.value < 0 || topScroll.value > containerHeight.value
        ? 'scale(0.7)'
        : `scale(${0.7 + distance.value})`,
    transformOrigin: 'center left',
    'z-index': selected.value ? 10 : 0,
    position: selected.value ? 'relative' : 'unset',
  }
})
</script>

<template>
  <div ref="itemEl">
    <slot :style="itemStyle" :selected />
  </div>
</template>
