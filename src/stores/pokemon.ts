import { getPokemonList } from '@/services/pokemon'
import getColorList from '@/services/color'
import getTypeList from '@/services/type'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { IPokemon, PokemonType } from '@/types/pokemon'
import { matchesFilter } from '@/utils/pokemon'
import { artwork, defaultSprite } from '@/utils/sprite'
import { useLocalStorage } from '@vueuse/core'

// Bump the version when the cached shape or mapping changes.
const CACHE_KEY = 'pokedex/v2/pokemon'
const LEGACY_KEYS = ['pokedex/pokemon', 'pokedex/types', 'pokedex/colors']

export const usePokemonStore = defineStore('pokemon', () => {
  try {
    LEGACY_KEYS.forEach((key) => localStorage.removeItem(key))
  } catch {}

  const list = useLocalStorage<IPokemon[]>(CACHE_KEY, [])
  const error = ref<Error | null>(null)
  // Shared by the home grid and the Pokédex so the filter survives switching views.
  const query = ref('')
  const type = ref<PokemonType | ''>('')
  // App-wide shiny switch, remembered across visits.
  const shiny = useLocalStorage('pokedex/shiny', false)
  // The list as shown: filtered, with shiny art swapped in when the switch is on.
  const filtered = computed(() =>
    list.value
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
  const filterKey = computed(() => `${query.value}|${type.value}`)
  let pending: Promise<void> | null = null

  async function fetchList() {
    const [data, types, colors] = await Promise.all([
      getPokemonList(),
      getTypeList(),
      getColorList(),
    ])
    for (const pokemon of data) {
      pokemon.types = types
        .filter((type) => type.pokemon?.includes(pokemon.number))
        .map(({ name }) => ({ name }))
      pokemon.color = colors.find((color) => color.pokemon?.includes(pokemon.number))?.name
    }
    list.value = data
  }

  function getList() {
    if (list.value.length) return Promise.resolve()
    error.value = null
    pending ??= fetchList()
      .catch((e) => {
        error.value = e
      })
      .finally(() => {
        pending = null
      })
    return pending
  }

  return { list, filtered, filterKey, query, type, shiny, error, getList }
})
