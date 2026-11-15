<script setup lang="ts">
import EvolutionChain from '@/components/EvolutionChain.vue'
import PokemonCard from '@/components/PokemonCard.vue'
import ShinyToggle from '@/components/ShinyToggle.vue'
import { getPokemonInfo } from '@/services/pokemon'
import { usePokemonStore } from '@/stores/pokemon'
import type { IPokemon, IPokemonInfo } from '@/types/pokemon'
import { artwork, defaultSprite } from '@/utils/sprite'
import { padNumber } from '@/utils/string'
import { onKeyStroke, useSwipe, useTitle } from '@vueuse/core'
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const pokemonStore = usePokemonStore()
const id = computed(() => route.params.id as string | undefined)
const info = ref<IPokemonInfo>()
const error = ref<Error>()
const formId = ref<number>()
const main = ref<HTMLElement>()

const form = computed(
  () => info.value?.forms.find((f) => f.id === formId.value) ?? info.value?.forms[0],
)
const card = computed((): IPokemon | undefined =>
  info.value && form.value
    ? {
        name: info.value.name,
        formattedName: form.value.name,
        number: info.value.number,
        sprite: form.value.sprite,
        artwork: artwork(form.value.id, pokemonStore.shiny),
        color: info.value.color,
        types: form.value.types,
      }
    : undefined,
)

// PokeAPI cries are Ogg files, which not every browser can play.
const canPlayCry =
  typeof Audio !== 'undefined' && new Audio().canPlayType('audio/ogg; codecs=vorbis') !== ''
// Highest base stat in the games, so bars share one scale across Pokémon.
const MAX_BASE_STAT = 255
const statsTotal = computed(() => form.value?.stats.reduce((sum, stat) => sum + stat.value, 0) ?? 0)

function playCry() {
  if (form.value?.cry) new Audio(form.value.cry).play().catch(() => {})
}

// National Dex neighbours. Names come from the cached list when there is one; PokeAPI
// also accepts the number, which covers landing here directly on a first visit.
const LAST_NUMBER = 1025
function neighbour(offset: number) {
  if (!info.value) return undefined
  const number = info.value.number + offset
  if (number < 1 || number > (pokemonStore.list.length || LAST_NUMBER)) return undefined
  const pokemon = pokemonStore.list[number - 1]
  return {
    id: pokemon?.name ?? String(number),
    name: pokemon?.formattedName,
    number,
    sprite: defaultSprite(number, pokemonStore.shiny),
  }
}
const previous = computed(() => neighbour(-1))
const next = computed(() => neighbour(1))

function go(target?: { id: string }) {
  if (target) router.push({ name: 'dex.detail', params: { id: target.id } })
}

onKeyStroke(['ArrowLeft', 'ArrowRight'], (event) => {
  // Leave arrows to form controls, and Alt/⌘+← to the browser's back.
  if (event.altKey || event.metaKey || event.ctrlKey) return
  if (event.target instanceof Element && event.target.closest('input, select, textarea')) return
  go(event.key === 'ArrowLeft' ? previous.value : next.value)
})

useSwipe(main, {
  onSwipeEnd: (_, direction) => {
    if (direction === 'left') go(next.value)
    else if (direction === 'right') go(previous.value)
  },
})

useTitle(() => (info.value ? `${info.value.formattedName} · Poképedia` : 'Poképedia'))

async function load(requested: string) {
  info.value = undefined
  error.value = undefined
  try {
    const data = await getPokemonInfo(requested)
    if (id.value !== requested) return
    info.value = data
    formId.value = data.forms[0]?.id
  } catch (e) {
    if (id.value === requested) error.value = e as Error
  }
}

watch(id, (value) => value && load(value), { immediate: true })
</script>

<template>
  <main ref="main" class="text-neutral-800 dark:text-neutral-100">
    <nav class="mb-4 flex items-center justify-between gap-2" aria-label="Pokémon navigation">
      <RouterLink
        to="/"
        class="shrink-0 rounded font-bold whitespace-nowrap outline-none hover:underline focus-visible:ring-4 focus-visible:ring-blue-400"
      >
        ← All Pokémon
      </RouterLink>
      <div class="flex gap-2">
        <RouterLink
          v-if="previous"
          :to="{ name: 'dex.detail', params: { id: previous.id } }"
          :aria-label="`Previous: ${previous.name ?? `#${previous.number}`}`"
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
          #{{ padNumber(previous.number) }}
          <span v-if="previous.name" class="hidden sm:inline">{{ previous.name }}</span>
        </RouterLink>
        <RouterLink
          v-if="next"
          :to="{ name: 'dex.detail', params: { id: next.id } }"
          :aria-label="`Next: ${next.name ?? `#${next.number}`}`"
          class="inline-flex items-center gap-1 rounded-full bg-white py-1 pr-2 pl-3 text-sm font-bold shadow-sm outline-none hover:bg-neutral-50 focus-visible:ring-4 focus-visible:ring-blue-400 dark:bg-neutral-800 dark:hover:bg-neutral-700"
        >
          <span v-if="next.name" class="hidden sm:inline">{{ next.name }}</span>
          #{{ padNumber(next.number) }}
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

      <div class="space-y-6">
        <header>
          <p class="font-bold text-neutral-500 dark:text-neutral-400">
            #{{ padNumber(info.number) }}
          </p>
          <div class="flex items-center gap-3">
            <h1 class="font-inter text-4xl font-black">{{ info.formattedName }}</h1>
            <button
              v-if="canPlayCry && form?.cry"
              class="rounded-full bg-white px-3 py-1 text-sm font-bold shadow-sm outline-none hover:bg-neutral-50 focus-visible:ring-4 focus-visible:ring-blue-400 dark:bg-neutral-800 dark:hover:bg-neutral-700"
              :aria-label="`Play ${form.name}'s cry`"
              @click="playCry"
            >
              🔊 Cry
            </button>
            <ShinyToggle />
          </div>
          <p class="font-pixel text-xl">{{ info.genus }}</p>
        </header>

        <label v-if="info.forms.length > 1" class="block">
          <span class="mb-1 block font-bold">Form</span>
          <select
            v-model="formId"
            class="select-chevron w-full max-w-xs rounded-lg bg-white py-2 pr-10 pl-3 dark:bg-neutral-800"
          >
            <option v-for="f in info.forms" :key="f.id" :value="f.id">{{ f.name }}</option>
          </select>
        </label>

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

        <section v-if="form?.abilities.length">
          <h2 class="font-inter mb-2 text-2xl font-black">Abilities</h2>
          <ul class="font-pixel flex flex-wrap gap-2 text-xl">
            <li
              v-for="ability in form.abilities"
              :key="ability.name"
              class="rounded-lg bg-white px-3 py-1 shadow-sm dark:bg-neutral-800"
            >
              {{ ability.name }}
              <span v-if="ability.hidden" class="text-neutral-500 dark:text-neutral-400">
                (hidden)
              </span>
            </li>
          </ul>
        </section>

        <section v-if="form?.stats.length">
          <h2 class="font-inter mb-2 text-2xl font-black">Base stats</h2>
          <dl class="font-pixel grid max-w-md grid-cols-[6rem_3rem_1fr] items-center gap-x-3 gap-y-1 text-xl">
            <template v-for="stat in form.stats" :key="stat.name">
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

        <p
          class="font-pixel rounded-md border-2 border-dashed p-3 text-xl"
          :style="`border-color: var(--color-poke-${info.color})`"
        >
          {{ info.description || 'No info yet' }}
        </p>

        <section v-if="info.evolutionChain">
          <h2 class="font-inter mb-2 text-2xl font-black">Evolution</h2>
          <EvolutionChain :evolution="info.evolutionChain" />
        </section>
      </div>
    </div>
  </main>
</template>
