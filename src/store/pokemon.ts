import { defineStore } from 'pinia'
import getPokemonList from '@/api/list'
import { IPokemonList } from '@/types/pokemon'
import { useBaseStore } from './base'

export const usePokemonStore = defineStore('pokemon', {
  state: (): IPokemonList => {
    return {
      page: 1,
      pageSize: 1008,
      data: [],
      loading: false,
    }
  },
  actions: {
    async getList() {
      this.loading = true
      const data = await getPokemonList(this.page, this.pageSize)

      const baseStore = useBaseStore()

      data.forEach((pokemon, index) => {
        const types = baseStore.types.filter((type) =>
          type.pokemon?.map((id) => parseInt(id)).includes(pokemon.number),
        )
        const color = baseStore.colors.find((color) =>
          color.pokemon?.map((id) => parseInt(id)).includes(pokemon.number),
        )?.name
        data[index].types = types
        data[index].color = color
      })

      this.data.push(...data)
      this.loading = false
    },
    loadMore() {
      this.page += 1
      this.getList()
    },
  },
})
