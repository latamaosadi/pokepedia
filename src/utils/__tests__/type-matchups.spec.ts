import { describe, expect, test } from 'vitest'
import { defensiveMatchups } from '../type-matchups'

const asMap = (types: string[]) =>
  Object.fromEntries(defensiveMatchups(types).map((g) => [g.multiplier, [...g.types].sort()]))

describe('defensiveMatchups', () => {
  test('combines both types: Charizard (Fire/Flying)', () => {
    expect(asMap(['fire', 'flying'])).toEqual({
      4: ['rock'],
      2: ['electric', 'water'],
      0.5: ['fairy', 'fighting', 'fire', 'steel'],
      0.25: ['bug', 'grass'],
      0: ['ground'],
    })
  })

  test('an immunity wins over a weakness: Gengar (Ghost/Poison) takes nothing from Normal or Fighting', () => {
    const matchups = asMap(['ghost', 'poison'])
    expect(matchups[0]).toEqual(['fighting', 'normal'])
    expect(matchups[2]).toEqual(['dark', 'ghost', 'ground', 'psychic'])
  })

  test('single type: Pikachu (Electric)', () => {
    expect(asMap(['electric'])).toEqual({
      2: ['ground'],
      0.5: ['electric', 'flying', 'steel'],
    })
  })
})
