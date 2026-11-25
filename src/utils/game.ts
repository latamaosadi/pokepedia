import type { IAbility, IForm, IStat, Past } from '@/types/pokemon'
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
