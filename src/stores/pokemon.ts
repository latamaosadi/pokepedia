import gamesData from '@/data/games.json'
import pokemonData from '@/data/pokemon.json'
import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import type { IGame, IPokemon, IType, PokemonType } from '@/types/pokemon'
import { matchesFilter, typesInGeneration } from '@/utils/pokemon'
import { typesIn } from '@/utils/type-matchups'
import { artwork, defaultSprite } from '@/utils/sprite'
import { titleCase } from '@/utils/string'
import { useLocalStorage } from '@vueuse/core'

// Caches from versions that fetched the list at runtime.
const LEGACY_KEYS = ['pokedex/pokemon', 'pokedex/types', 'pokedex/colors', 'pokedex/v2/pokemon']

const toTypes = (names: string[]) => names.map((name) => ({ name: name as PokemonType }))

// Shipped with the app (regenerate with `bun run update-data`), so the list is
// there on the very first visit, offline included.
const list: IPokemon[] = pokemonData.map(({ number, name, types, color }) => ({
  number,
  name,
  formattedName: titleCase(name),
  sprite: defaultSprite(number),
  artwork: artwork(number),
  color,
  types: toTypes(types),
}))
// Types of the few Pokémon whose types changed: [last generation, types], oldest first.
const pastTypes = new Map<number, [number, IType[]][]>(
  pokemonData.flatMap(({ number, pastTypes }) =>
    pastTypes
      ? [[number, (pastTypes as [number, string[]][]).map(([last, names]) => [last, toTypes(names)])]]
      : [],
  ),
)

const games: IGame[] = gamesData

/**
 * A game's regional Pokédex in its own order and numbering, with types as they were then.
 * Games with several Pokédexes (DLC areas, Alola's islands) list each Pokémon once, under
 * the first one it appears in.
 */
function regionalDex(game: IGame): IPokemon[] {
  const seen = new Set<number>()
  return game.dexes.flatMap((dex) =>
    dex.species.flatMap((number, index) => {
      const pokemon = list[number - 1]
      if (!pokemon || seen.has(number)) return []
      seen.add(number)
      const types = typesInGeneration(pokemon.types ?? [], pastTypes.get(number), game.generation)
      const dexName = game.dexes.length > 1 ? titleCase(dex.name) : undefined
      return [{ ...pokemon, dexNumber: dex.start + index, dexName, types }]
    }),
  )
}

export const usePokemonStore = defineStore('pokemon', () => {
  try {
    LEGACY_KEYS.forEach((key) => localStorage.removeItem(key))
  } catch {}

  // Shared by the home grid and the Pokédex so the filter survives switching views.
  const query = ref('')
  const type = ref<PokemonType | ''>('')
  // App-wide shiny switch, remembered across visits.
  const shiny = useLocalStorage('pokedex/shiny', false)
  // Favorite Pokédex numbers, remembered across visits.
  const favorites = useLocalStorage<number[]>('pokedex/favorites', [])
  const favoritesOnly = ref(false)
  // The game being played, remembered across visits; '' for the whole National Dex.
  const gameId = useLocalStorage('pokedex/game', '')
  const game = computed(() => games.find((g) => g.id === gameId.value))
  // The Pokémon in the selected game, in its Pokédex order; the National Dex otherwise.
  const dex = computed(() => (game.value ? regionalDex(game.value) : list))
  // Types that exist in the selected game, for the type filter.
  const availableTypes = computed(() => typesIn(game.value?.generation))
  watch(availableTypes, (available) => {
    if (type.value && !available.includes(type.value)) type.value = ''
  })

  const isFavorite = (number: number) => favorites.value.includes(number)
  function toggleFavorite(number: number) {
    favorites.value = isFavorite(number)
      ? favorites.value.filter((n) => n !== number)
      : [...favorites.value, number]
  }
  // The list as shown: filtered, with shiny art swapped in when the switch is on.
  const filtered = computed(() =>
    dex.value
      .filter((pokemon) => !favoritesOnly.value || isFavorite(pokemon.number))
      .filter((pokemon) => matchesFilter(pokemon, query.value, type.value))
      .map((pokemon) =>
        shiny.value
          ? {
              ...pokemon,
              sprite: defaultSprite(pokemon.number, true),
              artwork: artwork(pokemon.number, true),
            }
          : pokemon,
      ),
  )
  // Changes with the filter. Virtual lists key on it to remount, so rows recycled from
  // a longer list don't linger off-screen where Tab and screen readers still reach them.
  const filterKey = computed(
    () => `${gameId.value}|${query.value}|${type.value}|${favoritesOnly.value}`,
  )

  return {
    list,
    games,
    gameId,
    game,
    dex,
    availableTypes,
    filtered,
    filterKey,
    query,
    type,
    shiny,
    favorites,
    favoritesOnly,
    isFavorite,
    toggleFavorite,
  }
})
