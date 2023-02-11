import { defineStore } from 'pinia'
import { IBaseList } from '@/types/pokemon'
import getTypeList from '@/api/type'
import getColorList from '@/api/color'
import { useLocalStorage } from '@vueuse/core'

export const useBaseStore = defineStore('base', {
  state: (): IBaseList => {
    return {
      types: useLocalStorage('pokedex/types', []),
      colors: useLocalStorage('pokedex/colors', []),
    }
  },
  actions: {
    async getTypeList() {
      if (this.types.length) {
        return
      }
      const data = await getTypeList()
      this.types = data
    },
    async getColorList() {
      if (this.colors.length) {
        return
      }
      const data = await getColorList()
      this.colors = data
    },
  },
})
