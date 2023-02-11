import { defineStore } from 'pinia'
import { getPokemonInfo, getPokemonList } from '@/api/pokemon'
import { IPokemonInfo, IPokemonList } from '@/types/pokemon'
import { useBaseStore } from './base'

interface IPokemonState {
  list: IPokemonList
  info: IPokemonInfo | null
}

export const usePokemonStore = defineStore('pokemon', {
  state: (): IPokemonState => {
    return {
      list: {
        page: 1,
        pageSize: 1008,
        data: [],
        loading: false,
      },
      info: null,
    }
  },
  actions: {
    async getList() {
      this.list.loading = true
      const data = await getPokemonList(this.list.page, this.list.pageSize)

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

      this.list.data.push(...data)
      this.list.loading = false
    },
    async getInfo(id: number) {
      const data = await getPokemonInfo(id)
      this.info = data
    },
    clearInfo() {
      this.info = null
    },
    loadMore() {
      this.list.page += 1
      this.getList()
    },
  },
})
