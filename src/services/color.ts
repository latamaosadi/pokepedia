import { type IType } from '@/types/pokemon'
import { getJson } from './api'

const getColorList = async (): Promise<IType[]> => {
  const totalColors = 10

  const regexPattern = new RegExp(/\/pokemon-species\/(\d+)/)

  return Promise.all(
    [...Array(totalColors)].map(async (_value, index) => {
      const data = await getJson(`https://pokeapi.co/api/v2/pokemon-color/${index + 1}`)
      return {
        name: data.name,
        pokemon: data.pokemon_species.map((pokemon: { url: string }) => {
          const regexTest = pokemon.url.match(regexPattern)
          return regexTest ? parseInt(regexTest[1]) : 0
        }),
      }
    }),
  )
}

export default getColorList
