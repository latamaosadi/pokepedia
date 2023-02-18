import { IType } from '@/types/pokemon'
import axios from 'axios'

const getTypeList = async (): Promise<IType[]> => {
  const totalTypes = 18

  const regexPattern = new RegExp(/\/pokemon\/(\d+)/)

  return new Promise((resolve) => {
    Promise.all(
      [...Array(totalTypes)].map(async (value, index) => {
        return await axios.get(`https://pokeapi.co/api/v2/type/${index + 1}`)
      }),
    ).then(
      axios.spread((...allData) => {
        resolve(
          allData.map(({ data }): IType => {
            return {
              name: data.name,
              pokemon: data.pokemon.map(({ pokemon }: any) =>
                parseInt(pokemon.url.match(regexPattern)[1]),
              ),
            }
          }),
        )
      }),
    )
  })
}

export default getTypeList
