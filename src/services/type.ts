import { type IType } from '@/types/pokemon'

const getTypeList = async (): Promise<IType[]> => {
  const totalTypes = 18

  const regexPattern = new RegExp(/\/pokemon\/(\d+)/)

  return await Promise.all(
    [...Array(totalTypes)].map(async (_value, index) => {
      const response = await fetch(`https://pokeapi.co/api/v2/type/${index + 1}`)
      const data = await response.json()
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
