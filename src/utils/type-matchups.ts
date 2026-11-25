import typeCharts from '@/data/type-chart.json'

type Chart = Record<string, Record<string, number>>
// Keyed by the first generation each chart applies to.
const charts = Object.entries(typeCharts as Record<string, Chart>)
  .map(([generation, chart]) => ({ generation: Number(generation), chart }))
  .sort((a, b) => b.generation - a.generation)

/** The type chart in use in a generation; the latest one when none is given. */
const typeChart = (generation = Infinity) =>
  charts.find((entry) => entry.generation <= generation)?.chart ?? charts[0].chart

/** The types that existed in a generation (no Dark or Steel in Gen 1, no Fairy before Gen 6). */
export const typesIn = (generation?: number) => Object.keys(typeChart(generation))

const MULTIPLIERS = [4, 2, 0.5, 0.25, 0]

/**
 * Damage a Pokémon with these types takes from each attacking type, grouped by
 * multiplier (4×, 2×, ½×, ¼×, 0×), using that generation's chart. Abilities like
 * Levitate aren't considered.
 */
export function defensiveMatchups(defendingTypes: string[], generation?: number) {
  const byMultiplier = new Map<number, string[]>()
  for (const [attacker, against] of Object.entries(typeChart(generation))) {
    const multiplier = defendingTypes.reduce((total, type) => total * (against[type] ?? 1), 1)
    if (multiplier !== 1) byMultiplier.set(multiplier, [...(byMultiplier.get(multiplier) ?? []), attacker])
  }
  return MULTIPLIERS.filter((m) => byMultiplier.has(m)).map((multiplier) => ({
    multiplier,
    types: byMultiplier.get(multiplier)!,
  }))
}

/** How a team of Pokémon (each a list of types) fares against each attacking type. */
export function teamDefense(team: string[][], generation?: number) {
  const chart = typeChart(generation)
  return Object.entries(chart).map(([attacker, against]) => {
    const multipliers = team.map((types) => types.reduce((total, type) => total * (against[type] ?? 1), 1))
    return {
      type: attacker,
      weak: multipliers.filter((m) => m > 1).length,
      resist: multipliers.filter((m) => m < 1).length,
    }
  })
}

/**
 * Each defending type with the team's types that hit it super effectively. Only the
 * members' own types count (their STAB moves), not the rest of their movesets.
 */
export function teamCoverage(team: string[][], generation?: number) {
  const chart = typeChart(generation)
  const attackers = [...new Set(team.flat())]
  return Object.keys(chart).map((defender) => ({
    type: defender,
    hitBy: attackers.filter((attacker) => (chart[attacker]?.[defender] ?? 1) > 1),
  }))
}
