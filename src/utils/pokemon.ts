import type { IPokemon } from '@/types/pokemon'
import { titleCase } from './string'

export function formatFormName(name: string, speciesName: string) {
  const manualNameFormat: Record<string, string> = {
    'darmanitan-galar-zen': 'Galarian Darmanitan Zen',
    'zygarde-10': '10%',
    'zygarde-50': '50%',
    'zygarde-10-power-construct': '10% Power Construct',
    'zygarde-50-power-construct': '50% Power Construct',
    'zygarde-complete': 'Complete',
    'oricorio-pau': "pa'u",
    'minior-red-meteor': 'Minior (Meteor)',
    'necrozma-dusk': 'Dusk Mane Necrozma',
    'necrozma-dawn': 'Dawn Wings Necrozma',
    'necrozma-ultra': 'Ultra Necrozma',
    'toxtricity-amped-gmax': 'Gigantamax Amped',
    'toxtricity-low-key-gmax': 'Gigantamax Low Key',
    'urshifu-single-strike-gmax': 'Gigantamax Single Strike',
    'urshifu-rapid-strike-gmax': 'Gigantamax Rapid Strike',
    'eternatus-eternamax': 'Eternamax Eternatus',
    'calyrex-ice': 'Ice Rider Calyrex',
    'calyrex-shadow': 'Shadow Rider Calyrex',
  }

  if (manualNameFormat[name]) {
    return manualNameFormat[name]
  }

  if (name.indexOf('-mega') !== -1 || name.indexOf('-primal') !== -1 || name === 'greninja-ash') {
    const re = '(' + speciesName + ')[-]([a-z]*)'
    const regExp = new RegExp(re, 'g')
    name = name.replace(regExp, '$2-$1')
  } else if (name.indexOf('-alola') !== -1) {
    name = 'alolan-' + speciesName
  } else if (name.indexOf('-galar') !== -1) {
    name = 'galarian-' + speciesName
  } else if (name.indexOf('-hisui') !== -1) {
    name = 'hisuian-' + speciesName
  } else if (name.indexOf('-gmax') !== -1) {
    name = 'gigantamax-' + speciesName
  }
  return titleCase(name)
}

/**
 * Search match on name or Pokédex number (the regional one when a game is selected),
 * optionally limited to one type. Plain digits match as a prefix while typing
 * ("25" → 25, 250–259); a padded number ("025", "#025") is exact.
 */
export function matchesFilter(pokemon: IPokemon, query: string, type: string) {
  if (type && !pokemon.types?.some((t) => t.name === type)) return false
  const q = query.trim().toLowerCase().replace(/^#/, '')
  if (!q) return true
  if (/^\d+$/.test(q)) {
    const number = pokemon.dexNumber ?? pokemon.number
    return q.startsWith('0') ? number === Number(q) : String(number).startsWith(q)
  }
  return pokemon.formattedName.toLowerCase().includes(q) || pokemon.name.includes(q)
}

/**
 * A Pokémon's types in a generation. `pastTypes` lists [last generation, types] for the
 * few whose types changed (Clefairy was Normal until Gen 5), oldest first.
 */
export function typesInGeneration<T>(types: T[], pastTypes?: [number, T[]][], generation?: number) {
  if (generation === undefined) return types
  return pastTypes?.find(([last]) => generation <= last)?.[1] ?? types
}
