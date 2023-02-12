import { UnknownObject } from '@/types/generic'
import {
  IEvolutionChain,
  INamedResource,
  IPokemon,
  IPokemonInfo,
  IPokemonSpecies,
} from '@/types/pokemon'
import { animatedSprite, defaultSprite, artwork } from '@/types/sprite'
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

export const getSpeciesDetail = async (
  url: string,
): Promise<IPokemonSpecies> => {
  const { data } = await axios.get(url)
  return {
    id: data.id,
    name: getName(data.names),
    color: getResourceName(data.color),
    description: getDescription(data.flavor_text_entries),
    isBaby: data.is_baby,
    isMythical: data.is_mythical,
    isLegendary: data.is_legendary,
    genus: getGenus(data.genera),
    pokedexNumber: getPokedexNumber(data.pokedex_numbers),
    evolutionUrl: data.evolution_chain.url,
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
      name: titleCase(pokemon.name),
      number: index + 1,
      sprite: defaultSprite(index + 1),
      art: artwork(index + 1),
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
    number: 1,
    sprite: defaultSprite(speciesData.id),
    art: artwork(speciesData.id),
  }
}

export const getPokemonInfo = async (id: number) => {
  const { data: infoData } = await axios.get(
    `https://pokeapi.co/api/v2/pokemon/${id}`,
  )
  const speciesData = await getSpeciesDetail(infoData.species.url)
  const { data: evolutionChainData } = await axios.get(speciesData.evolutionUrl)

  const pokemon: IPokemonInfo = {
    name: speciesData.name,
    number: speciesData.pokedexNumber,
    animatedSprite: animatedSprite(id),
    sprite: defaultSprite(id),
    artwork: artwork(id),
    color: speciesData.color,
    types: infoData.types.map((type: Record<string, UnknownObject>) => ({
      name: type.type.name,
    })),
    evolutionChain: await buildEvolution(evolutionChainData.chain),
    moves: [],
    genus: speciesData.genus,
    description: speciesData.description,
    height: convert(infoData.height, 'decimeters').to('best').toString(2),
    weight: convert(infoData.weight, 'hectograms').to('best').toString(2),
  }
  return pokemon
}
