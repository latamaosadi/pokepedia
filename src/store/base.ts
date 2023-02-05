import { defineStore } from 'pinia'
import { IBaseList } from '@/types/pokemon'
import getTypeList from '@/api/type'
import getColorList from '@/api/color'

export const useBaseStore = defineStore('base', {
  state: (): IBaseList => {
    return {
      types: [],
      colors: [],
    }
  },
  actions: {
    async getTypeList() {
      const data = await getTypeList()
      this.types = data
    },
    async getColorList() {
      const data = await getColorList()
      this.colors = data
    },
  },
})
