import type {
  IAbility,
  IEvolutionChain,
  IEvolutionMethod,
  IForm,
  IGame,
  ILearnedMove,
  IMoveRow,
  IStat,
  Past,
  PokemonType,
} from '@/types/pokemon'
import { typesInGeneration } from './pokemon'

// Abilities arrived in Gen 3, hidden abilities in Gen 5.
const ABILITIES_FROM = 3
const HIDDEN_ABILITIES_FROM = 5

/**
 * Applies the past values that still held in `generation`: walking from the newest change
 * to the oldest, so the closest one wins for each key.
 */
function applyPast<T>(current: T[], past: Past<T[]>[], generation: number, key: (item: T) => unknown) {
  const items = new Map(current.map((item) => [key(item), item]))
  for (const [, values] of past.filter(([last]) => generation <= last).sort((a, b) => b[0] - a[0])) {
    for (const value of values) items.set(key(value), value)
  }
  return items
}

function statsIn(form: IForm, generation: number): IStat[] {
  const stats = applyPast(form.stats, form.pastStats, generation, (stat) => stat.name)
  // Gen 1 had one Special stat where later games split Sp. Atk and Sp. Def.
  const special = stats.get('Special')
  return form.stats.flatMap((stat) => {
    if (special && stat.name === 'Sp. Atk') return [special]
    if (special && stat.name === 'Sp. Def') return []
    return [stats.get(stat.name)!]
  })
}

function abilitiesIn(form: IForm, generation: number): IAbility[] {
  if (generation < ABILITIES_FROM) return []
  const current = form.abilities.map((ability) => ({ slot: ability.slot, ability }))
  return [...applyPast(current, form.pastAbilities, generation, (entry) => entry.slot).values()]
    .sort((a, b) => a.slot - b.slot)
    .flatMap(({ ability }) => (ability ? [ability] : []))
    .filter((ability) => !ability.hidden || generation >= HIDDEN_ABILITIES_FROM)
}

/** A form's types, base stats and abilities as they were in a generation; today's without one. */
export function formInGeneration(form: IForm, generation?: number) {
  if (generation === undefined) return { types: form.types, stats: form.stats, abilities: form.abilities }
  return {
    types: typesInGeneration(form.types, form.pastTypes, generation),
    stats: statsIn(form, generation),
    abilities: abilitiesIn(form, generation),
  }
}

/** A game's per-version values (Pokédex entries, held items), one per distinct value, with the versions sharing it. */
export function versionsIn<T>(values: Record<string, T>, game: IGame) {
  const byValue = new Map<string, { value: T; versions: string[] }>()
  for (const { id, name } of game.versions) {
    if (values[id] === undefined) continue
    const key = JSON.stringify(values[id])
    byValue.set(key, { value: values[id], versions: [...(byValue.get(key)?.versions ?? []), name] })
  }
  return [...byValue.values()]
}

/**
 * `versionsIn` for a game. Without a game, or when it has none (PokeAPI has no Pokédex
 * entries yet for the newest games), those of the newest game that has some, and that game.
 */
export function byVersion<T>(values: Record<string, T>, games: IGame[], game?: IGame) {
  const own = game ? versionsIn(values, game) : []
  if (own.length) return { game, entries: own }
  const latest = [...games].reverse().find((g) => versionsIn(values, g).length)
  return { game: latest, entries: latest ? versionsIn(values, latest) : [] }
}

/** [type, category, power, accuracy, pp, past values], as written by `bun run update-data`. */
type MoveStats = [string, string, number | null, number | null, number | null, PastMoveValues[]?]
/** [order of the first game with the newer values, power, accuracy, pp, type]; null where unchanged. */
type PastMoveValues = [number, number | null, number | null, number | null, string | null]
export interface MoveData {
  moves: Record<string, MoveStats>
  /** Game → move → machine, e.g. { 'firered-leafgreen': { flamethrower: 'TM35' } }. */
  machines: Record<string, Record<string, string>>
}

// Before Gen 4 a move's type decided whether it was physical or special.
const CATEGORY_SPLIT_FROM = 4
const SPECIAL_TYPES = ['fire', 'water', 'grass', 'electric', 'ice', 'psychic', 'dragon', 'dark']

/** The moves a Pokémon learns in a game, with each move's type, category, power, accuracy and PP as they were there. */
export function movesInGame(learnset: ILearnedMove[], game: IGame, data: MoveData): IMoveRow[] {
  return learnset.flatMap((learned) => {
    const stats = data.moves[learned.move]
    if (!stats) return []
    let [type, category, power, accuracy, pp] = stats
    const past = (stats[5] ?? []).filter(([since]) => game.order < since).sort((a, b) => b[0] - a[0])
    for (const [, oldPower, oldAccuracy, oldPp, oldType] of past) {
      power = oldPower ?? power
      accuracy = oldAccuracy ?? accuracy
      pp = oldPp ?? pp
      type = oldType ?? type
    }
    if (game.generation < CATEGORY_SPLIT_FROM && category !== 'status') {
      category = SPECIAL_TYPES.includes(type) ? 'special' : 'physical'
    }
    const machine = learned.method === 'machine' ? data.machines[game.id]?.[learned.move] : undefined
    return [{ ...learned, machine, type: type as PokemonType, category, power, accuracy, pp }]
  })
}

// The last National Dex number introduced in each generation.
const LAST_NUMBER = [151, 251, 386, 493, 649, 721, 809, 905, 1025]
const existsIn = (number: number, generation: number) =>
  number <= (LAST_NUMBER[generation - 1] ?? Infinity)

/**
 * The ways to evolve in a game. PokeAPI lists a method under the game it arrived in, and it
 * holds in later games until a newer one replaces it (Sylveon's affection became friendship).
 * Methods tied to a place only apply within that generation's games.
 */
// ponytail: same-generation is a stand-in for same region, so HeartGold / SoulSilver gets
// Leafeon's Eterna Forest and Legends: Arceus its Brilliant Diamond one. Bundle location
// regions if that matters.
function methodsIn(methods: IEvolutionMethod[], game: IGame, games: IGame[]) {
  const placed = methods.flatMap((method) => {
    if (!method.game) return [{ method, order: 0 }]
    const from = games.find((g) => g.id === method.game || g.dlc.includes(method.game!))
    // Side games like Colosseum, or a later game than this one.
    if (!from || from.order > game.order) return []
    if (method.location && from.generation !== game.generation) return []
    return [{ method, order: from.order }]
  })
  const newest = (location: boolean) => {
    const own = placed.filter((p) => p.method.location === location)
    const order = Math.max(...own.map((p) => p.order))
    return own.filter((p) => p.order === order).map((p) => p.method)
  }
  const chosen = [...newest(false), ...newest(true)]
  // Wormadam's three cloaks share one method.
  return [...new Map(chosen.map((method) => [method.text, method])).values()]
}

/**
 * An evolution line as it was in a game: Pokémon from later generations are left out (no
 * Pichu or Espeon in Red / Blue), which can split a line into several, and each evolution
 * shows that game's methods. Without a game, the full line with the newest game's methods.
 */
export function evolutionIn(chain: IEvolutionChain, games: IGame[], game?: IGame): IEvolutionChain[] {
  const methodsGame = game ?? games[games.length - 1]
  const visit = (node: IEvolutionChain): IEvolutionChain[] => {
    const evolvesTo = node.evolvesTo.flatMap(visit)
    // A Pokémon that didn't exist yet: what it evolves into starts its own line.
    if (game && !existsIn(node.number, game.generation)) {
      return evolvesTo.map((next) => ({ ...next, methods: [] }))
    }
    const methods = methodsGame ? methodsIn(node.methods, methodsGame, games) : node.methods
    return [{ ...node, methods, evolvesTo }]
  }
  return visit(chain)
}

/**
 * The forms a Pokémon has in a game: those with moves there (no Mega Charizard in Red / Blue,
 * no Alolan Raichu before Sun / Moon). Gigantamax forms have no moves of their own; they're
 * Sword / Shield's. The default form is always kept, for Pokémon not in the game at all.
 */
export function formsIn(forms: IForm[], game?: IGame) {
  if (!game) return forms
  return forms.filter((form, index) =>
    !index || (Object.keys(form.learnset).length ? form.learnset[game.id]?.length : game.id === 'sword-shield'),
  )
}
