import { IPokemon } from '@/types/pokemon'
import { titleCase } from '@/utils/string'
import axios from 'axios'

const getPokemonList = async (
  page: number,
  pageSize: number,
): Promise<IPokemon[]> => {
  const response = await axios.get(
    'https://pokeapi.co/api/v2/pokemon-species/',
    {
      params: {
        limit: pageSize,
        offset: (page - 1) * pageSize,
      },
    },
  )
  const data = response.data
  return data.results.map(
    (pokemon: any, index: number): IPokemon => ({
      name: titleCase(pokemon.name),
      number: index + 1,
      sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${
        index + 1
      }.png`,
    }),
  )

  // const regexPattern = new RegExp(/\/pokemon-species\/(\d+)/)

  // return new Promise((resolve) => {
  //   Promise.all(
  //     data.results.map(async (pokemon: any) => {
  //       const pokemonId = pokemon.url.match(regexPattern)[1]
  //       return await axios.get(
  //         `https://pokeapi.co/api/v2/pokemon-species/${pokemonId}`,
  //       )
  //     }),
  //   ).then(
  //     axios.spread((...allData) => {
  //       resolve(
  //         allData.map(({ data }): IPokemon => {
  //           const entryNumber = data.pokedex_numbers.find(
  //             ({ pokedex }: any) => pokedex.name === 'national',
  //           ).entry_number
  //           const pokemonName = data.names.find(
  //             ({ language }: any) => language.name === 'en',
  //           ).name
  //           return {
  //             name: pokemonName,
  //             number: entryNumber,
  //             sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${entryNumber}.png`,
  //             color: data.color.name,
  //           }
  //         }),
  //       )
  //     }),
  //   )
  // })
}

export default getPokemonList
