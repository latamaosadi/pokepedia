import { PokemonTypeEnum, type PokemonType } from '@/types/pokemon'

const baseUrl = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon'

export function defaultSprite(id: string | number, shiny = false) {
  return shiny ? `${baseUrl}/shiny/${id}.png` : `${baseUrl}/${id}.png`
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

// PokeAPI numbers the types in the same order as PokemonTypeEnum (normal = 1 … fairy = 18).
const typeIds: string[] = Object.values(PokemonTypeEnum)

/** The type's round symbol (Sword & Shield style), e.g. a flame for Fire. */
export function typeIcon(type: PokemonType) {
  const id = typeIds.indexOf(type) + 1
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/types/generation-viii/sword-shield/small/${id}.png`
}
