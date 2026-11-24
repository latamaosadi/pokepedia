<script setup lang="ts">
import { measureBounds, sizeScale, TRAINER_HEIGHT, type Bounds } from '@/utils/size-compare'
import { useElementSize } from '@vueuse/core'
import { computed, ref, watch } from 'vue'

const { name, height, artwork } = defineProps<{
  name: string
  /** In metres. */
  height: number
  artwork: string
}>()

const BOX_HEIGHT = 180
// Room the trainer's column (mostly its label) and the gap take up beside the Pokémon.
const TRAINER_COLUMN = 120
const GAP = 40

// undefined while measuring; null if the artwork couldn't be measured.
const bounds = ref<Bounds | null>()
watch(
  () => artwork,
  async (url) => {
    bounds.value = undefined
    const measuredBounds = await measureBounds(url)
    if (url === artwork) bounds.value = measuredBounds
  },
  { immediate: true },
)

const container = ref<HTMLElement>()
const { width: available } = useElementSize(container)
const visible = computed(() => bounds.value ?? { top: 0, bottom: 1, left: 0, right: 1 })

// The drawing's height: shrunk, trainer included, when a wide Pokémon (Wailord) wouldn't
// fit beside the trainer on a narrow screen.
const boxHeight = computed(() => {
  const { pokemon } = sizeScale(height, BOX_HEIGHT)
  const { top, bottom, left, right } = visible.value
  const artWidth = (pokemon * (right - left)) / (bottom - top)
  const room = available.value - TRAINER_COLUMN - GAP
  return available.value > 0 && artWidth > room ? BOX_HEIGHT * Math.max(room, 1) / artWidth : BOX_HEIGHT
})

const scale = computed(() => sizeScale(height, boxHeight.value))

// Scales the artwork so its visible part (not its transparent margins) is exactly the
// Pokémon's height, and crops the box to that visible part.
const art = computed(() => {
  const size = scale.value.pokemon / (visible.value.bottom - visible.value.top)
  return {
    box: {
      height: `${scale.value.pokemon}px`,
      width: `${size * (visible.value.right - visible.value.left)}px`,
    },
    image: {
      width: `${size}px`,
      height: `${size}px`,
      left: `${-visible.value.left * size}px`,
      top: `${-visible.value.top * size}px`,
    },
  }
})

const description = computed(
  () => `${name} is ${height} m tall, shown next to a ${TRAINER_HEIGHT} m trainer.`,
)
</script>

<template>
  <div ref="container">
    <figure
      role="img"
      :aria-label="description"
      class="grid w-fit max-w-full grid-cols-[auto_auto] justify-center gap-x-10 overflow-hidden"
    >
      <div class="flex items-end justify-center" :style="{ height: `${boxHeight}px` }">
        <svg
          viewBox="0 2 40 98"
          class="w-auto fill-neutral-400 dark:fill-neutral-500"
          :style="{ height: `${scale.trainer}px` }"
          aria-hidden="true"
        >
          <circle cx="20" cy="10" r="8" />
          <path
            d="M8 22h24a4 4 0 0 1 4 4v26a3 3 0 0 1-6 0V34h-1v62a4 4 0 0 1-8 0V60h-2v36a4 4 0 0 1-8 0V34H10v18a3 3 0 0 1-6 0V26a4 4 0 0 1 4-4z"
          />
        </svg>
      </div>
      <div class="flex items-end justify-center" :style="{ height: `${boxHeight}px` }">
        <div class="relative transition-opacity" :class="{ 'opacity-0': bounds === undefined }" :style="art.box">
          <img :src="artwork" alt="" class="absolute max-w-none" :style="art.image" />
        </div>
      </div>
      <div class="col-span-2 mt-0.5 border-t-2 border-neutral-300 dark:border-neutral-600"></div>
      <figcaption class="contents">
        <span
          class="font-pixel mt-1 text-center text-lg whitespace-nowrap text-neutral-500 dark:text-neutral-400"
        >
          Trainer · {{ TRAINER_HEIGHT }} m
        </span>
        <span class="font-pixel mt-1 text-center text-lg">{{ name }} · {{ height }} m</span>
      </figcaption>
    </figure>
  </div>
</template>
