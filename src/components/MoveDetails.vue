<script lang="ts">
import { getJson } from '@/services/api'

// Who learns what in each game, written by `bun run update-data`; one file per game, kept for the session.
const learnerRequests = new Map<string, Promise<Record<string, number[]>>>()
function learnersIn(game: string) {
  let request = learnerRequests.get(game)
  if (!request) {
    request = getJson(`/learners/${game}.json`)
    request.catch(() => learnerRequests.delete(game))
    learnerRequests.set(game, request)
  }
  return request
}
</script>

<script setup lang="ts">
import { usePokemonStore } from '@/stores/pokemon'
import type { IGame } from '@/types/pokemon'
import { defaultSprite } from '@/utils/sprite'
import { ref } from 'vue'

const { move, game } = defineProps<{
  move: string
  game: IGame
}>()

const pokemonStore = usePokemonStore()
const details = ref<{ effect: string; priority: number; learners: number[] }>()
const failed = ref(false)

type Text = { language: { name: string } }
const english = (entry: Text) => entry.language.name === 'en'

Promise.all([getJson(`https://pokeapi.co/api/v2/move/${move}`), learnersIn(game.id)])
  .then(([data, learners]) => {
    // The game's own description where there is one, else today's effect.
    const gameText = data.flavor_text_entries.find(
      (entry: Text & { version_group: { name: string } }) =>
        english(entry) && entry.version_group.name === game.id,
    )?.flavor_text
    const effect = data.effect_entries
      .find(english)
      ?.short_effect.replace('$effect_chance', data.effect_chance)
    details.value = {
      effect: (gameText ?? effect ?? '').replace(/\s+/g, ' '),
      priority: data.priority,
      learners: learners[move] ?? [],
    }
  })
  .catch(() => (failed.value = true))
</script>

<template>
  <div class="space-y-2 py-2 font-sans text-sm">
    <p v-if="failed">Couldn't load this move. Check your connection.</p>
    <p v-else-if="!details" aria-busy="true">Loading…</p>
    <template v-else>
      <p>{{ details.effect }}</p>
      <p v-if="details.priority">
        <span class="font-bold">Priority</span> {{ details.priority > 0 ? '+' : '' }}{{ details.priority }}
      </p>
      <p class="font-bold">Learned by {{ details.learners.length }} Pokémon in {{ game.name }}</p>
      <ul class="flex max-h-48 flex-wrap overflow-y-auto">
        <li v-for="number in details.learners" :key="number">
          <RouterLink
            :to="{ name: 'dex.detail', params: { id: pokemonStore.list[number - 1]?.name ?? number } }"
            :title="pokemonStore.list[number - 1]?.formattedName"
            class="block rounded-md outline-none hover:bg-white focus-visible:ring-4 focus-visible:ring-blue-400 dark:hover:bg-neutral-800"
          >
            <img
              :src="defaultSprite(number, pokemonStore.shiny)"
              :alt="pokemonStore.list[number - 1]?.formattedName"
              width="96"
              height="96"
              loading="lazy"
              class="size-12 [image-rendering:pixelated]"
            />
          </RouterLink>
        </li>
      </ul>
    </template>
  </div>
</template>
