import { describe, expect, test } from 'vitest'
import type { IEvolutionChain, IForm, IGame } from '@/types/pokemon'
import { evolutionIn, formInGeneration, movesInGame, pokedexEntries, type MoveData } from '../game'

const stat = (name: string, value: number) => ({ name, value })
const ability = (name: string, slot: number, hidden = false) => ({ name, slot, hidden })

// Clefable as PokeAPI describes it: Fairy since Gen 6, Gen 1's single Special stat,
// Sp. Atk raised in Gen 6, and Magic Guard and Unaware arriving in Gens 4 and 5.
const clefable = {
  types: [{ name: 'fairy' }],
  stats: [stat('HP', 95), stat('Attack', 70), stat('Sp. Atk', 95), stat('Sp. Def', 90), stat('Speed', 60)],
  abilities: [ability('Cute Charm', 1), ability('Magic Guard', 2), ability('Unaware', 3, true)],
  pastTypes: [[5, [{ name: 'normal' }]]],
  pastStats: [
    [1, [stat('Special', 85)]],
    [5, [stat('Sp. Atk', 85)]],
  ],
  pastAbilities: [
    [3, [{ slot: 2, ability: null }]],
    [4, [{ slot: 3, ability: null }]],
  ],
} as unknown as IForm

describe('formInGeneration', () => {
  test("without a generation it is today's form", () => {
    expect(formInGeneration(clefable)).toEqual({
      types: clefable.types,
      stats: clefable.stats,
      abilities: clefable.abilities,
    })
  })

  test('Gen 1: Normal type, one Special stat, no abilities', () => {
    const { types, stats, abilities } = formInGeneration(clefable, 1)
    expect(types).toEqual([{ name: 'normal' }])
    expect(stats).toEqual([stat('HP', 95), stat('Attack', 70), stat('Special', 85), stat('Speed', 60)])
    expect(abilities).toEqual([])
  })

  test('Gen 3: abilities exist, but only those it had then', () => {
    const { stats, abilities } = formInGeneration(clefable, 3)
    expect(stats.map((s) => s.name)).toEqual(['HP', 'Attack', 'Sp. Atk', 'Sp. Def', 'Speed'])
    expect(stats[2].value).toBe(85)
    expect(abilities).toEqual([ability('Cute Charm', 1)])
  })

  test('Gen 5: hidden abilities appear; Gen 6: today', () => {
    expect(formInGeneration(clefable, 5).abilities.map((a) => a.name)).toEqual([
      'Cute Charm',
      'Magic Guard',
      'Unaware',
    ])
    expect(formInGeneration(clefable, 5).types).toEqual([{ name: 'normal' }])
    expect(formInGeneration(clefable, 6)).toEqual(formInGeneration(clefable))
  })
})

describe('movesInGame', () => {
  const data: MoveData = {
    moves: {
      flamethrower: ['fire', 'special', 90, 100, 15, [[17, 95, null, null, null]]],
      bite: ['dark', 'physical', 60, 100, 25, [[5, null, null, null, 'normal']]],
      growl: ['normal', 'status', null, 100, 40],
    },
    machines: { 'firered-leafgreen': { flamethrower: 'TM35' } },
  }
  const game = (id: string, generation: number, order: number) => ({ id, name: id, generation, order, versions: [], dlc: [], dexes: [] })
  const learnset = [
    { move: 'flamethrower', method: 'machine', level: 0 },
    { move: 'bite', method: 'level-up', level: 12 },
    { move: 'growl', method: 'level-up', level: 1 },
  ]

  test('gives the TM number and the power the move had in that game', () => {
    const [flamethrower] = movesInGame(learnset, game('firered-leafgreen', 3, 11), data)
    expect(flamethrower).toMatchObject({ machine: 'TM35', type: 'fire', category: 'special', power: 95, pp: 15 })
    expect(movesInGame(learnset, game('x-y', 6, 17), data)[0].power).toBe(90)
  })

  test("before Gen 4 a move's type decides its category", () => {
    const moves = (id: string, generation: number, order: number) =>
      Object.fromEntries(movesInGame(learnset, game(id, generation, order), data).map((m) => [m.move, m]))
    // Bite was a Normal (so physical) move in Gen 1, then Dark and so special in Gens 2 and 3.
    expect(moves('red-blue', 1, 3).bite).toMatchObject({ type: 'normal', category: 'physical' })
    expect(moves('gold-silver', 2, 5).bite).toMatchObject({ type: 'dark', category: 'special' })
    expect(moves('diamond-pearl', 4, 12).bite).toMatchObject({ type: 'dark', category: 'physical' })
    expect(moves('red-blue', 1, 3).growl.category).toBe('status')
  })
})

describe('pokedexEntries', () => {
  const game = (id: string, versions: string[]) =>
    ({ id, name: id, versions: versions.map((v) => ({ id: v, name: titleOf(v) })) }) as IGame
  const titleOf = (v: string) => v[0].toUpperCase() + v.slice(1)
  const redBlue = game('red-blue', ['red', 'blue'])
  const sunMoon = game('sun-moon', ['sun', 'moon'])
  const scarletViolet = game('scarlet-violet', ['scarlet', 'violet'])
  const games = [redBlue, sunMoon, scarletViolet]
  const entries = { red: 'Rare and cute.', blue: 'Rare and cute.', sun: 'Popular as a pet.', moon: 'Dances at night.' }

  test("lists the game's entries, merging versions that share a text", () => {
    expect(pokedexEntries(entries, games, redBlue)).toEqual({
      game: redBlue,
      entries: [{ text: 'Rare and cute.', versions: ['Red', 'Blue'] }],
    })
    expect(pokedexEntries(entries, games, sunMoon).entries).toEqual([
      { text: 'Popular as a pet.', versions: ['Sun'] },
      { text: 'Dances at night.', versions: ['Moon'] },
    ])
  })

  test('falls back to the newest game with entries', () => {
    expect(pokedexEntries(entries, games, scarletViolet).game).toBe(sunMoon)
    expect(pokedexEntries(entries, games).game).toBe(sunMoon)
    expect(pokedexEntries({}, games)).toEqual({ game: undefined, entries: [] })
  })
})

describe('evolutionIn', () => {
  const game = (id: string, generation: number, order: number, dlc: string[] = []) =>
    ({ id, name: id, generation, order, versions: [], dlc, dexes: [] }) as IGame
  const redBlue = game('red-blue', 1, 3)
  const goldSilver = game('gold-silver', 2, 5)
  const diamondPearl = game('diamond-pearl', 4, 12)
  const xY = game('x-y', 6, 17)
  const swordShield = game('sword-shield', 8, 22)
  const scarletViolet = game('scarlet-violet', 9, 27, ['the-teal-mask'])
  const games = [redBlue, goldSilver, diamondPearl, xY, swordShield, scarletViolet]

  const method = (text: string, game: string, location = false) => ({ text, game, location })
  const node = (name: string, number: number, methods: IEvolutionChain['methods'] = [], evolvesTo: IEvolutionChain[] = []) =>
    ({ name, number, formattedName: name, methods, evolvesTo }) as IEvolutionChain
  const names = (chains: IEvolutionChain[]): unknown[] =>
    chains.map((c) => (c.evolvesTo.length ? [c.name, names(c.evolvesTo)] : c.name))
  const textsOf = (chain: IEvolutionChain, name: string) =>
    chain.evolvesTo.find((c) => c.name === name)!.methods.map((m) => m.text)

  // Trimmed from PokeAPI's chain for Eevee.
  const eevee = node('eevee', 133, [], [
    node('vaporeon', 134, [method('Water Stone', 'red-blue')]),
    node('espeon', 196, [method('High friendship (day)', 'gold-silver')]),
    node('leafeon', 470, [
      method('at Eterna Forest', 'diamond-pearl', true),
      method('at Kalos Route 20', 'x-y', true),
      method('Leaf Stone', 'sword-shield'),
    ]),
    node('sylveon', 700, [
      method('knowing a Fairy move High affection', 'x-y'),
      method('knowing a Fairy move High friendship', 'sword-shield'),
    ]),
  ])

  test('leaves out Pokémon from later generations', () => {
    expect(names(evolutionIn(eevee, games, redBlue))).toEqual([['eevee', ['vaporeon']]])
    expect(names(evolutionIn(eevee, games, goldSilver))).toEqual([['eevee', ['vaporeon', 'espeon']]])
  })

  test("splits a line whose first Pokémon came later, like Pichu's", () => {
    const pichu = node('pichu', 172, [], [
      node('pikachu', 25, [method('High friendship', 'gold-silver')], [node('raichu', 26, [method('Thunder Stone', 'red-blue')])]),
    ])
    const [pikachu] = evolutionIn(pichu, games, redBlue)
    expect(names([pikachu])).toEqual([['pikachu', ['raichu']]])
    expect(pikachu.methods).toEqual([])
  })

  test("shows the methods of the game, with places only in that game's generation", () => {
    const [inDp] = evolutionIn(eevee, games, diamondPearl)
    expect(textsOf(inDp, 'leafeon')).toEqual(['at Eterna Forest'])
    const [inXy] = evolutionIn(eevee, games, xY)
    expect(textsOf(inXy, 'leafeon')).toEqual(['at Kalos Route 20'])
    expect(textsOf(inXy, 'sylveon')).toEqual(['knowing a Fairy move High affection'])
    const [inSv] = evolutionIn(eevee, games, scarletViolet)
    expect(textsOf(inSv, 'leafeon')).toEqual(['Leaf Stone'])
    expect(textsOf(inSv, 'sylveon')).toEqual(['knowing a Fairy move High friendship'])
  })

  test("counts a DLC's methods as its game's, and ignores side games", () => {
    const applin = node('applin', 840, [], [
      node('dipplin', 1011, [method('Syrupy Apple', 'the-teal-mask'), method('Odd Candy', 'colosseum')]),
    ])
    expect(textsOf(evolutionIn(applin, games, scarletViolet)[0], 'dipplin')).toEqual(['Syrupy Apple'])
  })

  test('without a game, the whole line with the newest methods', () => {
    const [line] = evolutionIn(eevee, games)
    expect(names([line])).toEqual([['eevee', ['vaporeon', 'espeon', 'leafeon', 'sylveon']]])
    expect(textsOf(line, 'leafeon')).toEqual(['Leaf Stone'])
  })
})
