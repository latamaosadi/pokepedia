export enum PokemonTypeEnum {
  Normal = 'normal',
  Fighting = 'fighting',
  Flying = 'flying',
  Poison = 'poison',
  Ground = 'ground',
  Rock = 'rock',
  Bug = 'bug',
  Ghost = 'ghost',
  Steel = 'steel',
  Fire = 'fire',
  Water = 'water',
  Grass = 'grass',
  Electric = 'electric',
  Psychic = 'psychic',
  Ice = 'ice',
  Dragon = 'dragon',
  Dark = 'dark',
  Fairy = 'fairy',
  Unknown = 'unknown',
  Shadow = 'shadow',
}
export type PokemonType = `${PokemonTypeEnum}`

export interface INamedResource {
  name: string
  url?: string
}

export interface IType {
  name: PokemonType
  id?: number
  pokemon?: number[]
}

export interface IPokemon {
  name: string
  formattedName: string
  number: number
  /** Number in the selected game's regional Pokédex. */
  dexNumber?: number
  /** Which of the game's Pokédexes that number is in, for games with several (Galar, Isle of Armor…). */
  dexName?: string
  sprite: string
  artwork?: string
  color?: string
  types?: IType[]
}

export interface IStat {
  name: string
  value: number
}

export interface IAbility {
  name: string
  hidden: boolean
  slot: number
}

/** [last generation, value]: what something was up to and including that generation. */
export type Past<T> = [number, T]

export interface IForm {
  id: number
  name: string
  types: IType[]
  height: string
  heightMeters: number
  weight: string
  sprite: string
  artwork: string
  stats: IStat[]
  abilities: IAbility[]
  cry?: string
  // What changed since older games, for showing a form as it was in the selected game.
  pastTypes: Past<IType[]>[]
  /** Only the stats that changed; Gen 1 has a single Special stat. */
  pastStats: Past<IStat[]>[]
  /** By slot; null where the slot was empty (no hidden ability yet). */
  pastAbilities: Past<{ slot: number; ability: IAbility | null }[]>[]
}

export interface IEvolutionChain extends IPokemon {
  requirement?: string
  itemSprite?: string
  evolvesTo: IEvolutionChain[]
}

export interface IPokemonInfo {
  name: string
  formattedName: string
  number: number
  color: string
  /** PokeAPI body shape, e.g. 'upright', 'squiggle' (serpentine), 'fish'. */
  shape: string
  genus: string
  description: string
  forms: IForm[]
  evolutionChain: IEvolutionChain | null
}

export interface IGame {
  id: string
  name: string
  generation: number
  order: number
  /** The game's Pokédexes (DLC areas get their own); species in entry order, numbered from `start`. */
  dexes: { name: string; start: number; species: number[] }[]
}
