import { describe, expect, test } from 'vitest'
import {
  maxScroll,
  offsetFromLine,
  selectedIndex,
  selectionLine,
  snapPoint,
  type ListGeometry,
} from '../dex-scroll'

const geometries: ListGeometry[] = [
  { itemSize: 56, count: 1025, viewHeight: 320, padding: 16 },
  { itemSize: 56, count: 1025, viewHeight: 777, padding: 16 },
  { itemSize: 56, count: 1025, viewHeight: 320, padding: 0 },
  { itemSize: 56, count: 12, viewHeight: 320, padding: 16 },
]

describe.each(geometries)('Pokédex list geometry %o', (geometry) => {
  const indexes = [...Array(geometry.count).keys()]

  test('every row is selected, and centred on the line, at its own snap point', () => {
    for (const index of indexes) {
      const top = snapPoint(geometry, index)
      expect(selectedIndex(geometry, top)).toBe(index)
      expect(offsetFromLine(geometry, index, top)).toBeCloseTo(0)
    }
  })

  test('snap points run from the top of the list to the bottom, in order', () => {
    const points = indexes.map((index) => snapPoint(geometry, index))
    expect(points[0]).toBe(0)
    expect(points.at(-1)).toBe(maxScroll(geometry))
    points.slice(1).forEach((point, i) => expect(point).toBeGreaterThan(points[i]))
  })

  test('the line starts on the first row, ends on the last, and is centred between', () => {
    const edge = geometry.padding + geometry.itemSize / 2
    expect(selectionLine(geometry, 0)).toBe(edge)
    expect(selectionLine(geometry, maxScroll(geometry))).toBe(geometry.viewHeight - edge)
    expect(selectionLine(geometry, maxScroll(geometry) / 2)).toBe(geometry.viewHeight / 2)
  })
})
