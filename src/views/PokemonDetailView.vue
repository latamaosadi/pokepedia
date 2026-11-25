<script lang="ts">
import type { IPokemonInfo as Info } from '@/types/pokemon'
import { getPokemonInfo } from '@/services/pokemon'

// Detail data by route id, kept for the session so revisits and prefetched
// neighbours show instantly (a swipe lands on a ready page, not "Loading…").
const infoRequests = new Map<string, Promise<Info>>()
const loadedInfo = new Map<string, Info>()

function fetchInfo(id: string) {
  let request = infoRequests.get(id)
  if (!request) {
    request = getPokemonInfo(id).then((data) => {
      loadedInfo.set(id, data)
      return data
    })
    request.catch(() => infoRequests.delete(id))
    infoRequests.set(id, request)
  }
  return request
}
</script>

<script setup lang="ts">
import EvolutionChain from '@/components/EvolutionChain.vue'
import PokemonCard from '@/components/PokemonCard.vue'
import ShinyToggle from '@/components/ShinyToggle.vue'
import StatCalculator from '@/components/StatCalculator.vue'
import MoveList from '@/components/MoveList.vue'
import SizeComparison from '@/components/SizeComparison.vue'
import GameSelect from '@/components/GameSelect.vue'
import TypeBadge from '@/components/TypeBadge.vue'
import abilityData from '@/data/abilities.json'
import { lastListView } from '@/router'
import { TEAM_SIZE, usePokemonStore } from '@/stores/pokemon'
import type { IEvolutionChain, IPokemon, IPokemonInfo, PokemonType } from '@/types/pokemon'
import { artwork, defaultSprite } from '@/utils/sprite'
import { padNumber, titleCase } from '@/utils/string'
import { byVersion, evolutionIn, formInGeneration, formsIn, versionsIn } from '@/utils/game'
import { defensiveMatchups } from '@/utils/type-matchups'
import { foldPage, gradientFrom, polygonPath } from '@/utils/page-fold'
import {
  onKeyStroke,
  useEventListener,
  usePreferredReducedMotion,
  useLocalStorage,
  useRafFn,
  useTitle,
} from '@vueuse/core'
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const pokemonStore = usePokemonStore()
const id = computed(() => route.params.id as string | undefined)
const info = ref<IPokemonInfo>()
const error = ref<Error>()
const formId = ref<number>()
const main = ref<HTMLElement>()
const swipeEl = ref<HTMLElement>()

// Forms that exist in the selected game; picking another game can hide the chosen one.
const forms = computed(() => formsIn(info.value?.forms ?? [], pokemonStore.game))
const form = computed(() => forms.value.find((f) => f.id === formId.value) ?? forms.value[0])
// The selected game's generation, and the form's types, stats and abilities as they were then.
const generation = computed(() => pokemonStore.game?.generation)
const shown = computed(() => form.value && formInGeneration(form.value, generation.value))
// This Pokémon's entry in the selected game's Pokédex, if it's in it.
const dexEntry = computed(() => pokemonStore.dex.find((p) => p.number === info.value?.number))
// Moves come from the selected game, or the newest game this form has moves in.
const movesGame = computed(
  () =>
    pokemonStore.game ??
    [...pokemonStore.games].reverse().find((game) => form.value?.learnset[game.id]?.length),
)
const learnset = computed(() => (movesGame.value && form.value?.learnset[movesGame.value.id]) || [])
const dexEntries = computed(() => byVersion(info.value?.entries ?? {}, pokemonStore.games, pokemonStore.game))
// A game without items means none are held there, so only the National Dex falls back.
const heldItems = computed(() =>
  pokemonStore.game
    ? versionsIn(form.value?.heldItems ?? {}, pokemonStore.game)
    : byVersion(form.value?.heldItems ?? {}, pokemonStore.games).entries,
)
const evolutionLines = computed(() =>
  info.value?.evolutionChain
    ? evolutionIn(info.value.evolutionChain, pokemonStore.games, pokemonStore.game)
    : [],
)
// Lines branching at most in two (Wurmple) fit left to right; Eevee's eight need the grid.
const fitsInRow = (line: IEvolutionChain): boolean =>
  line.evolvesTo.length <= 2 && line.evolvesTo.every(fitsInRow)

// Sections of the page, one shown at a time. The choice is remembered so paging through
// Pokémon (or coming back later) stays on, say, Moves.
const selectedTab = useLocalStorage('pokedex/detail-tab', 'about')
const tabs = computed(() =>
  [
    { id: 'about', label: 'About' },
    { id: 'stats', label: 'Stats' },
    { id: 'moves', label: 'Moves', hidden: !movesGame.value },
    { id: 'evolution', label: 'Evolution', hidden: !info.value?.evolutionChain },
  ].filter((t) => !t.hidden),
)
const tab = computed(() => (tabs.value.some((t) => t.id === selectedTab.value) ? selectedTab.value : 'about'))
const panelId = (tab: string) => `detail-${tab}`
const card = computed((): IPokemon | undefined =>
  info.value && form.value
    ? {
        name: info.value.name,
        formattedName: form.value.name,
        number: info.value.number,
        sprite: form.value.sprite,
        artwork: artwork(form.value.id, pokemonStore.shiny),
        color: info.value.color,
        types: shown.value?.types,
      }
    : undefined,
)

// What each ability does (today's effect), shipped by `bun run update-data`.
const abilityEffects: Record<string, string> = abilityData
// PokeAPI cries are Ogg files, which not every browser can play.
const canPlayCry =
  typeof Audio !== 'undefined' && new Audio().canPlayType('audio/ogg; codecs=vorbis') !== ''
// Highest base stat in the games, so bars share one scale across Pokémon.
const MAX_BASE_STAT = 255
// Generation a mechanic arrived in, so older games don't list it.
const since = (first: number) => !generation.value || generation.value >= first
const training = computed(() =>
  [
    {
      label: 'EV yield',
      value: form.value?.evYield.map((stat) => `${stat.value} ${stat.name}`).join(', '),
      hidden: !since(3),
    },
    { label: 'Catch rate', value: info.value?.captureRate },
    { label: 'Base friendship', value: info.value?.baseFriendship, hidden: !since(2) },
    { label: 'Growth rate', value: info.value?.growthRate },
  ].filter((row) => !row.hidden && row.value != null && row.value !== ''),
)
const genderRatio = (femaleEighths: number) =>
  femaleEighths < 0
    ? 'Genderless'
    : `♂ ${((8 - femaleEighths) / 8) * 100}% · ♀ ${(femaleEighths / 8) * 100}%`
const statsTotal = computed(() => shown.value?.stats.reduce((sum, stat) => sum + stat.value, 0) ?? 0)

const matchups = computed(() =>
  defensiveMatchups(shown.value?.types.map((t) => t.name) ?? [], generation.value).map(({ multiplier, types }) => ({
    label: { 4: '4×', 2: '2×', 0.5: '½×', 0.25: '¼×', 0: '0×' }[multiplier],
    types: types.map((name) => ({ name: name as PokemonType })),
  })),
)

function playCry() {
  if (form.value?.cry) new Audio(form.value.cry).play().catch(() => {})
}

// Neighbours in the selected game's Pokédex, or by National number when there's no game
// selected or this Pokémon isn't in it.
function neighbour(offset: number) {
  if (!info.value) return undefined
  const { number } = info.value
  const index = pokemonStore.dex.findIndex((pokemon) => pokemon.number === number)
  const pokemon =
    index >= 0 ? pokemonStore.dex[index + offset] : pokemonStore.list[number + offset - 1]
  if (!pokemon) return undefined
  return {
    id: pokemon.name,
    name: pokemon.formattedName,
    number: pokemon.number,
    label: `#${padNumber(pokemon.dexNumber ?? pokemon.number)}`,
    sprite: defaultSprite(pokemon.number, pokemonStore.shiny),
  }
}
const previous = computed(() => neighbour(-1))
const next = computed(() => neighbour(1))

function go(target?: { id: string }) {
  return target && router.push({ name: 'dex.detail', params: { id: target.id } })
}

onKeyStroke(['ArrowLeft', 'ArrowRight'], (event) => {
  // Leave arrows to form controls, and Alt/⌘+← to the browser's back.
  if (event.altKey || event.metaKey || event.ctrlKey) return
  if (event.target instanceof Element && event.target.closest('input, select, textarea')) return
  go(event.key === 'ArrowLeft' ? previous.value : next.value)
})

// Swipe between Pokémon on touch screens, turning pages like paper. Swiping left folds this
// page over from its right edge towards the spine on the left, revealing the next Pokémon
// beneath; swiping right unfolds the previous Pokémon's page back over this one. Letting go past COMMIT_RATIO of the width (or
// with a flick) finishes the turn, anything less turns it back, so dragging back to the
// start cancels. The page being turned to is a stand-in (sprite, number, name) until the
// real one takes over, which is instant because neighbours are preloaded.
const COMMIT_RATIO = 0.3
const FLICK_SPEED = 0.5 // px per ms
const FULL_TURN_RATIO = 0.85 // share of the width a drag needs to turn the page fully
// Springs, per 60fps frame: the page trails the finger slightly while dragging, then
// carries its momentum into a soft landing once let go.
const DRAG_SPRING = { stiffness: 0.35, damping: 0.6 }
const RELEASE_SPRING = { stiffness: 0.1, damping: 0.75 }
const reducedMotion = usePreferredReducedMotion()
const swipe = reactive({
  x: 0, // where the finger wants the page
  dragging: false,
  animating: false,
  hingeX: 0, // the spine: the page's left edge, in viewport px
  contentTop: 0, // where the page content starts on screen, below the nav
  pageTop: 0, // the page element's top on screen (negative when scrolled)
  grabY: 0, // where the finger first touched
})
// Where the page is drawn; chases swipe.x on a spring.
const page = reactive({ x: 0, velocity: 0 })
let spring = DRAG_SPRING
let onArrive: (() => void) | undefined

const { pause: stopSpring, resume: runSpring } = useRafFn(
  ({ delta }) => {
    const dt = Math.min(delta / 16.67, 3)
    page.velocity += (swipe.x - page.x) * spring.stiffness * dt
    page.velocity *= spring.damping ** dt
    page.x += page.velocity * dt
    const near = Math.abs(swipe.x - page.x) < 2
    if (near && onArrive) {
      const arrived = onArrive
      onArrive = undefined
      arrived()
    }
    if (near && Math.abs(page.velocity) < 0.3) {
      page.x = swipe.x
      page.velocity = 0
      stopSpring()
    }
  },
  { immediate: false },
)
watch(() => swipe.x, () => runSpring())

type Neighbour = NonNullable<ReturnType<typeof neighbour>>
// Kept for the whole turn, since `next`/`previous` change as soon as navigation happens.
const turningTo = ref<Neighbour & { side: 'next' | 'previous' }>()
const handingOver = ref(false)

function placeHinge() {
  if (main.value) swipe.hingeX = main.value.getBoundingClientRect().left
  if (!swipeEl.value) return
  swipe.pageTop = swipeEl.value.getBoundingClientRect().top
  swipe.contentTop = Math.max(0, swipe.pageTop)
}
let touch: { x: number; y: number; axis?: 'x' | 'y'; lastX: number; lastT: number; speed: number } | undefined

const swipeTarget = (dx: number) => (dx < 0 ? next.value : previous.value)
const pageWidth = () => main.value?.clientWidth || window.innerWidth
// How far the page has turned: 0 flat, 1 fully over.
const turned = computed(() => Math.min(Math.abs(page.x) / (pageWidth() * FULL_TURN_RATIO), 1))
// Peaks mid-turn, when the lifted paper casts the strongest shadow.
const midTurn = computed(() => Math.sin(turned.value * Math.PI))

useEventListener(
  main,
  'touchstart',
  (event: TouchEvent) => {
    if (event.touches.length !== 1 || swipe.animating) return
    const { clientX: x, clientY: y } = event.touches[0]
    touch = { x, y, lastX: x, lastT: event.timeStamp, speed: 0 }
    swipe.grabY = y
    spring = DRAG_SPRING
    placeHinge()
  },
  { passive: true },
)

useEventListener(
  main,
  'touchmove',
  (event: TouchEvent) => {
    if (!touch) return
    const { clientX, clientY } = event.touches[0]
    const dx = clientX - touch.x
    const dy = clientY - touch.y
    // The first few pixels decide whether this is a swipe or a vertical scroll.
    if (!touch.axis && Math.hypot(dx, dy) > 10) touch.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'
    if (touch.axis !== 'x') return
    const elapsed = event.timeStamp - touch.lastT
    if (elapsed > 0) touch.speed = (clientX - touch.lastX) / elapsed
    touch.lastX = clientX
    touch.lastT = event.timeStamp
    swipe.dragging = true
    const target = swipeTarget(dx)
    // Resist where there's no Pokémon to go to.
    swipe.x = target ? dx : dx * 0.25
    const side = dx < 0 ? 'next' : 'previous'
    if (!target || reducedMotion.value === 'reduce') turningTo.value = undefined
    else if (turningTo.value?.id !== target.id) turningTo.value = { ...target, side }
  },
  { passive: true },
)

function endSwipe() {
  if (!touch) return
  const dx = swipe.x
  const flicked = Math.abs(touch.speed) > FLICK_SPEED && Math.sign(touch.speed) === Math.sign(dx)
  touch = undefined
  if (!swipe.dragging) return
  swipe.dragging = false
  const width = pageWidth()
  const target = swipeTarget(dx)
  const commit = target && (Math.abs(dx) > width * COMMIT_RATIO || (flicked && Math.abs(dx) > 40))

  if (reducedMotion.value === 'reduce') {
    swipe.x = 0
    page.x = 0
    if (commit) go(target)
    return
  }
  // From here the page keeps whatever momentum the finger gave it.
  spring = RELEASE_SPRING
  swipe.animating = true
  if (!commit) {
    swipe.x = 0
    onArrive = () => {
      swipe.animating = false
      turningTo.value = undefined
    }
    return
  }
  // Finish the turn, then switch to the real page underneath the stand-in.
  const direction = Math.sign(dx)
  swipe.x = direction * width * FULL_TURN_RATIO
  onArrive = async () => {
    await go(target)
    await nextTick()
    window.scrollTo({ top: 0 })
    stopSpring()
    swipe.x = 0
    page.x = 0
    page.velocity = 0
    swipe.animating = false
    if (direction < 0) {
      // The turned page is gone; the next one was beneath it all along.
      turningTo.value = undefined
      return
    }
    // The previous page lies flat over the real one; fade it to hand over.
    handingOver.value = true
    setTimeout(() => {
      turningTo.value = undefined
      handingOver.value = false
    }, 150)
  }
}
useEventListener(main, 'touchend', endSwipe, { passive: true })
useEventListener(main, 'touchcancel', endSwipe, { passive: true })

const MAX_TILT = 0.35 // radians the fold leans when the page is grabbed at its top or bottom

// The fold for the turning sheet (this page going forward, the previous page coming back),
// in viewport px. It runs through the height where the page was grabbed and leans with it:
// grabbed low, the page peels from the bottom corner; high, from the top. The lean peaks
// mid-turn and is gone when the page lies flat or reaches the spine.
const fold = computed(() => {
  const left = swipe.hingeX
  const width = pageWidth()
  const top = swipe.contentTop
  const bottom = window.innerHeight
  const t = turningTo.value?.side === 'previous' ? 1 - turned.value : turned.value
  const grab = Math.max(-1, Math.min(1, (swipe.grabY - (top + bottom) / 2) / ((bottom - top) / 2)))
  const angle = -grab * MAX_TILT * Math.sin(t * Math.PI)
  const through = { x: left + width - t * width, y: swipe.grabY }
  return { ...foldPage({ left, right: left + width, top, bottom }, through, angle), through }
})

// The back of the paper, shaded like a sheet rolling over: a bright rim where it bends at
// the fold, darker through the curve, lighter again, then shaded at its free edge.
const flapStyle = computed(() => {
  const { flap, normal, through } = fold.value
  const towardsSpine = { x: -normal.x, y: -normal.y }
  return {
    clipPath: polygonPath(flap),
    backgroundImage: gradientFrom(through, towardsSpine, window.innerWidth, window.innerHeight, [
      [0, 'rgb(255 255 255 / 0.95)'],
      [5, 'rgb(255 255 255 / 0.45)'],
      [40, 'rgb(0 0 0 / 0.02)'],
      [130, 'rgb(0 0 0 / 0.12)'],
      [240, 'rgb(0 0 0 / 0.04)'],
      [420, 'rgb(0 0 0 / 0.14)'],
    ]),
  }
})

// The flap's shadow on the front it lies on; drop-shadow because the flap is clipped.
const flapShadow = computed(() => {
  const { normal } = fold.value
  return `drop-shadow(${-8 * normal.x}px ${-8 * normal.y}px 12px rgb(0 0 0 / ${0.35 * midTurn.value}))`
})

// Soft shadow the lifted paper casts on the page beneath, just past the fold.
const foldShadowStyle = computed(() => {
  const { normal, through } = fold.value
  const strength = midTurn.value
  const right = window.innerWidth - (swipe.hingeX + pageWidth())
  return {
    // Only on the page, not over the nav bar or the side margins.
    clipPath: `inset(${swipe.contentTop}px ${right}px 0 ${swipe.hingeX}px)`,
    backgroundImage: gradientFrom(through, normal, window.innerWidth, window.innerHeight, [
      [-1, 'transparent'],
      [0, `rgb(0 0 0 / ${0.3 * strength})`],
      [30, `rgb(0 0 0 / ${0.1 * strength})`],
      [90, 'transparent'],
    ]),
  }
})

const swipeStyle = computed(() => {
  if (turningTo.value?.side === 'next') {
    const pageOrigin = { x: swipe.hingeX, y: swipe.pageTop }
    return { clipPath: polygonPath(fold.value.front, pageOrigin), zIndex: 10 }
  }
  // Nothing to turn to (first or last Pokémon): the page just budges.
  if (!turningTo.value && page.x && reducedMotion.value !== 'reduce') {
    return { transform: `translateX(${page.x}px)` }
  }
  return undefined
})

const coverStyle = computed(() => {
  if (turningTo.value?.side !== 'previous') return undefined
  const clipPath = polygonPath(fold.value.front)
  if (handingOver.value) return { clipPath, opacity: 0, transition: 'opacity 150ms ease-out' }
  return { clipPath }
})

// Same format as the prerendered page (scripts/seo-pages.ts): name, number and types.
useTitle(() => {
  if (!info.value) return 'Poképedia'
  const types = (info.value.forms[0]?.types ?? []).map((t) => titleCase(t.name)).join('/')
  return `${info.value.formattedName} (#${padNumber(info.value.number)}) · ${types} · Poképedia`
})

function show(data: IPokemonInfo) {
  info.value = data
  formId.value = data.forms[0]?.id
  // Warm up the neighbours so swiping or stepping to them is instant.
  for (const neighbourPokemon of [previous.value, next.value]) {
    if (neighbourPokemon) fetchInfo(neighbourPokemon.id).catch(() => {})
  }
}

async function load(requested: string) {
  error.value = undefined
  const cached = loadedInfo.get(requested)
  if (cached) return show(cached)
  info.value = undefined
  try {
    const data = await fetchInfo(requested)
    if (id.value === requested) show(data)
  } catch (e) {
    if (id.value === requested) error.value = e as Error
  }
}

watch(id, (value) => value && load(value), { immediate: true })
</script>

<template>
  <main ref="main" class="touch-pan-y text-neutral-800 dark:text-neutral-100">
    <nav
      class="relative z-20 mb-4 flex items-center justify-between gap-2"
      aria-label="Pokémon navigation"
    >
      <RouterLink
        :to="{ name: lastListView }"
        class="shrink-0 rounded font-bold whitespace-nowrap outline-none hover:underline focus-visible:ring-4 focus-visible:ring-blue-400"
      >
        {{ { dex: '← Pokédex', team: '← Team', home: '← All Pokémon' }[lastListView] }}
      </RouterLink>
      <div class="flex gap-2">
        <RouterLink
          v-if="previous"
          :to="{ name: 'dex.detail', params: { id: previous.id } }"
          :aria-label="`Previous: ${previous.name}`"
          class="inline-flex items-center gap-1 rounded-full bg-white py-1 pr-3 pl-2 text-sm font-bold shadow-sm outline-none hover:bg-neutral-50 focus-visible:ring-4 focus-visible:ring-blue-400 dark:bg-neutral-800 dark:hover:bg-neutral-700"
        >
          ‹
          <img
            :src="previous.sprite"
            alt=""
            width="96"
            height="96"
            class="-my-2 size-9 [image-rendering:pixelated]"
          />
          {{ previous.label }}
          <span v-if="previous.name" class="hidden sm:inline">{{ previous.name }}</span>
        </RouterLink>
        <RouterLink
          v-if="next"
          :to="{ name: 'dex.detail', params: { id: next.id } }"
          :aria-label="`Next: ${next.name}`"
          class="inline-flex items-center gap-1 rounded-full bg-white py-1 pr-2 pl-3 text-sm font-bold shadow-sm outline-none hover:bg-neutral-50 focus-visible:ring-4 focus-visible:ring-blue-400 dark:bg-neutral-800 dark:hover:bg-neutral-700"
        >
          <span v-if="next.name" class="hidden sm:inline">{{ next.name }}</span>
          {{ next.label }}
          <img
            :src="next.sprite"
            alt=""
            width="96"
            height="96"
            class="-my-2 size-9 [image-rendering:pixelated]"
          />
          ›
        </RouterLink>
      </div>
    </nav>

    <div
      ref="swipeEl"
      class="relative bg-neutral-100 dark:bg-neutral-700"
      :style="swipeStyle"
    >
      <div
        v-if="error"
        role="alert"
        class="flex items-center justify-between gap-4 rounded-xl bg-red-100 p-4 text-red-800"
      >
        <span v-if="error.message.startsWith('404')">There's no Pokémon called “{{ id }}”.</span>
        <span v-else>Couldn't load this Pokémon. Check your connection and try again.</span>
        <button
          v-if="!error.message.startsWith('404')"
          class="rounded-lg bg-red-700 px-3 py-1 font-bold text-white"
          @click="id && load(id)"
        >
          Retry
        </button>
      </div>

      <p v-else-if="!info" class="font-pixel text-2xl" aria-busy="true">Loading…</p>

      <div v-else class="grid items-start gap-8 md:grid-cols-[minmax(0,20rem)_1fr]">
        <PokemonCard :pokemon="card" :shiny="pokemonStore.shiny" gyro class="mx-auto w-full max-w-xs" />

        <div class="min-w-0 space-y-6">
          <header>
            <GameSelect class="mb-3" />
            <p class="font-bold text-neutral-500 dark:text-neutral-400">
              #{{ padNumber(info.number) }}
              <template v-if="pokemonStore.game">
                ·
                <template v-if="dexEntry?.dexNumber !== undefined">
                  {{ pokemonStore.game.name }}
                  <template v-if="dexEntry.dexName">({{ dexEntry.dexName }})</template>
                  #{{ padNumber(dexEntry.dexNumber) }}
                </template>
                <template v-else>Not in {{ pokemonStore.game.name }}'s Pokédex</template>
              </template>
            </p>
            <div class="flex flex-wrap items-center gap-3">
              <h1 class="font-inter text-4xl font-black">{{ info.formattedName }}</h1>
              <button
                v-if="canPlayCry && form?.cry"
                class="rounded-full bg-white px-3 py-1 text-sm font-bold shadow-sm outline-none hover:bg-neutral-50 focus-visible:ring-4 focus-visible:ring-blue-400 dark:bg-neutral-800 dark:hover:bg-neutral-700"
                :aria-label="`Play ${form.name}'s cry`"
                @click="playCry"
              >
                🔊 Cry
              </button>
              <button
                type="button"
                :aria-pressed="pokemonStore.isFavorite(info.number)"
                :class="[
                  'rounded-full px-3 py-1 text-sm font-bold shadow-sm outline-none focus-visible:ring-4 focus-visible:ring-blue-400',
                  pokemonStore.isFavorite(info.number)
                    ? 'bg-rose-600 text-white'
                    : 'bg-white hover:bg-neutral-50 dark:bg-neutral-800 dark:hover:bg-neutral-700',
                ]"
                @click="pokemonStore.toggleFavorite(info.number)"
              >
                {{ pokemonStore.isFavorite(info.number) ? '★' : '☆' }} Favorite
              </button>
              <button
                type="button"
                :aria-pressed="pokemonStore.inTeam(info.number)"
                :disabled="!pokemonStore.inTeam(info.number) && pokemonStore.team.length >= TEAM_SIZE"
                :title="
                  !pokemonStore.inTeam(info.number) && pokemonStore.team.length >= TEAM_SIZE
                    ? 'Your team is full'
                    : undefined
                "
                class="rounded-full bg-white px-3 py-1 text-sm font-bold shadow-sm outline-none hover:bg-neutral-50 focus-visible:ring-4 focus-visible:ring-blue-400 disabled:opacity-50 aria-pressed:bg-neutral-800 aria-pressed:text-white dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:aria-pressed:bg-neutral-100 dark:aria-pressed:text-neutral-900"
                @click="pokemonStore.toggleTeam(info.number)"
              >
                {{ pokemonStore.inTeam(info.number) ? '✓ In team' : '+ Team' }}
              </button>
              <ShinyToggle />
            </div>
            <p class="font-pixel text-xl">{{ info.genus }}</p>
          </header>

          <label v-if="forms.length > 1" class="block">
            <span class="mb-1 block font-bold">Form</span>
            <select
              :value="form?.id"
              @change="formId = Number(($event.target as HTMLSelectElement).value)"
              class="select-chevron w-full max-w-xs rounded-lg bg-white py-2 pr-10 pl-3 dark:bg-neutral-800"
            >
              <option v-for="f in forms" :key="f.id" :value="f.id">{{ f.name }}</option>
            </select>
          </label>

          <div
            role="group"
            aria-label="Sections"
            class="flex max-w-md rounded-lg bg-white p-1 text-sm font-bold shadow-sm dark:bg-neutral-800"
          >
            <button
              v-for="t in tabs"
              :key="t.id"
              type="button"
              :aria-pressed="t.id === tab"
              :aria-controls="panelId(t.id)"
              class="flex-1 rounded-md px-1 py-1.5 text-neutral-600 sm:px-2 outline-none hover:text-neutral-900 focus-visible:ring-4 focus-visible:ring-blue-400 aria-pressed:bg-neutral-800 aria-pressed:text-white dark:text-neutral-300 dark:hover:text-white dark:aria-pressed:bg-neutral-100 dark:aria-pressed:text-neutral-900"
              @click="selectedTab = t.id"
            >
              {{ t.label }}
            </button>
          </div>

          <div v-if="tab === 'about'" :id="panelId('about')" class="space-y-6">
            <section aria-label="Pokédex entry" class="space-y-2">
              <p
                v-if="pokemonStore.game && dexEntries.game !== pokemonStore.game"
                class="text-sm text-neutral-500 dark:text-neutral-400"
              >
                No entry for {{ pokemonStore.game.name }}.
              </p>
              <figure
                v-for="entry in dexEntries.entries"
                :key="entry.value"
                class="rounded-md border-2 border-dashed p-3"
                :style="`border-color: var(--color-poke-${info.color})`"
              >
                <figcaption class="text-sm font-bold text-neutral-500 dark:text-neutral-400">
                  {{ entry.versions.join(' / ') }}
                </figcaption>
                <p class="font-pixel text-xl">{{ entry.value }}</p>
              </figure>
              <p
                v-if="!dexEntries.entries.length"
                class="font-pixel rounded-md border-2 border-dashed p-3 text-xl"
                :style="`border-color: var(--color-poke-${info.color})`"
              >
                No info yet
              </p>
            </section>

            <dl class="font-pixel grid max-w-xs grid-cols-2 gap-2 text-xl">
              <div>
                <dt class="text-neutral-500 dark:text-neutral-400">Height</dt>
                <dd>{{ form?.height }}</dd>
              </div>
              <div>
                <dt class="text-neutral-500 dark:text-neutral-400">Weight</dt>
                <dd>{{ form?.weight }}</dd>
              </div>
            </dl>

            <section v-if="form && card?.artwork">
              <h2 class="font-inter mb-2 text-2xl font-black">Size</h2>
              <SizeComparison
                :name="form.name"
                :height="form.heightMeters"
                :shape="info.shape"
                :artwork="card.artwork"
              />
            </section>

            <section v-if="shown?.abilities.length">
              <h2 class="font-inter mb-2 text-2xl font-black">Abilities</h2>
              <dl class="max-w-md space-y-2">
                <div
                  v-for="ability in shown.abilities"
                  :key="ability.name"
                  class="rounded-lg bg-white px-3 py-2 shadow-sm dark:bg-neutral-800"
                >
                  <dt class="font-pixel text-xl">
                    {{ ability.name }}
                    <span v-if="ability.hidden" class="text-neutral-500 dark:text-neutral-400">
                      (hidden)
                    </span>
                  </dt>
                  <dd class="text-sm">{{ abilityEffects[ability.id] }}</dd>
                </div>
              </dl>
            </section>

            <section v-if="since(2)">
              <h2 class="font-inter mb-2 text-2xl font-black">Breeding</h2>
              <dl class="font-pixel grid max-w-md grid-cols-2 gap-2 text-xl">
                <div>
                  <dt class="text-neutral-500 dark:text-neutral-400">Egg groups</dt>
                  <dd>{{ info.eggGroups.join(', ') }}</dd>
                </div>
                <div>
                  <dt class="text-neutral-500 dark:text-neutral-400">Egg cycles</dt>
                  <dd>{{ info.eggCycles }}</dd>
                </div>
                <div class="col-span-2">
                  <dt class="text-neutral-500 dark:text-neutral-400">Gender</dt>
                  <dd>{{ genderRatio(info.genderRate) }}</dd>
                </div>
              </dl>
            </section>

            <section v-if="heldItems.length">
              <h2 class="font-inter mb-2 text-2xl font-black">Held in the wild</h2>
              <div v-for="entry in heldItems" :key="entry.versions.join()" class="mb-2">
                <p class="text-sm font-bold text-neutral-500 dark:text-neutral-400">
                  {{ entry.versions.join(' / ') }}
                </p>
                <ul class="font-pixel flex flex-wrap gap-2 text-xl">
                  <li
                    v-for="item in entry.value"
                    :key="item.name"
                    class="flex items-center gap-1 rounded-lg bg-white py-1 pr-3 pl-1 shadow-sm dark:bg-neutral-800"
                  >
                    <img :src="item.sprite" alt="" width="30" height="30" class="size-7" />
                    {{ item.name }}
                    <span class="text-neutral-500 dark:text-neutral-400">{{ item.rarity }}%</span>
                  </li>
                </ul>
              </div>
            </section>
          </div>

          <div v-else-if="tab === 'stats'" :id="panelId('stats')" class="space-y-6">
            <section v-if="shown?.stats.length">
              <h2 class="font-inter mb-2 text-2xl font-black">Base stats</h2>
              <dl class="font-pixel grid max-w-md grid-cols-[6rem_3rem_1fr] items-center gap-x-3 gap-y-1 text-xl">
                <template v-for="stat in shown.stats" :key="stat.name">
                  <dt class="text-neutral-500 dark:text-neutral-400">{{ stat.name }}</dt>
                  <dd class="text-right">{{ stat.value }}</dd>
                  <dd class="h-3 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
                    <div
                      class="h-full rounded-full"
                      :style="{
                        width: `${(stat.value / MAX_BASE_STAT) * 100}%`,
                        backgroundColor: `var(--color-poke-${info.color})`,
                      }"
                    ></div>
                  </dd>
                </template>
                <dt class="font-bold">Total</dt>
                <dd class="text-right font-bold">{{ statsTotal }}</dd>
              </dl>
            </section>

            <section v-if="shown?.stats.length">
              <h2 class="font-inter text-2xl font-black">Stat calculator</h2>
              <p class="mb-2 text-sm text-neutral-500 dark:text-neutral-400">
                Its stats at a level<template v-if="pokemonStore.game">, by {{ pokemonStore.game.name }}'s formula</template>
              </p>
              <StatCalculator :key="`${form?.id}-${generation}`" :stats="shown.stats" :generation />
            </section>

            <section v-if="training.length">
              <h2 class="font-inter mb-2 text-2xl font-black">Training</h2>
              <dl class="font-pixel grid max-w-md grid-cols-2 gap-2 text-xl">
                <div v-for="row in training" :key="row.label">
                  <dt class="text-neutral-500 dark:text-neutral-400">{{ row.label }}</dt>
                  <dd>{{ row.value }}</dd>
                </div>
              </dl>
            </section>

            <section v-if="matchups.length">
              <h2 class="font-inter text-2xl font-black">Type matchups</h2>
              <p class="mb-2 text-sm text-neutral-500 dark:text-neutral-400">
                Damage taken from each attacking type
              </p>
              <dl class="grid grid-cols-[3rem_1fr] items-center gap-x-3 gap-y-2">
                <template v-for="group in matchups" :key="group.label">
                  <dt class="font-pixel text-xl">{{ group.label }}</dt>
                  <dd><TypeBadge :types="group.types" class="flex-wrap gap-1" /></dd>
                </template>
              </dl>
            </section>
          </div>

          <section v-else-if="tab === 'moves' && form && movesGame" :id="panelId('moves')">
            <p class="mb-2 text-sm text-neutral-500 dark:text-neutral-400">
              In {{ movesGame.name }}<template v-if="!pokemonStore.game">, the latest game with
                move data. Pick a game above to see another</template
              >
            </p>
            <MoveList v-if="learnset.length" :key="`${form.id}-${movesGame.id}`" :learnset :game="movesGame" />
            <p v-else class="font-pixel text-xl">
              {{ form.name }} can't be obtained in {{ movesGame.name }}.
            </p>
          </section>

          <section v-else-if="tab === 'evolution' && info.evolutionChain" :id="panelId('evolution')">
            <p
              v-if="evolutionLines.every((line) => !line.evolvesTo.length)"
              class="mb-3 text-sm text-neutral-500 dark:text-neutral-400"
            >
              No evolutions<template v-if="pokemonStore.game"> in {{ pokemonStore.game.name }}</template>.
            </p>
            <div class="flex flex-wrap items-start justify-center gap-6">
              <EvolutionChain
                v-for="line in evolutionLines"
                :key="line.name"
                :evolution="line"
                :horizontal="evolutionLines.every(fitsInRow)"
              />
            </div>
          </section>
        </div>
      </div>
    </div>

    <div
      v-if="turningTo"
      aria-hidden="true"
      :class="['pointer-events-none fixed inset-0', turningTo.side === 'next' ? 'z-0' : 'z-40']"
    >
      <div
        class="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-neutral-100 dark:bg-neutral-700"
        :style="coverStyle"
      >
        <div class="absolute inset-y-0 left-0 w-10 bg-linear-to-r from-black/15 to-transparent"></div>
        <img
          :src="turningTo.sprite"
          alt=""
          width="96"
          height="96"
          class="size-40 [image-rendering:pixelated]"
        />
        <p class="font-bold text-neutral-500 dark:text-neutral-400">
          {{ turningTo.label }}
        </p>
        <p class="font-inter text-4xl font-black text-neutral-800 dark:text-neutral-100">
          {{ turningTo.name }}
        </p>
      </div>
    </div>

    <template v-if="turningTo">
      <div
        aria-hidden="true"
        :class="['pointer-events-none fixed inset-0', turningTo.side === 'next' ? 'z-[5]' : 'z-30']"
        :style="foldShadowStyle"
      ></div>
      <div
        v-if="fold.flap.length"
        aria-hidden="true"
        :class="['pointer-events-none fixed inset-0', turningTo.side === 'next' ? 'z-[15]' : 'z-[45]']"
        :style="{ filter: flapShadow }"
      >
        <div class="absolute inset-0 bg-neutral-200 dark:bg-neutral-600" :style="flapStyle"></div>
      </div>
    </template>
  </main>
</template>
