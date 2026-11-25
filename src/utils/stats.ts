// Natures arrived in Gen 3, along with IVs up to 31 and EVs; Gens 1–2 used DVs (0–15) and stat experience.
const MODERN_FROM = 3

const STATS = ['Attack', 'Defense', 'Speed', 'Sp. Atk', 'Sp. Def']
const NATURE_NAMES = [
  ['Hardy', 'Lonely', 'Brave', 'Adamant', 'Naughty'],
  ['Bold', 'Docile', 'Relaxed', 'Impish', 'Lax'],
  ['Timid', 'Hasty', 'Serious', 'Jolly', 'Naive'],
  ['Modest', 'Mild', 'Quiet', 'Bashful', 'Rash'],
  ['Calm', 'Gentle', 'Sassy', 'Careful', 'Quirky'],
]
/** Each nature with the stat it raises and lowers; neutral ones raise and lower the same. */
export const NATURES = NATURE_NAMES.flatMap((row, up) =>
  row.map((name, down) => ({ name, up: STATS[up], down: STATS[down] })),
)

export const isModern = (generation?: number) => !generation || generation >= MODERN_FROM
/** Highest IV (DV before Gen 3) and EV (stat experience before Gen 3). */
export const limits = (generation?: number) =>
  isModern(generation) ? { iv: 31, ev: 252 } : { iv: 15, ev: 65535 }

/** A stat's value at a level, by the formula of the generation (today's without one). */
export function statAt(
  stat: { name: string; base: number; iv: number; ev: number },
  level: number,
  nature: string,
  generation?: number,
) {
  // Shedinja always has 1 HP.
  if (stat.name === 'HP' && stat.base === 1) return 1
  const effort = isModern(generation) ? Math.floor(stat.ev / 4) : Math.floor(Math.ceil(Math.sqrt(stat.ev)) / 4)
  const iv = isModern(generation) ? stat.iv : stat.iv * 2
  const raw = Math.floor(((2 * stat.base + iv + effort) * level) / 100)
  if (stat.name === 'HP') return raw + level + 10
  const { up, down } = NATURES.find((n) => n.name === nature) ?? NATURES[0]
  const multiplier = !isModern(generation) || up === down ? 1 : up === stat.name ? 1.1 : down === stat.name ? 0.9 : 1
  return Math.floor((raw + 5) * multiplier)
}
