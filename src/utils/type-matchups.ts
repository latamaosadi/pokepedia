import typeChart from '@/data/type-chart.json'

const chart: Record<string, Record<string, number>> = typeChart

const MULTIPLIERS = [4, 2, 0.5, 0.25, 0]

/**
 * Damage a Pokémon with these types takes from each attacking type, grouped by
 * multiplier (4×, 2×, ½×, ¼×, 0×). Abilities like Levitate aren't considered.
 */
export function defensiveMatchups(defendingTypes: string[]) {
  const byMultiplier = new Map<number, string[]>()
  for (const [attacker, against] of Object.entries(chart)) {
    const multiplier = defendingTypes.reduce((total, type) => total * (against[type] ?? 1), 1)
    if (multiplier !== 1) byMultiplier.set(multiplier, [...(byMultiplier.get(multiplier) ?? []), attacker])
  }
  return MULTIPLIERS.filter((m) => byMultiplier.has(m)).map((multiplier) => ({
    multiplier,
    types: byMultiplier.get(multiplier)!,
  }))
}
