import { defineStore } from 'pinia'
import { type IType } from '@/types/pokemon'
import { useLocalStorage } from '@vueuse/core'
import getColorList from '@/services/color'
import getTypeList from '@/services/type'

export const useBaseStore = defineStore('base', () => {
  const types = useLocalStorage<IType[]>('pokedex/types', [])
  const colors = useLocalStorage<IType[]>('pokedex/colors', [])
  async function getTypes() {
    if (types.value.length) return
    const data = await getTypeList()
    types.value = data
  }
  async function getColors() {
    if (types.value.length) return
    const data = await getColorList()
    colors.value = data
  }
  return { types, colors, getTypes, getColors }
})
