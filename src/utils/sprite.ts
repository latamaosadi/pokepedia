const baseUrl =
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon'

export function animatedSprite(id: string | number) {
  return `${baseUrl}/versions/generation-v/black-white/animated/${id}.gif`
}

export function defaultSprite(id: string | number) {
  return `${baseUrl}/${id}.png`
}

export function artwork(id: string | number, shiny = false) {
  let url = `${baseUrl}/other/official-artwork/`
  if (shiny) {
    url += 'shiny/'
  }
  return `${url}/${id}.png`
}

export function homeModel(id: string | number) {
  return `${baseUrl}/other/home/${id}.png`
}
