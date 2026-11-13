<script setup lang="ts">
import EvolutionChain from '@/components/EvolutionChain.vue'
import PokemonCard from '@/components/PokemonCard.vue'
import { getPokemonInfo } from '@/services/pokemon'
import type { IPokemon, IPokemonInfo } from '@/types/pokemon'
import { padNumber } from '@/utils/string'
import { useTitle } from '@vueuse/core'
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const id = computed(() => route.params.id as string | undefined)
const info = ref<IPokemonInfo>()
const error = ref<Error>()
const formId = ref<number>()

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
        artwork: form.value.artwork,
        color: info.value.color,
        types: form.value.types,
      }
    : undefined,
)

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
  <main class="text-neutral-800 dark:text-neutral-100">
    <RouterLink
      to="/"
      class="mb-4 inline-block rounded font-bold outline-none hover:underline focus-visible:ring-4 focus-visible:ring-blue-400"
    >
      ← All Pokémon
    </RouterLink>

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
      <PokemonCard :pokemon="card" class="mx-auto w-full max-w-xs" />

      <div class="space-y-6">
        <header>
          <p class="font-bold text-neutral-500 dark:text-neutral-400">
            #{{ padNumber(info.number) }}
          </p>
          <h1 class="font-inter text-4xl font-black">{{ info.formattedName }}</h1>
          <p class="font-pixel text-xl">{{ info.genus }}</p>
        </header>

        <label v-if="info.forms.length > 1" class="block">
          <span class="mb-1 block font-bold">Form</span>
          <select
            v-model="formId"
            class="w-full max-w-xs rounded-lg bg-white px-3 py-2 dark:bg-neutral-800"
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
