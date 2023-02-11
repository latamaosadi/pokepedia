const baseUrl =
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon'

export function animatedSprite(id: string | number) {
  return `${baseUrl}/versions/generation-v/black-white/animated/${id}.gif`
}

export function defaultSprite(id: string | number) {
  return `${baseUrl}/${id}.png`
}

export function artwork(id: string | number) {
  return `${baseUrl}/other/official-artwork/${id}.png`
}
