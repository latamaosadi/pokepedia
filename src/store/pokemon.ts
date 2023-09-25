import { defineStore } from 'pinia'
import { getPokemonInfo, getPokemonList } from '@/api/pokemon'
import { IPokemonInfo, IPokemonList } from '@/types/pokemon'
import { useBaseStore } from './base'

interface IPokemonState {
  filter: {
    keyword: string
  }
  list: IPokemonList
  info: IPokemonInfo | null
}

export const usePokemonStore = defineStore('pokemon', {
  state: (): IPokemonState => {
    return {
      filter: {
        keyword: '',
      },
      list: {
        page: 1,
        pageSize: 1017,
        data: [],
        loading: false,
      },
      info: null,
    }
  },
  getters: {
    filteredList: (state) => {
      const data = state.list.data.filter((pokemon) =>
        pokemon.formattedName
          .toLocaleLowerCase()
          .includes(state.filter.keyword.toLocaleLowerCase()),
      )

      return data
    },
  },
  actions: {
    async getList() {
      if (this.list.data.length > 1) {
        return
      }
      this.list.loading = true
      const baseStore = useBaseStore()
      await Promise.all([baseStore.getTypeList(), baseStore.getColorList()])

      const data = await getPokemonList(this.list.page, this.list.pageSize)

      console.log('baseStore.colors :>> ', baseStore.colors)
      data.forEach((pokemon, index) => {
        const types = baseStore.types.filter((type) =>
          type.pokemon?.includes(pokemon.number),
        )
        const color = baseStore.colors.find((color) =>
          color.pokemon?.includes(pokemon.number),
        )?.name
        data[index].types = types
        data[index].color = color
      })
      console.log('data :>> ', data)

      this.list.data = data
      this.list.loading = false
    },
    async getInfo(name: string) {
      const data = await getPokemonInfo(name)
      this.info = data
    },
    clearInfo() {
      this.info = null
    },
    setKeyword(keyword: string) {
      this.filter.keyword = keyword
    },
    loadMore() {
      this.list.page += 1
      this.getList()
    },
  },
})
