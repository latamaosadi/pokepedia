import { describe, expect, test } from 'vitest'
import type { IForm } from '@/types/pokemon'
import { formInGeneration, movesInGame, type MoveData } from '../game'

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
  const game = (id: string, generation: number, order: number) => ({ id, name: id, generation, order, dexes: [] })
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
