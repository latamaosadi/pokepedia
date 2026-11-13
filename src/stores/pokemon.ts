import { getPokemonList } from '@/services/pokemon'
import getColorList from '@/services/color'
import getTypeList from '@/services/type'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { IPokemon } from '@/types/pokemon'
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

  return { list, error, getList }
})
