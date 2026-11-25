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
  /** PokeAPI name, e.g. 'solar-power'. */
  id: string
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
  /** Effort values gained for defeating it, e.g. [{ name: 'Sp. Atk', value: 2 }]. */
  evYield: IStat[]
  abilities: IAbility[]
  /** Items it can hold in the wild, per version, e.g. heldItems.red… (none in Gen 1). */
  heldItems: Record<string, IHeldItem[]>
  cry?: string
  // What changed since older games, for showing a form as it was in the selected game.
  pastTypes: Past<IType[]>[]
  /** Only the stats that changed; Gen 1 has a single Special stat. */
  pastStats: Past<IStat[]>[]
  /** By slot; null where the slot was empty (no hidden ability yet). */
  pastAbilities: Past<{ slot: number; ability: IAbility | null }[]>[]
  /** Moves it learns in each game (version group), e.g. learnset['red-blue']. */
  learnset: Record<string, ILearnedMove[]>
}

export interface IHeldItem {
  name: string
  sprite: string
  /** Chance in percent. */
  rarity: number
}

export interface ILearnedMove {
  move: string
  /** PokeAPI learn method: 'level-up', 'machine', 'egg', 'tutor'… */
  method: string
  level: number
}

/** A move as it was in a game, ready to list. */
export interface IMoveRow extends ILearnedMove {
  machine?: string
  type: PokemonType
  category: string
  power: number | null
  accuracy: number | null
  pp: number | null
}

export interface IEvolutionMethod {
  /** e.g. "Lv. 16", "Water Stone", "at Eterna Forest" */
  text: string
  itemSprite?: string
  /** The version group PokeAPI lists the method for; it holds in later games until replaced. */
  game?: string
  /** Tied to a place in that game's region, like Leafeon's Moss Rock. */
  location: boolean
}

export interface IEvolutionChain extends IPokemon {
  /** Ways to evolve into this Pokémon, across all games. */
  methods: IEvolutionMethod[]
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
  /** English Pokédex entry per version, e.g. { red: '…', blue: '…' }. */
  entries: Record<string, string>
  forms: IForm[]
  evolutionChain: IEvolutionChain | null
  /** 3 (hardest) to 255. */
  captureRate: number
  baseFriendship: number | null
  growthRate: string
  eggGroups: string[]
  /** Chance of being female in eighths; -1 when genderless. */
  genderRate: number
  eggCycles: number
}

export interface IGame {
  id: string
  name: string
  generation: number
  order: number
  /** The versions sold as this game, e.g. Red and Blue; each has its own Pokédex entries. */
  versions: { id: string; name: string }[]
  /** Its DLC's version groups, e.g. the-teal-mask, which PokeAPI tags some evolutions with. */
  dlc: string[]
  /** The game's Pokédexes (DLC areas get their own); species in entry order, numbered from `start`. */
  dexes: { name: string; start: number; species: number[] }[]
}
