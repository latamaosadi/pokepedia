<script lang="ts" setup>
import {
  useElementSize,
  useEventListener,
  useMediaQuery,
  useMouseInElement,
  usePreferredReducedMotion,
  useRafFn,
  useScreenOrientation,
} from '@vueuse/core'
import { computed, reactive, ref, watch } from 'vue'
import type { IPokemon } from '@/types/pokemon'
import TypeBadge from './TypeBadge.vue'

const {
  pokemon,
  interactive = true,
  tilt = 0,
  roll = 0,
  gyro = false,
} = defineProps<{
  pokemon?: IPokemon
  interactive?: boolean
  tilt?: number
  roll?: number
  /** Tilt with the device's motion sensor (phones). */
  gyro?: boolean
}>()

const target = ref(null)
const { isOutside, elementX, elementY, elementWidth, elementHeight } =
  useMouseInElement(target)
const { width } = useElementSize(target)

const reducedMotion = usePreferredReducedMotion()
const loadedSrc = ref<string>()

// Phones fire a fake mousemove after each tap, which would leave the card stuck
// "hovered" and ignoring the gyro, so only real hover devices follow the pointer.
const canHover = useMediaQuery('(hover: hover)')
const hovered = computed(() => interactive && canHover.value && !isOutside.value)
const clamp = (value: number) => Math.min(1, Math.max(0, value))

// Degrees of tilt (relative to how the phone is held) for a full edge-to-edge sweep.
const GYRO_RANGE = 40
// How quickly "level" follows the way the phone is being held, per sensor event.
const GYRO_RECENTER = 0.01
const gyroGoal = ref<{ x: number; y: number }>()

type PermissionRequest = { requestPermission?: () => Promise<'granted' | 'denied'> }
const orientationEvent =
  typeof DeviceOrientationEvent === 'undefined'
    ? undefined
    : (DeviceOrientationEvent as unknown as PermissionRequest)
// iOS only delivers orientation events after a user-initiated permission prompt.
// Chrome exposes the same API but sends events anyway; the button hides once they arrive.
const needsGyroPermission = ref(
  gyro &&
    typeof orientationEvent?.requestPermission === 'function' &&
    matchMedia('(hover: none)').matches,
)

async function enableGyro() {
  needsGyroPermission.value = false
  await orientationEvent?.requestPermission?.().catch(() => 'denied')
}

if (gyro) {
  const { angle } = useScreenOrientation()
  let level: { h: number; v: number } | undefined

  // Raw events rather than useDeviceOrientation refs: a steady reading must still recenter.
  useEventListener('deviceorientation', ({ beta: b, gamma: g }: DeviceOrientationEvent) => {
    if (b == null || g == null) return
    // Map device axes to screen axes so landscape tilts the right way.
    // ponytail: verified in portrait only; check landscape on a real device.
    const [h, v] =
      angle.value === 90
        ? [b, -g]
        : angle.value === 270 || angle.value === -90
          ? [-b, g]
          : angle.value === 180
            ? [-g, -b]
            : [g, b]
    level ??= { h, v }
    level.h += (h - level.h) * GYRO_RECENTER
    level.v += (v - level.v) * GYRO_RECENTER
    gyroGoal.value = {
      x: clamp(0.5 + (h - level.h) / GYRO_RANGE),
      y: clamp(0.5 + (v - level.v) / GYRO_RANGE),
    }
  })
}

// Where the "light" points on the card (0..1) and how lifted it is (0..1).
const goal = computed(() => {
  if (!interactive) return { x: tilt + 0.5, y: 0.5 - roll, lift: 1 }
  if (reducedMotion.value === 'reduce') return { x: 0.5, y: 0.5, lift: 0 }
  if (hovered.value)
    return {
      x: clamp(elementX.value / elementWidth.value),
      y: clamp(elementY.value / elementHeight.value),
      lift: 1,
    }
  if (gyroGoal.value) return { ...gyroGoal.value, lift: 1 }
  return { x: 0.5, y: 0.5, lift: 0 }
})

// Damped spring so every layer follows the pointer together, with a little
// overshoot on release instead of a flat ease.
const STIFFNESS = 0.09
const DAMPING = 0.74
const state = reactive({ ...goal.value, vx: 0, vy: 0, vlift: 0 })

const { pause, resume } = useRafFn(
  ({ delta }) => {
    const dt = Math.min(delta / 16.67, 3)
    const keys = [
      ['x', 'vx'],
      ['y', 'vy'],
      ['lift', 'vlift'],
    ] as const
    let moving = false
    for (const [key, velocity] of keys) {
      state[velocity] += (goal.value[key] - state[key]) * STIFFNESS * dt
      state[velocity] *= DAMPING ** dt
      state[key] += state[velocity] * dt
      if (Math.abs(goal.value[key] - state[key]) > 0.001 || Math.abs(state[velocity]) > 0.001)
        moving = true
    }
    if (!moving) {
      Object.assign(state, goal.value)
      pause()
    }
  },
  { immediate: false },
)

watch(goal, (value) => {
  if (reducedMotion.value === 'reduce') Object.assign(state, value)
  else resume()
})

const cardVars = computed(() => {
  const dx = state.x - 0.5
  const dy = state.y - 0.5
  return {
    '--x': state.x,
    '--y': state.y,
    '--dx': dx,
    '--dy': dy,
    '--lift': state.lift,
    '--hyp': Math.min(1, Math.hypot(dx, dy) * 2),
  }
})
</script>

<template>
  <div ref="target" class="group perspective-midrange">
    <div
      :class="['card relative aspect-[3/4] rounded-[0.75em]', { 'z-30': hovered }]"
      :style="[cardVars, `--card-color: var(--color-poke-${pokemon?.color})`]"
    >
      <div
        class="card-face absolute inset-0 overflow-hidden rounded-[inherit] bg-(--card-color)"
      >
        <div class="absolute inset-0 bg-white/40"></div>
        <div class="card-pattern absolute inset-0"></div>
        <div class="card-orb absolute"></div>
        <div class="card-holo absolute inset-0"></div>
        <div class="card-glare absolute inset-0"></div>

        <div class="absolute inset-x-0 top-0 p-2">
          <h2
            class="font-inter text-left leading-none font-black text-white drop-shadow-sm"
            :style="`font-size: ${width / 7.5}px;`"
          >
            {{ pokemon?.formattedName }}
          </h2>
        </div>
        <div class="absolute inset-x-0 bottom-0 flex items-end justify-between gap-1 px-2">
          <h2
            class="font-inter shrink-0 text-left font-black text-white drop-shadow-sm"
            :style="`font-size: ${width / 7.5}px;`"
          >
            #{{ pokemon?.number }}
          </h2>
          <TypeBadge :types="pokemon?.types || []" class="mb-2 flex-wrap justify-end" />
        </div>
        <img
          :class="[
            'card-art absolute inset-0 mx-auto size-full object-contain object-center drop-shadow-lg transition-opacity duration-300',
            { 'opacity-0': loadedSrc !== pokemon?.artwork },
          ]"
          :key="pokemon?.artwork"
          :src="pokemon?.artwork"
          :alt="`${pokemon?.formattedName} Card`"
          loading="lazy"
          @load="loadedSrc = pokemon?.artwork"
        />
      </div>
    </div>
    <button
      v-if="needsGyroPermission && !gyroGoal"
      class="mx-auto mt-3 block rounded-full bg-white/80 px-4 py-1 text-sm font-bold text-neutral-700 shadow dark:bg-neutral-800/80 dark:text-neutral-200"
      @click="enableGyro"
    >
      Tilt to shine ✨
    </button>
  </div>
</template>

<style scoped>
.card {
  transform: rotateX(calc(var(--dy) * -20deg)) rotateY(calc(var(--dx) * 20deg))
    rotateZ(calc(var(--dx) * var(--dy) * 10deg)) scale(calc(1 + var(--lift) * 0.04));
  box-shadow: calc(var(--dx) * -24px) calc(var(--dy) * -24px + var(--lift) * 14px)
    calc(var(--lift) * 30px) rgb(38 38 38 / calc(var(--lift) * 0.4));
}

.card-face {
  filter: saturate(calc(1 + var(--lift) * 0.3));
}

.card-pattern {
  background:
    radial-gradient(circle at bottom left, var(--card-color) 35%, transparent 36%),
    radial-gradient(circle at top right, var(--card-color) 35%, transparent 36%),
    radial-gradient(circle at center, var(--card-color) 15%, transparent 16%);
  background-size: 20% 15%;
  background-position: calc(var(--dx) * 40px) calc(var(--dy) * 40px);
  opacity: calc(0.1 + var(--lift) * 0.2);
}

.card-orb {
  width: 400px;
  height: 400px;
  left: calc(var(--x) * 100%);
  top: calc(var(--y) * 100%);
  translate: -50% -50%;
  border-radius: 50%;
  background: var(--card-color);
  filter: blur(100px);
  mix-blend-mode: darken;
  opacity: calc(var(--lift) * 0.6);
}

/* Rainbow foil: sweeps across as the card tilts, strongest toward the edges. */
.card-holo {
  background-image: repeating-linear-gradient(
    110deg,
    hsl(0 90% 65%) 0%,
    hsl(45 90% 65%) 5%,
    hsl(140 80% 60%) 10%,
    hsl(195 90% 65%) 15%,
    hsl(265 85% 70%) 20%,
    hsl(320 85% 65%) 25%,
    hsl(0 90% 65%) 30%
  );
  background-size: 400% 400%;
  background-position: calc(var(--x) * 100%) calc(var(--y) * 100%);
  mix-blend-mode: overlay;
  opacity: calc(var(--lift) * (0.3 + var(--hyp) * 0.35));
}

.card-glare {
  background-image: radial-gradient(
    farthest-corner circle at calc(var(--x) * 100%) calc(var(--y) * 100%),
    hsl(0 0% 100% / 0.55) 0%,
    hsl(0 0% 100% / 0.15) 25%,
    transparent 55%
  );
  mix-blend-mode: soft-light;
  opacity: var(--lift);
}

.card-art {
  transform: translate(calc(var(--dx) * -14px), calc(var(--dy) * -14px))
    scale(calc(1 + var(--lift) * 0.25));
}
</style>
