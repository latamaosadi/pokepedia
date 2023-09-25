import { UnknownObject } from '@/types/generic'
import {
  IEvolutionChain,
  IForm,
  INamedResource,
  IPokemon,
  IPokemonInfo,
  IPokemonSpecies,
} from '@/types/pokemon'
import { animatedSprite, defaultSprite, artwork } from '@/utils/sprite'
import {
  getDescription,
  getGenus,
  getName,
  getPokedexNumber,
  getResourceName,
} from '@/utils/parser'
import { titleCase } from '@/utils/string'
import axios from 'axios'
import { getItemDetail } from './item'
import convert from 'convert'
import { formatFormName } from '@/utils/pokemon'

export const getSpeciesDetail = async (
  url: string,
): Promise<IPokemonSpecies> => {
  const { data } = await axios.get(url)
  return {
    id: data.id,
    name: data.name,
    formattedName: getName(data.names),
    color: getResourceName(data.color),
    description: getDescription(data.flavor_text_entries),
    isBaby: data.is_baby,
    isMythical: data.is_mythical,
    isLegendary: data.is_legendary,
    genus: getGenus(data.genera),
    pokedexNumber: getPokedexNumber(data.pokedex_numbers),
    evolutionUrl: data.evolution_chain.url,
    varietiesUrl: data.varieties
      .filter(
        (variety: any) =>
          variety.is_default ||
          !['totem', '-meteor', 'koraidon', 'miraidon'].filter((word) =>
            variety.pokemon.name.includes(word),
          ).length,
      )
      .map((variety: any) => variety.pokemon.url),
  }
}

export const getPokemonList = async (
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
    (pokemon: INamedResource, index: number): IPokemon => ({
      name: pokemon.name,
      formattedName: titleCase(pokemon.name),
      number: index + 1,
      sprite: defaultSprite(index + 1),
      artwork: artwork(index + 1),
    }),
  )
}

async function iterateEvolution(evolutions: any): Promise<IEvolutionChain[]> {
  return await Promise.all(
    evolutions.map(async (evolution: any) => await buildEvolution(evolution)),
  )
}

async function buildEvolution(evolution: any): Promise<IEvolutionChain> {
  const speciesData = await getSpeciesDetail(evolution.species.url)
  const evolutionDetail = evolution.evolution_details[0] || null

  let itemData = null
  if (evolutionDetail?.item) {
    itemData = await getItemDetail(evolutionDetail.item.url)
  }

  return {
    evolvesTo: await iterateEvolution(evolution.evolves_to),
    evolutionDetail: {
      method: evolutionDetail?.trigger.name,
      minLevel: evolutionDetail?.min_level,
      minHappiness: evolutionDetail?.min_happiness,
      item: itemData,
    },
    name: speciesData.name,
    formattedName: speciesData.formattedName,
    number: speciesData.pokedexNumber,
    sprite: defaultSprite(speciesData.id),
  }
}

export const getPokemonDetail = async (url: string) => {
  return await axios.get(url)
}

export const getPokemonForms = async (
  pokemon: IPokemonSpecies,
  // infoData: any,
): Promise<IForm[]> => {
  const forms: IForm[] = [
    // {
    //   id: pokemon.id,
    //   name: pokemon.formattedName,
    //   value: 'default',
    //   height: convert(infoData.height, 'decimeters').to('best').toString(2),
    //   weight: convert(infoData.weight, 'hectograms').to('best').toString(2),
    //   types: infoData.types.map((type: Record<string, UnknownObject>) => ({
    //     name: type.type.name,
    //   })),
    //   sprite: defaultSprite(pokemon.id),
    //   artwork: artwork(pokemon.id),
    // },

    ...(await Promise.all(
      pokemon.varietiesUrl.map(async (url) => {
        const { data: pokemonInfo } = await getPokemonDetail(url)
        return {
          id: pokemonInfo.id,
          name: formatFormName(pokemonInfo.name, pokemon.name),
          value: pokemon.name,
          types: pokemonInfo.types.map(
            (type: Record<string, UnknownObject>) => ({
              name: type.type.name,
            }),
          ),
          height: convert(pokemonInfo.height, 'decimeters')
            .to('best')
            .toString(2),
          weight: convert(pokemonInfo.weight, 'hectograms')
            .to('best')
            .toString(2),
          sprite: defaultSprite(pokemonInfo.id),
          artwork: artwork(pokemonInfo.id),
        }
      }),
    )),
  ]

  return forms
}

export const getPokemonInfo = async (id: number | string) => {
  // const { data: infoData } = await getPokemonDetail(
  //   `https://pokeapi.co/api/v2/pokemon/${id}`,
  // )
  // const speciesData = await getSpeciesDetail(infoData.species.url)
  const speciesData = await getSpeciesDetail(
    `https://pokeapi.co/api/v2/pokemon-species/${id}`,
  )
  const { data: evolutionChainData } = await axios.get(speciesData.evolutionUrl)

  const pokemon: IPokemonInfo = {
    name: speciesData.name,
    formattedName: speciesData.formattedName,
    number: speciesData.pokedexNumber,
    animatedSprite: animatedSprite(speciesData.pokedexNumber),
    sprite: defaultSprite(speciesData.pokedexNumber),
    artwork: artwork(speciesData.pokedexNumber),
    color: speciesData.color,
    // types: infoData.types.map((type: Record<string, UnknownObject>) => ({
    //   name: type.type.name,
    // })),
    evolutionChain: await buildEvolution(evolutionChainData.chain),
    moves: [],
    genus: speciesData.genus,
    description: speciesData.description,
    // height: convert(infoData.height, 'decimeters').to('best').toString(2),
    // weight: convert(infoData.weight, 'hectograms').to('best').toString(2),
    forms: await getPokemonForms(speciesData),
    species: speciesData,
  }
  return pokemon
}
