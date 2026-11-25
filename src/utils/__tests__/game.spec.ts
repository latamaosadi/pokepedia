import { describe, expect, test } from 'vitest'
import type { IForm } from '@/types/pokemon'
import { formInGeneration } from '../game'

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
