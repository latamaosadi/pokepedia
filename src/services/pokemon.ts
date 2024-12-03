import type { INamedResource, IPokemon } from '@/types/pokemon'
import { artwork, defaultSprite } from '@/utils/sprite'
import { titleCase } from '@/utils/string'

export async function getPokemonList(): Promise<IPokemon[]> {
  const size = 1025
  const response = await fetch(`https://pokeapi.co/api/v2/pokemon-species?limit=${size}`)
  const data = await response.json()

  function getPokemonNumber(url: string) {
    const match = url.match(/\/(\d+)\/?$/)
    return match ? parseInt(match[1]) : 0 // Return the matched group or an empty string if no match
  }

  return data.results.map(
    (pokemon: INamedResource, index: number): IPokemon => ({
      name: pokemon.name,
      formattedName: titleCase(pokemon.name),
      number: getPokemonNumber(pokemon.url || ''),
      sprite: defaultSprite(getPokemonNumber(pokemon.url || '')),
      artwork: artwork(getPokemonNumber(pokemon.url || '')),
    }),
  )
}
