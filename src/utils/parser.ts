import { Dic } from '@/types/generic'
import { INamedResource } from '@/types/pokemon'

export function getResourceName(object: INamedResource | Dic) {
  return object.name || ''
}

export function getEnglish(language: INamedResource) {
  return language.name === 'en'
}

export function getName(names: { language: INamedResource; name: string }[]) {
  return getResourceName(names.find((name) => getEnglish(name.language)) || {})
}

export function getGenus(
  genera: { language: INamedResource; genus: string }[],
) {
  return genera.find((name) => getEnglish(name.language))?.genus || ''
}

export function getDescription(
  textEntries: {
    flavor_text: string
    language: INamedResource
    version: INamedResource
  }[],
) {
  return (
    textEntries.find(
      (entry) => getEnglish(entry.language) && entry.version.name === 'emerald',
    )?.flavor_text || ''
  )
}

export function getPokedexNumber(
  pokedexes: { entry_number: number; pokedex: INamedResource }[],
  dexType = 'national',
) {
  return (
    pokedexes.find((pokedex) => pokedex.pokedex.name === dexType)
      ?.entry_number || 0
  )
}
