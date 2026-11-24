// Size comparison between a Pokémon and a trainer, drawn to the same scale.

/** The trainer shown for scale, in metres. */
export const TRAINER_HEIGHT = 1.6

/** Pixel heights for both figures, scaled so the taller one fills `boxHeight`. */
export function sizeScale(pokemonHeight: number, boxHeight: number, trainerHeight = TRAINER_HEIGHT) {
  const pxPerMetre = boxHeight / Math.max(pokemonHeight, trainerHeight)
  return { pokemon: pokemonHeight * pxPerMetre, trainer: trainerHeight * pxPerMetre }
}

/** Where an image's visible content sits, as fractions of its width and height. */
export interface Bounds {
  top: number
  bottom: number
  left: number
  right: number
}

/**
 * Bounds of the pixels more opaque than `threshold` (0–255) in RGBA data, or null if the
 * image is fully transparent. Official artwork has transparent margins of varying size,
 * so this is what gets scaled to the Pokémon's real height.
 */
export function opaqueBounds(
  data: ArrayLike<number>,
  width: number,
  height: number,
  threshold = 16,
): Bounds | null {
  let top = height
  let bottom = -1
  let left = width
  let right = -1
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] <= threshold) continue
      if (y < top) top = y
      if (y > bottom) bottom = y
      if (x < left) left = x
      if (x > right) right = x
    }
  }
  if (bottom < 0) return null
  return { top: top / height, bottom: (bottom + 1) / height, left: left / width, right: (right + 1) / width }
}

const SAMPLE_SIZE = 128
const measured = new Map<string, Promise<Bounds | null>>()

/** Measures an image's visible bounds by drawing it to a small canvas; cached per URL. */
export function measureBounds(url: string): Promise<Bounds | null> {
  let result = measured.get(url)
  if (!result) {
    result = new Promise((resolve) => {
      const image = new Image()
      image.crossOrigin = 'anonymous'
      image.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = canvas.height = SAMPLE_SIZE
        const context = canvas.getContext('2d', { willReadFrequently: true })
        if (!context) return resolve(null)
        context.drawImage(image, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE)
        const { data } = context.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE)
        resolve(opaqueBounds(data, SAMPLE_SIZE, SAMPLE_SIZE))
      }
      image.onerror = () => resolve(null)
      // A separate URL, so the service worker's copy from plain <img> loads (opaque, and
      // unreadable by a canvas) isn't reused for this cross-origin request.
      image.src = `${url}?bounds`
    })
    measured.set(url, result)
  }
  return result
}
