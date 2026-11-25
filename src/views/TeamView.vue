<script setup lang="ts">
import GameSelect from '@/components/GameSelect.vue'
import TypeBadge from '@/components/TypeBadge.vue'
import ViewNav from '@/components/ViewNav.vue'
import { TEAM_SIZE, usePokemonStore } from '@/stores/pokemon'
import type { IPokemon, PokemonType } from '@/types/pokemon'
import { defaultSprite } from '@/utils/sprite'
import { padNumber } from '@/utils/string'
import { teamCoverage, teamDefense } from '@/utils/type-matchups'
import { useTitle } from '@vueuse/core'
import { computed, ref } from 'vue'

const pokemonStore = usePokemonStore()
useTitle('Team · Poképedia')

const members = computed(() =>
  pokemonStore.team.flatMap((number) => {
    const pokemon = pokemonStore.pokemonInGame(number)
    return pokemon ? [pokemon] : []
  }),
)
const emptySlots = computed(() => TEAM_SIZE - members.value.length)
const typeNames = computed(() => members.value.map((p) => (p.types ?? []).map((t) => t.name)))
const generation = computed(() => pokemonStore.game?.generation)
const defense = computed(() => teamDefense(typeNames.value, generation.value))
// More of the team is hit hard by it than shrugs it off.
const isWeakSpot = (row: { weak: number; resist: number }) => row.weak >= 2 && row.weak > row.resist
const uncovered = computed(() =>
  teamCoverage(typeNames.value, generation.value)
    .filter((row) => !row.hitBy.length)
    .map((row) => ({ name: row.type as PokemonType })),
)
const badge = (type: string) => [{ name: type as PokemonType }]

const query = ref('')
// Pokémon in the selected game, so the picker only offers ones you can catch there.
function add() {
  const name = query.value.trim().toLowerCase()
  const pokemon = pokemonStore.dex.find(
    (p) => p.formattedName.toLowerCase() === name || p.name === name,
  )
  if (pokemon && !pokemonStore.inTeam(pokemon.number)) pokemonStore.toggleTeam(pokemon.number)
  if (pokemon) query.value = ''
}
const notInGame = (pokemon: IPokemon) =>
  pokemonStore.game && !pokemonStore.dex.some((p) => p.number === pokemon.number)
</script>

<template>
  <main class="space-y-6 text-neutral-800 dark:text-neutral-100">
    <div class="flex flex-wrap items-center gap-2">
      <ViewNav />
      <GameSelect />
    </div>

    <section>
      <h1 class="font-inter mb-1 text-4xl font-black">Team</h1>
      <p class="mb-3 text-sm text-neutral-500 dark:text-neutral-400">
        Up to {{ TEAM_SIZE }} Pokémon. Add them here or with “+ Team” on their page.
      </p>
      <ul class="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <li
          v-for="pokemon in members"
          :key="pokemon.number"
          class="relative flex flex-col items-center rounded-2xl bg-white p-2 text-center shadow-sm dark:bg-neutral-800"
        >
          <RouterLink
            :to="{ name: 'dex.detail', params: { id: pokemon.name } }"
            class="flex flex-col items-center rounded-lg outline-none focus-visible:ring-4 focus-visible:ring-blue-400"
          >
            <img
              :src="defaultSprite(pokemon.number, pokemonStore.shiny)"
              alt=""
              width="96"
              height="96"
              class="size-24 [image-rendering:pixelated]"
            />
            <span class="text-xs font-bold text-neutral-500 dark:text-neutral-400">
              #{{ padNumber(pokemon.number) }}
            </span>
            <span class="font-inter leading-tight font-black">{{ pokemon.formattedName }}</span>
          </RouterLink>
          <TypeBadge v-if="pokemon.types" :types="pokemon.types" class="mt-1" />
          <span v-if="notInGame(pokemon)" class="mt-1 text-xs font-bold">
            Not in {{ pokemonStore.game?.name }}
          </span>
          <button
            type="button"
            :aria-label="`Remove ${pokemon.formattedName}`"
            class="absolute top-1 right-1 rounded-full px-2 py-0.5 font-bold outline-none hover:bg-neutral-100 focus-visible:ring-4 focus-visible:ring-blue-400 dark:hover:bg-neutral-700"
            @click="pokemonStore.toggleTeam(pokemon.number)"
          >
            ✕
          </button>
        </li>
        <li
          v-for="slot in emptySlots"
          :key="`empty-${slot}`"
          aria-hidden="true"
          class="min-h-40 rounded-2xl border-2 border-dashed border-neutral-300 dark:border-neutral-600"
        ></li>
      </ul>
      <form v-if="emptySlots" class="mt-3 flex max-w-sm gap-2" @submit.prevent="add">
        <input
          v-model="query"
          list="team-candidates"
          placeholder="Add a Pokémon"
          aria-label="Add a Pokémon to the team"
          class="min-w-0 flex-1 rounded-lg bg-white px-3 py-2 shadow-sm outline-none focus-visible:ring-4 focus-visible:ring-blue-400 dark:bg-neutral-800"
          @change="add"
        />
        <datalist id="team-candidates">
          <option v-for="p in pokemonStore.dex" :key="p.number" :value="p.formattedName"></option>
        </datalist>
        <button
          type="submit"
          class="rounded-lg bg-neutral-800 px-3 py-2 font-bold text-white outline-none focus-visible:ring-4 focus-visible:ring-blue-400 dark:bg-neutral-100 dark:text-neutral-900"
        >
          Add
        </button>
      </form>
    </section>

    <template v-if="members.length">
      <section>
        <h2 class="font-inter text-2xl font-black">Defense</h2>
        <p class="mb-2 text-sm text-neutral-500 dark:text-neutral-400">
          Members weak to and resisting each attacking type<template v-if="pokemonStore.game">
            in {{ pokemonStore.game.name }}</template>. Abilities aren't counted.
        </p>
        <table class="text-left">
          <thead class="text-xs text-neutral-500 uppercase dark:text-neutral-400">
            <tr>
              <th scope="col" class="py-1 pr-4 font-bold">Attack</th>
              <th scope="col" class="py-1 pr-4 text-right font-bold">Weak</th>
              <th scope="col" class="py-1 text-right font-bold">Resist</th>
            </tr>
          </thead>
          <tbody class="font-pixel text-lg">
            <tr
              v-for="row in defense"
              :key="row.type"
              :class="isWeakSpot(row) && 'bg-red-100 dark:bg-red-950'"
            >
              <th scope="row" class="py-0.5 pr-4 font-normal"><TypeBadge :types="badge(row.type)" /></th>
              <td :class="['pr-4 text-right', row.weak && 'text-red-600 dark:text-red-400']">
                {{ row.weak || '–' }}
              </td>
              <td :class="['text-right', row.resist && 'text-green-700 dark:text-green-400']">
                {{ row.resist || '–' }}
              </td>
            </tr>
          </tbody>
        </table>
        <p class="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
          Highlighted: two or more members are weak to it and fewer resist it.
        </p>
      </section>

      <section>
        <h2 class="font-inter text-2xl font-black">Coverage</h2>
        <p class="mb-2 text-sm text-neutral-500 dark:text-neutral-400">
          Types none of your team's own types hit super effectively
        </p>
        <TypeBadge v-if="uncovered.length" :types="uncovered" class="flex-wrap gap-1" />
        <p v-else class="font-pixel text-xl">Every type is covered.</p>
      </section>
    </template>
  </main>
</template>
