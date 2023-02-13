import { RemovableRef } from '@vueuse/core'

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

export enum EvolutionMethodEnum {
  UseItem = 'use-item',
  LevelUp = 'level-up',
  Trade = 'trade',
  Shed = 'shed',
  Spin = 'spin',
  TowerOfDarkness = 'tower-of-darkness',
  TowerOfWater = 'tower-of-water',
  ThreeCriticalHits = 'three-critical-hits',
  TakeDamage = 'take-damage',
  Other = 'other',
  AgileStyleMove = 'agile-style-move',
  StrongStyleMove = 'strong-style-move',
  RecoilDamage = 'recoil-damage',
}
export type EvolutionMethod = `${EvolutionMethodEnum}`

export enum DamageClassEnum {
  Status = 'status',
  Physical = 'physical',
  Special = 'special',
}
export type DamageClass = `${DamageClassEnum}`

export enum RegionEnum {
  All = 'all',
  Kanto = 'kanto',
  Johto = 'johto',
  Hoenn = 'hoenn',
  Sinnoh = 'sinnoh',
  Unova = 'unova',
  Kalos = 'kalos',
  Alola = 'alola',
  Galar = 'galar',
  Paldea = 'paldea',
}

export interface INamedResource {
  name: string
  url?: string
}

export interface IType {
  name: PokemonType
  id?: number
  pokemon?: []
}

export interface IForm {
  id: number
  name: string
  value: string
  sprite?: string
  artwork?: string
  height?: string
  weight?: string
  types?: IType[]
}

export interface IItem {
  id: string
  name: string
  description: string
  type: string
  sprite?: string
}

export interface IPokemonSpecies {
  id: number
  name: string
  formattedName: string
  pokedexNumber: number
  isBaby: boolean
  isLegendary: boolean
  isMythical: boolean
  genus: string
  color: string
  description: string
  evolutionUrl: string
  varietiesUrl: string[]
}

export interface IMove {
  name: string
  id: number
  accuracy: number
  pp: number
  power: number
  type: IType
  damageClass: DamageClass
}

export interface IEvolutionDetail {
  method: EvolutionMethod
  minHappiness?: number
  minLevel?: number
  heldItem?: string
  item?: IItem | null
  location?: string
  timeOfDay?: string
}

export interface IEvolutionChain extends IPokemon {
  evolutionDetail: IEvolutionDetail
  evolvesTo: IEvolutionChain[]
}

export interface IPokemon {
  name: string
  formattedName: string
  number: number
  sprite: string
  artwork?: string
  color?: string
  types?: IType[]
}

export interface IPokemonInfo extends IPokemon {
  animatedSprite: string | null
  moves: IMove[]
  evolutionChain: IEvolutionChain
  genus: string
  description: string
  height?: string
  weight?: string
  forms: IForm[]
}

export interface IPokemonList {
  pageSize: number
  page: number
  data: IPokemon[]
  loading: boolean
}

export interface IBaseList {
  types: IType[] | RemovableRef<[]>
  colors: IType[] | RemovableRef<[]>
}
