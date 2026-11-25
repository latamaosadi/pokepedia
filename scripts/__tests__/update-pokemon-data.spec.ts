import { describe, expect, test } from 'vitest'
import {
  buildGames,
  buildMachines,
  buildMoves,
  buildPokemonList,
  buildTypeCharts,
  type ColorResponse,
  type MoveResponse,
  type PokemonResponse,
  type TypeResponse,
  type VersionGroupResponse,
} from '../update-pokemon-data'

const API = 'https://pokeapi.co/api/v2'
const ref = (name: string, path: string) => ({ name, url: `${API}/${path}/` })
const gen = (n: number) => ref(`generation-${n}`, `generation/${n}`)
const noDamage = { double_damage_to: [], half_damage_to: [], no_damage_to: [] }
const type = (name: string, generation = 1): Omit<TypeResponse, 'damage_relations'> => ({
  name,
  generation: gen(generation),
  pokemon: [],
  past_damage_relations: [],
})

// Types list Pokémon in their own order, so Flying sees Charizard before Fire does.
const types: TypeResponse[] = [
  {
    ...type('flying'),
    pokemon: [{ slot: 2, pokemon: ref('charizard', 'pokemon/6') }],
    damage_relations: { ...noDamage, double_damage_to: [ref('grass', 'type/12')] },
  },
  {
    ...type('fire'),
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
    ...type('normal'),
    pokemon: [{ slot: 1, pokemon: ref('clefairy', 'pokemon/35') }],
    damage_relations: { ...noDamage, no_damage_to: [ref('ghost', 'type/8')] },
  },
]
const colors: ColorResponse[] = [
  { name: 'red', pokemon_species: [ref('charizard', 'pokemon-species/6')] },
  { name: 'pink', pokemon_species: [ref('clefairy', 'pokemon-species/35')] },
]

describe('buildPokemonList', () => {
  const species = [ref('charizard', 'pokemon-species/6'), ref('clefairy', 'pokemon-species/35')]

  test('gives each species its types in game order and its color', () => {
    expect(buildPokemonList(species, types, colors)).toEqual([
      { number: 6, name: 'charizard', types: ['fire', 'flying'], color: 'red' },
      { number: 35, name: 'clefairy', types: ['normal'], color: 'pink' },
    ])
  })

  test('adds the types a Pokémon had in older generations', () => {
    const pokemon: PokemonResponse[] = [
      { id: 6, moves: [], past_types: [] },
      {
        id: 35,
        moves: [],
        past_types: [{ generation: gen(5), types: [{ slot: 1, type: ref('normal', 'type/1') }] }],
      },
    ]
    expect(buildPokemonList(species, types, colors, pokemon)[1].pastTypes).toEqual([[5, ['normal']]])
    expect(buildPokemonList(species, types, colors, pokemon)[0]).not.toHaveProperty('pastTypes')
  })
})

describe('buildTypeCharts', () => {
  // Steel arrived in Gen 2 and stopped resisting Ghost in Gen 6; Fairy arrived in Gen 6.
  const steel: TypeResponse = {
    ...type('steel', 2),
    damage_relations: { ...noDamage, half_damage_to: [ref('steel', 'type/9')] },
  }
  const ghost: TypeResponse = {
    ...type('ghost'),
    damage_relations: { ...noDamage, double_damage_to: [ref('ghost', 'type/8')] },
    past_damage_relations: [
      {
        generation: gen(5),
        damage_relations: {
          ...noDamage,
          double_damage_to: [ref('ghost', 'type/8')],
          half_damage_to: [ref('steel', 'type/9')],
        },
      },
    ],
  }
  const fairy: TypeResponse = {
    ...type('fairy', 6),
    damage_relations: { ...noDamage, half_damage_to: [ref('steel', 'type/9')] },
  }

  test('keeps a chart only for generations where it changed', () => {
    expect(buildTypeCharts([ghost, steel, fairy], 9)).toEqual({
      1: { ghost: { ghost: 2 } },
      2: { ghost: { ghost: 2, steel: 0.5 }, steel: { steel: 0.5 } },
      6: { ghost: { ghost: 2 }, steel: { steel: 0.5 }, fairy: { steel: 0.5 } },
    })
  })
})

describe('buildGames', () => {
  const group = (name: string, order: number, generation: number, versions: string[], pokedexes: string[]) =>
    ({
      name,
      order,
      generation: gen(generation),
      versions: versions.map((v) => ref(v, 'version/1')),
      pokedexes: pokedexes.map((p) => ref(p, 'pokedex/1')),
    }) satisfies VersionGroupResponse
  const groups = [
    group('scarlet-violet', 27, 9, ['scarlet', 'violet'], ['paldea']),
    group('red-blue', 3, 1, ['red', 'blue'], ['kanto']),
    group('the-teal-mask', 28, 9, ['the-teal-mask'], ['kitakami']),
    group('colosseum', 12, 3, ['colosseum'], []),
  ]
  const names = new Map([
    ['red', 'Red'],
    ['blue', 'Blue'],
    ['scarlet', 'Scarlet'],
    ['violet', 'Violet'],
  ])
  const dexes = [
    {
      name: 'kanto',
      pokemon_entries: [
        { entry_number: 2, pokemon_species: ref('ivysaur', 'pokemon-species/2') },
        { entry_number: 1, pokemon_species: ref('bulbasaur', 'pokemon-species/1') },
      ],
    },
    { name: 'paldea', pokemon_entries: [{ entry_number: 1, pokemon_species: ref('sprigatito', 'pokemon-species/906') }] },
  ]

  test('lists playable games in release order, with their Pokédexes in entry order', () => {
    const learnsets = new Set(['red-blue', 'scarlet-violet', 'colosseum'])
    expect(buildGames(groups, names, dexes, learnsets)).toEqual([
      { id: 'red-blue', name: 'Red / Blue', generation: 1, order: 3, dexes: [{ name: 'kanto', start: 1, species: [1, 2] }] },
      {
        id: 'scarlet-violet',
        name: 'Scarlet / Violet',
        generation: 9,
        order: 27,
        dexes: [{ name: 'paldea', start: 1, species: [906] }],
      },
    ])
  })
})

describe('buildMoves', () => {
  test("keeps a move's stats and its older values, placed by game order", () => {
    const flamethrower: MoveResponse = {
      name: 'flamethrower',
      type: ref('fire', 'type/10'),
      damage_class: ref('special', 'move-damage-class/3'),
      power: 90,
      accuracy: 100,
      pp: 15,
      past_values: [
        { power: 95, accuracy: null, pp: null, type: null, version_group: ref('x-y', 'version-group/15') },
      ],
    }
    const tackle: MoveResponse = { ...flamethrower, name: 'tackle', power: 40, past_values: [] }
    expect(buildMoves([flamethrower, tackle], new Map([['x-y', 17]]))).toEqual({
      flamethrower: ['fire', 'special', 90, 100, 15, [[17, 95, null, null, null]]],
      tackle: ['fire', 'special', 40, 100, 15],
    })
  })
})

test('buildMachines maps each kept game to its TM and HM labels', () => {
  const machine = (item: string, move: string, group: string) => ({
    item: ref(item, 'item/1'),
    move: ref(move, 'move/1'),
    version_group: ref(group, 'version-group/1'),
  })
  expect(
    buildMachines(
      [
        machine('tm35', 'flamethrower', 'firered-leafgreen'),
        machine('hm01', 'cut', 'firered-leafgreen'),
        machine('tm35', 'flamethrower', 'colosseum'),
      ],
      new Set(['firered-leafgreen']),
    ),
  ).toEqual({ 'firered-leafgreen': { flamethrower: 'TM35', cut: 'HM01' } })
})
