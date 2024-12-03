import type {
  IEvolutionChain,
  IForm,
  INamedResource,
  IPokemon,
  IPokemonInfo,
  IPokemonSpecies,
} from '@/types/pokemon'
import { animatedSprite, artwork, defaultSprite } from '@/utils/sprite'
import { titleCase } from '@/utils/string'
import { getItemDetail } from './item'
import { formatFormName } from '@/utils/pokemon'
import type { Dic, UnknownObject } from '@/types/generic'
import convert from 'convert'
import {
  getDescription,
  getGenus,
  getName,
  getPokedexNumber,
  getResourceName,
} from '@/utils/parser'

export async function getPokemonList(): Promise<IPokemon[]> {
  const size = 1025
  const response = await fetch(
    `https://pokeapi.co/api/v2/pokemon-species?limit=${size}`,
  )
  const data = await response.json()

  function getPokemonNumber(url: string) {
    const match = url.match(/\/(\d+)\/?$/)
    return match ? parseInt(match[1]) : 0 // Return the matched group or an empty string if no match
  }

  return data.results.map(
    (pokemon: INamedResource, index: number): IPokemon => ({
      name: pokemon.name,
      formattedName: titleCase(pokemon.name),
      number: getPokemonNumber(pokemon.url || ''),
      sprite: defaultSprite(getPokemonNumber(pokemon.url || '')),
      artwork: artwork(getPokemonNumber(pokemon.url || '')),
    }),
  )
}

export const getSpeciesDetail = async (
  url: string,
): Promise<IPokemonSpecies> => {
  const response = await fetch(url)
  const data = await response.json()
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
        (variety: Dic) =>
          variety.is_default ||
          !['totem', '-meteor', 'koraidon', 'miraidon'].filter((word) =>
            variety.pokemon.name.includes(word),
          ).length,
      )
      .map((variety: Dic) => variety.pokemon.url),
  }
}

async function iterateEvolution(evolutions: Dic): Promise<IEvolutionChain[]> {
  return await Promise.all(
    evolutions.map(async (evolution: Dic) => await buildEvolution(evolution)),
  )
}

async function buildEvolution(evolution: Dic): Promise<IEvolutionChain> {
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
  const response = await fetch(url)
  return await response.json()
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
  const response = await fetch(speciesData.evolutionUrl)
  const evolutionChainData = await response.json()

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
