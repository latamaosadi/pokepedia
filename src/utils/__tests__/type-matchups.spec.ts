import { describe, expect, test } from 'vitest'
import { defensiveMatchups, teamCoverage, teamDefense } from '../type-matchups'

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

describe('teamDefense', () => {
  const byType = (rows: ReturnType<typeof teamDefense>) => Object.fromEntries(rows.map((r) => [r.type, r]))

  test('counts members weak to and resisting each attacking type', () => {
    // Charizard (Fire/Flying), Blastoise (Water), Venusaur (Grass/Poison)
    const team = byType(teamDefense([['fire', 'flying'], ['water'], ['grass', 'poison']]))
    expect(team.rock).toEqual({ type: 'rock', weak: 1, resist: 0 })
    expect(team.electric).toEqual({ type: 'electric', weak: 2, resist: 1 })
    expect(team.ground).toEqual({ type: 'ground', weak: 0, resist: 1 })
  })

  test("uses the generation's chart", () => {
    expect(teamDefense([['normal']], 1).map((r) => r.type)).not.toContain('fairy')
  })
})

test('teamCoverage lists the team types hitting each type super effectively', () => {
  const coverage = Object.fromEntries(
    teamCoverage([['fire', 'flying'], ['water']]).map((row) => [row.type, row.hitBy]),
  )
  expect(coverage.grass).toEqual(['fire', 'flying'])
  expect(coverage.rock).toEqual(['water'])
  expect(coverage.dragon).toEqual([])
})
