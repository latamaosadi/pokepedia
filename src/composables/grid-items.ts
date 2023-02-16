import { usePokemonStore } from '@/store/pokemon'
import { IPokemon } from '@/types/pokemon'
import { breakpointsTailwind, useBreakpoints } from '@vueuse/core'
import { computed } from 'vue'

interface IGridItems {
  id: number
  items: IPokemon[]
}
const breakpoints = useBreakpoints(breakpointsTailwind)
const pokemonStore = usePokemonStore()

export function useGridItems(gridSizes: Record<string, number>) {
  const data = computed(() => {
    let columns = gridSizes.md
    if (breakpoints.smaller('sm').value) {
      columns = gridSizes.default
    } else if (breakpoints.between('sm', 'md').value) {
      columns = gridSizes.sm
    } else if (breakpoints.between('md', 'lg').value) {
      columns = gridSizes.md
    } else if (breakpoints.between('lg', 'xl').value) {
      columns = gridSizes.lg
    } else if (breakpoints.between('xl', '2xl').value) {
      columns = gridSizes.xl
    } else {
      columns = gridSizes['2xl']
    }

    if (!columns)
      columns =
        gridSizes[Object.keys(gridSizes)[Object.keys(gridSizes).length - 1]]

    return pokemonStore.filteredList.reduce((acc, pokemon, index) => {
      if ((index + 1) % columns < columns) {
        const rowIndex = Math.floor(index / columns)
        if (!acc[rowIndex]) {
          acc[rowIndex] = {
            id: rowIndex,
            items: [pokemon],
          }
        } else {
          acc[rowIndex].items = [...acc[rowIndex].items, pokemon]
        }
      }
      return acc
    }, [] as IGridItems[])
  })
  return data
}
