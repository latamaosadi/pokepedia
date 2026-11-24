import { describe, expect, test } from 'vitest'
import { opaqueBounds, poseHeight, sizeScale, TRAINER_HEIGHT } from '../size-compare'

describe('sizeScale', () => {
  test('a Pokémon shorter than the trainer: the trainer fills the box', () => {
    // Pikachu, 0.4 m
    expect(sizeScale(0.4, 200)).toEqual({ pokemon: 50, trainer: 200 })
  })

  test('a Pokémon taller than the trainer: the Pokémon fills the box', () => {
    // Wailord, 14.5 m
    const { pokemon, trainer } = sizeScale(14.5, 200)
    expect(pokemon).toBe(200)
    expect(trainer).toBeCloseTo((200 * TRAINER_HEIGHT) / 14.5)
  })

  test('both figures keep the same ratio as their real heights', () => {
    for (const height of [0.1, 1.7, 20, 100]) {
      const { pokemon, trainer } = sizeScale(height, 180)
      expect(pokemon / trainer).toBeCloseTo(height / TRAINER_HEIGHT)
      expect(Math.max(pokemon, trainer)).toBeCloseTo(180)
    }
  })
})

describe('opaqueBounds', () => {
  // A 10×10 RGBA image with alpha set inside the given rectangle.
  const image = (x0: number, y0: number, x1: number, y1: number, alpha = 255) => {
    const data = new Uint8ClampedArray(10 * 10 * 4)
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) data[(y * 10 + x) * 4 + 3] = alpha
    return data
  }

  test('finds the visible area inside transparent margins', () => {
    expect(opaqueBounds(image(2, 1, 7, 9), 10, 10)).toEqual({ top: 0.1, bottom: 0.9, left: 0.2, right: 0.7 })
  })

  test('ignores nearly transparent pixels such as soft shadows', () => {
    const data = image(2, 1, 7, 9)
    data[(9 * 10 + 0) * 4 + 3] = 10 // faint pixel in the bottom-left corner
    expect(opaqueBounds(data, 10, 10)).toEqual({ top: 0.1, bottom: 0.9, left: 0.2, right: 0.7 })
  })

  test('returns null for a fully transparent image', () => {
    expect(opaqueBounds(new Uint8ClampedArray(10 * 10 * 4), 10, 10)).toBeNull()
  })
})

describe('poseHeight', () => {
  const box = (width: number, height: number) => ({ top: 0, bottom: height, left: 0, right: width })

  test('upright Pokémon stand at their listed height', () => {
    expect(poseHeight(1.7, 'upright', box(0.9, 0.8))).toBe(1.7)
  })

  test("a fish's length is its longest side", () => {
    // Wailord, 14.5 m long, drawn twice as long as it is tall.
    expect(poseHeight(14.5, 'fish', box(1, 0.5))).toBeCloseTo(7.25)
    // A fish drawn upright stands at its full length.
    expect(poseHeight(1, 'fish', box(0.5, 1))).toBe(1)
  })

  test("a serpent's length runs along its width and up its height", () => {
    // Arbok, 3.5 m long, reared up in a pose as tall as it is wide.
    expect(poseHeight(3.5, 'squiggle', box(0.6, 0.6))).toBeCloseTo(1.75)
  })
})
