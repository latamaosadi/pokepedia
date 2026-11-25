import { describe, expect, test } from 'vitest'
import { NATURES, statAt } from '../stats'

describe('statAt', () => {
  // Bulbapedia's worked example: a level 78 Adamant Garchomp.
  test('Gen 3+ formula with nature', () => {
    expect(statAt({ name: 'HP', base: 108, iv: 24, ev: 74 }, 78, 'Adamant')).toBe(289)
    expect(statAt({ name: 'Attack', base: 130, iv: 12, ev: 190 }, 78, 'Adamant')).toBe(278)
    expect(statAt({ name: 'Sp. Atk', base: 80, iv: 16, ev: 48 }, 78, 'Adamant')).toBe(135)
    expect(statAt({ name: 'Speed', base: 102, iv: 5, ev: 23 }, 78, 'Adamant')).toBe(171)
  })

  test('Gen 1–2 formula: DVs and stat experience, no natures', () => {
    // Mewtwo's highest Gen 1 HP and Special.
    expect(statAt({ name: 'HP', base: 106, iv: 15, ev: 65535 }, 100, 'Adamant', 1)).toBe(416)
    expect(statAt({ name: 'Special', base: 154, iv: 15, ev: 65535 }, 100, 'Modest', 1)).toBe(407)
  })

  test('Shedinja always has 1 HP', () => {
    expect(statAt({ name: 'HP', base: 1, iv: 31, ev: 252 }, 100, 'Hardy')).toBe(1)
  })
})

test('25 natures, five of them neutral', () => {
  expect(NATURES).toHaveLength(25)
  expect(NATURES.filter((n) => n.up === n.down).map((n) => n.name)).toEqual([
    'Hardy', 'Docile', 'Serious', 'Bashful', 'Quirky',
  ])
  expect(NATURES.find((n) => n.name === 'Adamant')).toEqual({ name: 'Adamant', up: 'Attack', down: 'Sp. Atk' })
})
