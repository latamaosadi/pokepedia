import { getPokemonList } from '@/services/pokemon'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useBaseStore } from './base'
import type { IPokemon } from '@/types/pokemon'

export const usePokemonStore = defineStore('pokemon', () => {
  const list = ref<IPokemon[]>([])

  async function getList() {
    const baseStore = useBaseStore()
    await Promise.all([baseStore.getTypes(), baseStore.getColors()])

    const data = await getPokemonList()

    data.forEach((pokemon, index) => {
      const types = baseStore.types.filter((type) => type.pokemon?.includes(pokemon.number))
      const color = baseStore.colors.find((color) => color.pokemon?.includes(pokemon.number))?.name
      data[index].types = types
      data[index].color = color
    })
    list.value = data
  }

  return { list, getList }
})
