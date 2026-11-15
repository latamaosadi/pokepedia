import { describe, expect, test } from 'vitest'
import {
  buildPokemonList,
  buildTypeChart,
  type ColorResponse,
  type TypeResponse,
} from '../update-pokemon-data'

const API = 'https://pokeapi.co/api/v2'
const ref = (name: string, path: string) => ({ name, url: `${API}/${path}/` })
const noDamage = { double_damage_to: [], half_damage_to: [], no_damage_to: [] }

// Types list Pokémon in their own order, so Flying sees Charizard before Fire does.
const types: TypeResponse[] = [
  {
    name: 'flying',
    pokemon: [{ slot: 2, pokemon: ref('charizard', 'pokemon/6') }],
    damage_relations: { ...noDamage, double_damage_to: [ref('grass', 'type/12')] },
  },
  {
    name: 'fire',
    pokemon: [
      { slot: 1, pokemon: ref('charizard', 'pokemon/6') },
      { slot: 1, pokemon: ref('charizard-mega-x', 'pokemon/10034') },
    ],
    damage_relations: {
      double_damage_to: [ref('grass', 'type/12')],
      half_damage_to: [ref('water', 'type/11')],
      no_damage_to: [],
    },
  },
  {
    name: 'normal',
    pokemon: [{ slot: 1, pokemon: ref('pidgey', 'pokemon/16') }],
    damage_relations: { ...noDamage, no_damage_to: [ref('ghost', 'type/8')] },
  },
]
const colors: ColorResponse[] = [
  { name: 'red', pokemon_species: [ref('charizard', 'pokemon-species/6')] },
  { name: 'brown', pokemon_species: [ref('pidgey', 'pokemon-species/16')] },
]

describe('buildPokemonList', () => {
  test('gives each species its types in game order and its color', () => {
    const species = [ref('charizard', 'pokemon-species/6'), ref('pidgey', 'pokemon-species/16')]

    expect(buildPokemonList(species, types, colors)).toEqual([
      { number: 6, name: 'charizard', types: ['fire', 'flying'], color: 'red' },
      { number: 16, name: 'pidgey', types: ['normal'], color: 'brown' },
    ])
  })
})

describe('buildTypeChart', () => {
  test('maps attacking type to the multiplier against each affected type', () => {
    expect(buildTypeChart(types)).toEqual({
      flying: { grass: 2 },
      fire: { grass: 2, water: 0.5 },
      normal: { ghost: 0 },
    })
  })
})
