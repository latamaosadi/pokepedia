const baseUrl = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon'

export function defaultSprite(id: string | number) {
  return `${baseUrl}/${id}.png`
}

export function artwork(id: string | number, shiny = false) {
  let url = `${baseUrl}/other/official-artwork`
  if (shiny) {
    url += '/shiny'
  }
  return `${url}/${id}.png`
}

export function itemSprite(name: string) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${name}.png`
}
