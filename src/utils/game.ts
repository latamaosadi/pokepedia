import type {
  IAbility,
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
