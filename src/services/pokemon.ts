import type {
  IEvolutionChain,
  IForm,
  ILearnedMove,
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
  special: 'Special',
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

// Entries keep the games' line breaks, soft hyphens ("be\u00ad\nhavior") and, up to Gen 3, "POKéMON".
const cleanEntry = (text: string) =>
  text.replace(/\u00ad\s*/g, '').replace(/\s+/g, ' ').replace(/POKéMON/g, 'Pokémon').trim()

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
  return {
    name: node.species.name,
    formattedName: titleCase(node.species.name),
    number,
    sprite: defaultSprite(number),
    methods: node.evolution_details.map((detail: Raw) => ({
      text: describeEvolution(detail),
      itemSprite: detail.item ? itemSprite(detail.item.name) : undefined,
      game: detail.version_group?.name,
      location: Boolean(detail.location),
    })),
    evolvesTo: node.evolves_to.map(buildEvolution),
  }
}

const toType = (slot: Raw) => ({ name: slot.type.name })
const toStat = (slot: Raw) => ({
  name: STAT_LABELS[slot.stat.name] ?? titleCase(slot.stat.name),
  value: slot.base_stat,
})
const toAbility = (slot: Raw) => ({
  name: titleCase(slot.ability.name),
  hidden: slot.is_hidden,
  slot: slot.slot,
})

function learnset(moves: Raw[]) {
  const byGame: Record<string, ILearnedMove[]> = {}
  for (const { move, version_group_details: details } of moves) {
    for (const detail of details) {
      byGame[detail.version_group.name] ??= []
      byGame[detail.version_group.name].push({
        move: move.name,
        method: detail.move_learn_method.name,
        level: detail.level_learned_at,
      })
    }
  }
  return byGame
}

async function getForm(url: string, speciesName: string): Promise<IForm> {
  const pokemon = await getJson(url)
  return {
    id: pokemon.id,
    name: formatFormName(pokemon.name, speciesName),
    types: pokemon.types.map(toType),
    height: `${pokemon.height / 10} m`,
    heightMeters: pokemon.height / 10,
    weight: `${pokemon.weight / 10} kg`,
    sprite: defaultSprite(pokemon.id),
    artwork: artwork(pokemon.id),
    stats: pokemon.stats.map(toStat),
    abilities: pokemon.abilities.map(toAbility),
    cry: pokemon.cries?.latest || pokemon.cries?.legacy || undefined,
    pastTypes: (pokemon.past_types ?? []).map((past: Raw) => [
      getIdFromUrl(past.generation.url),
      past.types.map(toType),
    ]),
    pastStats: (pokemon.past_stats ?? []).map((past: Raw) => [
      getIdFromUrl(past.generation.url),
      past.stats.map(toStat),
    ]),
    learnset: learnset(pokemon.moves),
    pastAbilities: (pokemon.past_abilities ?? []).map((past: Raw) => [
      getIdFromUrl(past.generation.url),
      past.abilities.map((slot: Raw) => ({
        slot: slot.slot,
        ability: slot.ability ? toAbility(slot) : null,
      })),
    ]),
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
    shape: species.shape?.name ?? '',
    genus: species.genera.find(isEnglish)?.genus || '',
    entries: Object.fromEntries(
      species.flavor_text_entries
        .filter(isEnglish)
        .map((entry: Raw) => [entry.version.name, cleanEntry(entry.flavor_text)]),
    ),
    forms,
    evolutionChain: chain ? buildEvolution(chain.chain) : null,
  }
}
