import pokemonData from '@/data/pokemon.json'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { IPokemon, PokemonType } from '@/types/pokemon'
import { matchesFilter } from '@/utils/pokemon'
import { artwork, defaultSprite } from '@/utils/sprite'
import { titleCase } from '@/utils/string'
import { useLocalStorage } from '@vueuse/core'

// Caches from versions that fetched the list at runtime.
const LEGACY_KEYS = ['pokedex/pokemon', 'pokedex/types', 'pokedex/colors', 'pokedex/v2/pokemon']

// Shipped with the app (regenerate with `bun run update-data`), so the list is
// there on the very first visit, offline included.
const list: IPokemon[] = pokemonData.map(({ number, name, types, color }) => ({
  number,
  name,
  formattedName: titleCase(name),
  sprite: defaultSprite(number),
  artwork: artwork(number),
  color,
  types: types.map((type) => ({ name: type as PokemonType })),
}))

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

  const isFavorite = (number: number) => favorites.value.includes(number)
  function toggleFavorite(number: number) {
    favorites.value = isFavorite(number)
      ? favorites.value.filter((n) => n !== number)
      : [...favorites.value, number]
  }
  // The list as shown: filtered, with shiny art swapped in when the switch is on.
  const filtered = computed(() =>
    list
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
  const filterKey = computed(() => `${query.value}|${type.value}|${favoritesOnly.value}`)

  return {
    list,
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
