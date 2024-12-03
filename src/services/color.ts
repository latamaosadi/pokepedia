import { type IType, type PokemonType } from '@/types/pokemon'

const getColorList = async (): Promise<IType[]> => {
  const totalColors = 10

  const regexPattern = new RegExp(/\/pokemon-species\/(\d+)/)

  return Promise.all(
    [...Array(totalColors)].map(async (_value, index) => {
      const response = await fetch(`https://pokeapi.co/api/v2/pokemon-color/${index + 1}`)
      const data = await response.json()
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
