import { describe, expect, test } from 'vitest'
import { area, foldPage, gradientFrom, type Page } from '../page-fold'

const page: Page = { left: 0, right: 300, top: 0, bottom: 600 }
const pageArea = 300 * 600

describe('foldPage', () => {
  test('a vertical fold through the middle leaves half the front and folds the rest onto it', () => {
    const { front, flap } = foldPage(page, { x: 150, y: 300 }, 0)

    expect(area(front)).toBeCloseTo(pageArea / 2)
    expect(area(flap)).toBeCloseTo(pageArea / 2)
    // The flap lands exactly over the front, mirrored.
    expect(Math.min(...flap.map((p) => p.x))).toBeCloseTo(0)
    expect(Math.max(...flap.map((p) => p.x))).toBeCloseTo(150)
  })

  test('a fold at the free edge leaves the page flat; at the spine the page is fully over', () => {
    const flat = foldPage(page, { x: 300, y: 300 }, 0)
    expect(area(flat.front)).toBeCloseTo(pageArea)
    expect(area(flat.flap)).toBeCloseTo(0)

    const over = foldPage(page, { x: 0, y: 300 }, 0)
    expect(area(over.front)).toBeCloseTo(0)
  })

  test('a tilted fold peels the bottom corner first, and paper is never lost', () => {
    // Leaning like "/" through a point low on the right: only the bottom-right corner folds.
    const { front, flap } = foldPage(page, { x: 250, y: 550 }, -0.4)
    const folded = pageArea - area(front)

    expect(folded).toBeGreaterThan(0)
    expect(folded).toBeLessThan(pageArea * 0.05)
    // The flap is the folded corner mirrored, so it has the same area (nothing crosses the spine here).
    expect(area(flap)).toBeCloseTo(folded)
    // The top-right corner is untouched.
    expect(front).toContainEqual({ x: 300, y: 0 })
  })

  test('the flap is trimmed at the spine and the top edge', () => {
    const { flap } = foldPage(page, { x: 60, y: 100 }, 0.3)

    expect(Math.min(...flap.map((p) => p.x))).toBeGreaterThanOrEqual(-1e-9)
    expect(Math.min(...flap.map((p) => p.y))).toBeGreaterThanOrEqual(-1e-9)
  })
})

describe('gradientFrom', () => {
  test('places stops measured from the given line, whatever the direction', () => {
    // Pointing right, the gradient line runs along x, so a line at x=100 is 100px in.
    expect(gradientFrom({ x: 100, y: 50 }, { x: 1, y: 0 }, 400, 800, [[0, 'red'], [20, 'blue']])).toBe(
      'linear-gradient(90deg, red 100px, blue 120px)',
    )
    // Pointing left, it starts at the right edge: x=100 is 300px in.
    expect(gradientFrom({ x: 100, y: 50 }, { x: -1, y: 0 }, 400, 800, [[0, 'red']])).toBe(
      'linear-gradient(-90deg, red 300px)',
    )
  })
})
