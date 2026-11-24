import type {
  IEvolutionChain,
  IForm,
  INamedResource,
  IPokemonInfo,
} from '@/types/pokemon'
import { artwork, defaultSprite, itemSprite } from '@/utils/sprite'
import { titleCase } from '@/utils/string'
import { formatFormName } from '@/utils/pokemon'
import { getJson } from './api'

const API = 'https://pokeapi.co/api/v2'

const STAT_LABELS: Record<string, string> = {
  hp: 'HP',
  attack: 'Attack',
  defense: 'Defense',
  'special-attack': 'Sp. Atk',
  'special-defense': 'Sp. Def',
  speed: 'Speed',
}

// Varieties that are battle-only or duplicates of another entry.
const HIDDEN_FORMS = ['totem', '-meteor', 'koraidon-', 'miraidon-']

/* eslint-disable @typescript-eslint/no-explicit-any -- raw PokeAPI payloads */
type Raw = any

export function getIdFromUrl(url: string) {
  const match = url.match(/\/(\d+)\/?$/)
  return match ? parseInt(match[1]) : 0
}

const isEnglish = (entry: { language: INamedResource }) => entry.language.name === 'en'

export function describeEvolution(detail: Raw): string {
  const parts = [
    detail.trigger.name === 'trade' && 'Trade',
    detail.min_level && `Lv. ${detail.min_level}`,
    detail.item && titleCase(detail.item.name),
    detail.held_item && `holding ${titleCase(detail.held_item.name)}`,
    detail.known_move && `knowing ${titleCase(detail.known_move.name)}`,
    detail.known_move_type && `knowing a ${titleCase(detail.known_move_type.name)} move`,
    detail.min_happiness && 'High friendship',
    detail.min_affection && 'High affection',
    detail.location && `at ${titleCase(detail.location.name)}`,
    detail.time_of_day && `(${detail.time_of_day})`,
  ].filter(Boolean)
  return parts.join(' ') || titleCase(detail.trigger.name)
}

function buildEvolution(node: Raw): IEvolutionChain {
  const number = getIdFromUrl(node.species.url)
  // ponytail: only the first of several evolution methods is shown (e.g. Leafeon's
  // location vs. Leaf Stone); show all if anyone asks.
  const detail = node.evolution_details[0]
  return {
    name: node.species.name,
    formattedName: titleCase(node.species.name),
    number,
    sprite: defaultSprite(number),
    requirement: detail ? describeEvolution(detail) : undefined,
    itemSprite: detail?.item ? itemSprite(detail.item.name) : undefined,
    evolvesTo: node.evolves_to.map(buildEvolution),
  }
}

async function getForm(url: string, speciesName: string): Promise<IForm> {
  const pokemon = await getJson(url)
  return {
    id: pokemon.id,
    name: formatFormName(pokemon.name, speciesName),
    types: pokemon.types.map((slot: Raw) => ({ name: slot.type.name })),
    height: `${pokemon.height / 10} m`,
    heightMeters: pokemon.height / 10,
    weight: `${pokemon.weight / 10} kg`,
    sprite: defaultSprite(pokemon.id),
    artwork: artwork(pokemon.id),
    stats: pokemon.stats.map((slot: Raw) => ({
      name: STAT_LABELS[slot.stat.name] ?? titleCase(slot.stat.name),
      value: slot.base_stat,
    })),
    abilities: pokemon.abilities.map((slot: Raw) => ({
      name: titleCase(slot.ability.name),
      hidden: slot.is_hidden,
    })),
    cry: pokemon.cries?.latest || pokemon.cries?.legacy || undefined,
  }
}

export async function getPokemonInfo(id: string): Promise<IPokemonInfo> {
  const species = await getJson(`${API}/pokemon-species/${id}`)
  const varieties = species.varieties.filter(
    (variety: Raw) =>
      variety.is_default || !HIDDEN_FORMS.some((word) => variety.pokemon.name.includes(word)),
  )
  const [chain, forms] = await Promise.all([
    species.evolution_chain ? getJson(species.evolution_chain.url) : null,
    Promise.all(varieties.map((variety: Raw) => getForm(variety.pokemon.url, species.name))),
  ])

  return {
    name: species.name,
    formattedName: species.names.find(isEnglish)?.name || titleCase(species.name),
    number: species.id,
    color: species.color.name,
    genus: species.genera.find(isEnglish)?.genus || '',
    description: (species.flavor_text_entries.find(isEnglish)?.flavor_text || '').replace(
      /\s+/g,
      ' ',
    ),
    forms,
    evolutionChain: chain ? buildEvolution(chain.chain) : null,
  }
}
