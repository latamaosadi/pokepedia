import { type IType } from '@/types/pokemon'
import { getJson } from './api'

const getTypeList = async (): Promise<IType[]> => {
  const totalTypes = 18

  const regexPattern = new RegExp(/\/pokemon\/(\d+)/)

  return await Promise.all(
    [...Array(totalTypes)].map(async (_value, index) => {
      const data = await getJson(`https://pokeapi.co/api/v2/type/${index + 1}`)
      return {
        name: data.name,
        pokemon: data.pokemon.map(({ pokemon }: { pokemon: { url: string } }) => {
          const regexTest = pokemon.url.match(regexPattern)
          return regexTest ? parseInt(regexTest[1]) : 0
        }),
      }
    }),
  )
}

export default getTypeList
