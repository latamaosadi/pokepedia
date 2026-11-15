// Geometry for the Pokédex list: fixed-height rows in a scrolling viewport, where
// the "selection line" is on the first row at the very top, on the last row at the
// very end, and in the middle of the viewport otherwise.

export interface ListGeometry {
  itemSize: number
  count: number
  viewHeight: number
  /** Empty space above the first row and below the last. */
  padding: number
}

export const maxScroll = ({ itemSize, count, viewHeight, padding }: ListGeometry) =>
  Math.max(0, count * itemSize + 2 * padding - viewHeight)

// Distance from the top of the list content to the centre of row `index`.
const rowCenter = ({ itemSize, padding }: ListGeometry, index: number) =>
  padding + itemSize / 2 + index * itemSize

/** Selection line in px from the top of the viewport. */
export function selectionLine(geometry: ListGeometry, scrollTop: number) {
  const edge = geometry.padding + geometry.itemSize / 2
  return Math.max(
    Math.min(edge + scrollTop, geometry.viewHeight / 2),
    geometry.viewHeight - edge - (maxScroll(geometry) - scrollTop),
  )
}

/** Px between a row's centre and the selection line (negative = above it). */
export function offsetFromLine(geometry: ListGeometry, index: number, scrollTop: number) {
  return rowCenter(geometry, index) - scrollTop - selectionLine(geometry, scrollTop)
}

export function selectedIndex(geometry: ListGeometry, scrollTop: number) {
  const { itemSize, count } = geometry
  const lineInContent = scrollTop + selectionLine(geometry, scrollTop)
  const index = Math.round((lineInContent - rowCenter(geometry, 0)) / itemSize)
  return Math.min(count - 1, Math.max(0, index))
}

/** The scroll offset at which row `index` sits exactly on the selection line. */
export function snapPoint(geometry: ListGeometry, index: number) {
  const { itemSize, viewHeight } = geometry
  const max = maxScroll(geometry)
  const center = rowCenter(geometry, index)
  // While the line follows the first row down, rows reach it every half a row.
  const atTop = (index * itemSize) / 2
  const atMiddle = center - viewHeight / 2
  const atBottom = (center - viewHeight + rowCenter(geometry, 0) + max) / 2
  return Math.min(max, Math.max(0, Math.min(Math.max(atTop, atMiddle), atBottom)))
}
