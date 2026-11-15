// Geometry for folding a page over like paper. The page is a rectangle; a straight fold
// line splits it into the front that stays put (spine side) and the part that folds over,
// which lands mirrored across the fold line as a flap showing the paper's back.

export interface Point {
  x: number
  y: number
}

export interface Page {
  left: number // the spine
  right: number
  top: number
  bottom: number
}

/** Keeps the part of a convex polygon where normal · p <= offset (Sutherland–Hodgman). */
export function clipToHalfPlane(polygon: Point[], normal: Point, offset: number): Point[] {
  const side = (p: Point) => normal.x * p.x + normal.y * p.y - offset
  const result: Point[] = []
  polygon.forEach((current, i) => {
    const next = polygon[(i + 1) % polygon.length]
    const a = side(current)
    const b = side(next)
    if (a <= 0) result.push(current)
    if ((a < 0 && b > 0) || (a > 0 && b < 0)) {
      const t = a / (a - b)
      result.push({ x: current.x + (next.x - current.x) * t, y: current.y + (next.y - current.y) * t })
    }
  })
  return result
}

/**
 * Folds `page` along the line through `through` that leans `angle` radians from vertical
 * (positive leans like "\", negative like "/"). Returns the front left showing, the flap
 * (mirrored across the fold, kept inside the spine and top edge), and the fold's normal,
 * which points from the front towards the side that folds.
 */
export function foldPage(page: Page, through: Point, angle: number) {
  const normal = { x: Math.cos(angle), y: -Math.sin(angle) }
  const offset = normal.x * through.x + normal.y * through.y
  const rect = [
    { x: page.left, y: page.top },
    { x: page.right, y: page.top },
    { x: page.right, y: page.bottom },
    { x: page.left, y: page.bottom },
  ]
  const front = clipToHalfPlane(rect, normal, offset)
  const folded = clipToHalfPlane(rect, { x: -normal.x, y: -normal.y }, -offset)
  const mirrored = folded.map((p) => {
    const distance = normal.x * p.x + normal.y * p.y - offset
    return { x: p.x - 2 * distance * normal.x, y: p.y - 2 * distance * normal.y }
  })
  const insideSpine = clipToHalfPlane(mirrored, { x: -1, y: 0 }, -page.left)
  const flap = clipToHalfPlane(insideSpine, { x: 0, y: -1 }, -page.top)
  return { front, flap, normal }
}

/** Area of a polygon (shoelace), handy for checking folds. */
export function area(polygon: Point[]) {
  let sum = 0
  polygon.forEach((p, i) => {
    const q = polygon[(i + 1) % polygon.length]
    sum += p.x * q.y - q.x * p.y
  })
  return Math.abs(sum) / 2
}

/**
 * A CSS linear-gradient across a `width`×`height` box running in `direction` (unit vector,
 * screen coordinates), with stops in px measured from the line through `from`.
 */
export function gradientFrom(
  from: Point,
  direction: Point,
  width: number,
  height: number,
  stops: [offset: number, color: string][],
) {
  const angle = Math.atan2(direction.x, -direction.y)
  const length = Math.abs(width * Math.sin(angle)) + Math.abs(height * Math.cos(angle))
  const start = { x: width / 2 - (direction.x * length) / 2, y: height / 2 - (direction.y * length) / 2 }
  const at = (from.x - start.x) * direction.x + (from.y - start.y) * direction.y
  const round = (n: number) => Math.round(n * 10) / 10
  const list = stops.map(([offset, color]) => `${color} ${round(at + offset)}px`).join(', ')
  return `linear-gradient(${round((angle * 180) / Math.PI)}deg, ${list})`
}

export const polygonPath = (points: Point[], shift: Point = { x: 0, y: 0 }) =>
  points.length
    ? `polygon(${points.map((p) => `${p.x - shift.x}px ${p.y - shift.y}px`).join(', ')})`
    : 'polygon(0 0)'
