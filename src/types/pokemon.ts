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

export interface IType {
  name: PokemonType
  id?: number
  pokemon?: []
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

export interface IPokemon {
  name: string
  number: number
  sprite: string
  color?: string
  types?: IType[]
}

export interface IEvolutionDetail {
  method: EvolutionMethod
}

export interface IEvolutionChain extends IPokemon {
  evolutionDetail: IEvolutionDetail
  evolvesTo: IEvolutionChain[]
}

export interface IPokemonInfo extends IPokemon {
  animatedSprite: string | null
  artwork: string
  moves: IMove[]
  evolutionChain: IEvolutionChain[]
}

export interface IPokemonList {
  pageSize: number
  page: number
  data: IPokemon[]
  loading: boolean
}

export interface IBaseList {
  types: IType[]
  colors: IType[]
}
