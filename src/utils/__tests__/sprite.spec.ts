import { describe, expect, test } from 'vitest'
import { typeIcon } from '../sprite'

describe('typeIcon', () => {
  test.each([
    ['normal', 1],
    ['fire', 10],
    ['water', 11],
    ['fairy', 18],
  ] as const)('%s uses PokeAPI type %i', (type, id) => {
    expect(typeIcon(type)).toMatch(new RegExp(`/types/generation-viii/sword-shield/small/${id}\\.png$`))
  })
})
