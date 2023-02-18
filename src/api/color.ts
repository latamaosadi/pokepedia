import { IType } from '@/types/pokemon'
import axios from 'axios'

const getColorList = async (): Promise<IType[]> => {
  const totalColors = 10

  const regexPattern = new RegExp(/\/pokemon-species\/(\d+)/)

  return new Promise((resolve) => {
    Promise.all(
      [...Array(totalColors)].map(async (value, index) => {
        return await axios.get(
          `https://pokeapi.co/api/v2/pokemon-color/${index + 1}`,
        )
      }),
    ).then(
      axios.spread((...allData) => {
        resolve(
          allData.map(({ data }): IType => {
            return {
              name: data.name,
              pokemon: data.pokemon_species.map((pokemon: any) =>
                parseInt(pokemon.url.match(regexPattern)[1]),
              ),
            }
          }),
        )
      }),
    )
  })
}

export default getColorList
