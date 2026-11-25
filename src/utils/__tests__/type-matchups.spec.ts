import { describe, expect, test } from 'vitest'
import { defensiveMatchups } from '../type-matchups'

const asMap = (types: string[], generation?: number) =>
  Object.fromEntries(defensiveMatchups(types, generation).map((g) => [g.multiplier, [...g.types].sort()]))

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

  test('uses the chart of the given generation: Steel resisted Ghost and Dark before Gen 6', () => {
    expect(asMap(['steel'], 5)[0.5]).toContain('ghost')
    expect(asMap(['steel'], 6)[0.5]).not.toContain('ghost')
  })

  test('types that did not exist yet are left out: no Fairy, Dark or Steel in Gen 1', () => {
    const types = asMap(['dragon'], 1)
    expect(Object.values(types).flat()).not.toContain('fairy')
    expect(asMap(['psychic'], 1)).toEqual({ 2: ['bug'], 0.5: ['fighting', 'psychic'], 0: ['ghost'] })
  })
})
