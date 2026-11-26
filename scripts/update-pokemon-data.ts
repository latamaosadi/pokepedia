// Regenerates the data shipped with the app (Pokémon list, type charts, games and moves),
// so a first visit needs no API calls. Run when new Pokémon or games are released:
//   bun run update-data
import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const API = 'https://pokeapi.co/api/v2'
const OUT_DIR = new URL('../src/data/', import.meta.url)
// Fetched only when needed, so served as is rather than bundled.
const LEARNERS_DIR = new URL('../public/learners/', import.meta.url)
// Not real types: "unknown" and "shadow" have no Pokémon in the Dex, "stellar" is a Tera type.
const SKIPPED_TYPES = ['unknown', 'shadow', 'stellar']
// Japan-only releases and side or competitive games, which have no regional Pokédex to play through.
const SKIPPED_GAMES = ['red-green-japan', 'blue-japan', 'colosseum', 'xd', 'champions']

interface NamedResource {
  name: string
  url: string
}

type DamageRelations = Record<
  'double_damage_to' | 'half_damage_to' | 'no_damage_to',
  NamedResource[]
>

export interface TypeResponse {
  name: string
  generation: NamedResource
  pokemon: { slot: number; pokemon: NamedResource }[]
  damage_relations: DamageRelations
  /** Full relations as they were up to and including `generation`. */
  past_damage_relations: { generation: NamedResource; damage_relations: DamageRelations }[]
}

export interface ColorResponse {
  name: string
  pokemon_species: NamedResource[]
}

export interface PokemonResponse {
  id: number
  moves: { move: NamedResource; version_group_details: { version_group: NamedResource }[] }[]
  /** Types as they were up to and including `generation`. */
  past_types: { generation: NamedResource; types: { slot: number; type: NamedResource }[] }[]
}

export interface VersionGroupResponse {
  name: string
  order: number
  generation: NamedResource
  pokedexes: NamedResource[]
  versions: NamedResource[]
}

export interface PokedexResponse {
  name: string
  pokemon_entries: { entry_number: number; pokemon_species: NamedResource }[]
}

export interface MoveResponse {
  name: string
  type: NamedResource
  damage_class: NamedResource
  power: number | null
  accuracy: number | null
  pp: number | null
  /** Values before `version_group`; null where unchanged. */
  past_values: {
    power: number | null
    accuracy: number | null
    pp: number | null
    type: NamedResource | null
    version_group: NamedResource
  }[]
}

export interface MachineResponse {
  item: NamedResource
  move: NamedResource
  version_group: NamedResource
}

export interface AbilityResponse {
  name: string
  effect_entries: { short_effect: string; language: NamedResource }[]
  flavor_text_entries: { flavor_text: string; language: NamedResource }[]
}

export interface SpeciesResponse {
  id: number
  genera: { genus: string; language: NamedResource }[]
}

export interface PokemonEntry {
  number: number
  name: string
  types: string[]
  color: string
  /** Its category, e.g. "Flame Pokémon" for Charizard. */
  genus?: string
  /** [last generation, types] for Pokémon whose types changed, oldest first. */
  pastTypes?: [number, string[]][]
}

export interface Game {
  id: string
  name: string
  generation: number
  order: number
  /** The versions sold as this game, e.g. Red and Blue; each has its own Pokédex entries. */
  versions: { id: string; name: string }[]
  /** Its DLC's version groups, e.g. the-teal-mask, which PokeAPI tags some evolutions with. */
  dlc: string[]
  /** The game's Pokédexes (DLC areas get their own); species in entry order, numbered from `start`. */
  dexes: { name: string; start: number; species: number[] }[]
}

/** [type, damage class, power, accuracy, pp, past values] */
export type Move = [string, string, number | null, number | null, number | null, PastMoveValues[]?]
/** [order of the first game with today's values, power, accuracy, pp, type]; null where unchanged. */
export type PastMoveValues = [number, number | null, number | null, number | null, string | null]

const idFromUrl = (url: string) => Number(url.match(/\/(\d+)\/?$/)?.[1] ?? 0)

export function buildPokemonList(
  species: NamedResource[],
  types: TypeResponse[],
  colors: ColorResponse[],
  pokemon: PokemonResponse[] = [],
  speciesDetails: SpeciesResponse[] = [],
): PokemonEntry[] {
  // Each type lists the default Pokémon (same id as the species) with its slot,
  // which gives the game's type order, e.g. Charizard is Fire first, then Flying.
  const typesById = new Map<number, { slot: number; name: string }[]>()
  for (const type of types) {
    for (const { slot, pokemon } of type.pokemon) {
      const id = idFromUrl(pokemon.url)
      typesById.set(id, [...(typesById.get(id) ?? []), { slot, name: type.name }])
    }
  }
  const colorById = new Map<number, string>()
  for (const color of colors) {
    for (const entry of color.pokemon_species) colorById.set(idFromUrl(entry.url), color.name)
  }
  const genusById = new Map(
    speciesDetails.map((s) => [s.id, s.genera.find((g) => g.language.name === 'en')?.genus]),
  )
  const pastTypesById = new Map(
    pokemon
      .filter((p) => p.past_types.length)
      .map((p) => [
        p.id,
        p.past_types
          .map(({ generation, types }): [number, string[]] => [
            idFromUrl(generation.url),
            types.sort((a, b) => a.slot - b.slot).map((t) => t.type.name),
          ])
          .sort((a, b) => a[0] - b[0]),
      ]),
  )

  return species.map(({ name, url }) => {
    const number = idFromUrl(url)
    const pastTypes = pastTypesById.get(number)
    const genus = genusById.get(number)
    return {
      number,
      name,
      types: (typesById.get(number) ?? []).sort((a, b) => a.slot - b.slot).map((t) => t.name),
      color: colorById.get(number) ?? '',
      ...(genus && { genus }),
      ...(pastTypes && { pastTypes }),
    }
  })
}

/** Attacking type → defending type → damage multiplier, listing only non-1× entries. */
function typeChart(types: TypeResponse[], generation: number) {
  const existing = types.filter((type) => idFromUrl(type.generation.url) <= generation)
  const exists = new Set(existing.map((type) => type.name))
  const chart: Record<string, Record<string, number>> = {}
  for (const type of existing) {
    // The oldest past entry still covering this generation, else today's relations.
    const past = type.past_damage_relations
      .filter((entry) => idFromUrl(entry.generation.url) >= generation)
      .sort((a, b) => idFromUrl(a.generation.url) - idFromUrl(b.generation.url))[0]
    const damage = past?.damage_relations ?? type.damage_relations
    chart[type.name] = {}
    const set = (targets: NamedResource[], multiplier: number) => {
      for (const { name } of targets) if (exists.has(name)) chart[type.name][name] = multiplier
    }
    set(damage.double_damage_to, 2)
    set(damage.half_damage_to, 0.5)
    set(damage.no_damage_to, 0)
  }
  return chart
}

/** Type charts keyed by the first generation they apply to, e.g. { 1: …, 2: …, 6: … }. */
export function buildTypeCharts(types: TypeResponse[], lastGeneration: number) {
  const charts: Record<number, Record<string, Record<string, number>>> = {}
  let previous = ''
  for (let generation = 1; generation <= lastGeneration; generation++) {
    const chart = typeChart(types, generation)
    const json = JSON.stringify(chart)
    if (json !== previous) charts[generation] = chart
    previous = json
  }
  return charts
}

export function buildGames(
  groups: VersionGroupResponse[],
  versionNames: Map<string, string>,
  pokedexes: PokedexResponse[],
  withLearnsets: Set<string>,
): Game[] {
  const dexByName = new Map(pokedexes.map((dex) => [dex.name, dex]))
  // DLC has no learnsets of its own and only Pokédexes its base game already lists.
  const dlc = groups.filter((group) => !withLearnsets.has(group.name) && group.pokedexes.length)
  return groups
    .filter((group) => !SKIPPED_GAMES.includes(group.name) && withLearnsets.has(group.name))
    .sort((a, b) => a.order - b.order)
    .map((group) => {
      const versions = group.versions.map((v) => ({ id: v.name, name: versionNames.get(v.name) ?? v.name }))
      return {
        id: group.name,
        name: versions.map((v) => v.name).join(' / '),
        generation: idFromUrl(group.generation.url),
        order: group.order,
        versions,
        dlc: dlc
          .filter((extra) => extra.pokedexes.every((dex) => group.pokedexes.some((own) => own.name === dex.name)))
          .map((extra) => extra.name),
        dexes: group.pokedexes.map(({ name }) => {
          const entries = [...(dexByName.get(name)?.pokemon_entries ?? [])].sort(
            (a, b) => a.entry_number - b.entry_number,
          )
          return {
            name,
            start: entries[0]?.entry_number ?? 1,
            species: entries.map((entry) => idFromUrl(entry.pokemon_species.url)),
          }
        }),
      }
    })
}

export function buildMoves(moves: MoveResponse[], gameOrder: Map<string, number>) {
  return Object.fromEntries(
    moves.map((move): [string, Move] => {
      const past = move.past_values
        .filter((value) => gameOrder.has(value.version_group.name))
        .map((value): PastMoveValues => [
          gameOrder.get(value.version_group.name)!,
          value.power,
          value.accuracy,
          value.pp,
          value.type?.name ?? null,
        ])
        .sort((a, b) => a[0] - b[0])
      const values: Move = [move.type.name, move.damage_class.name, move.power, move.accuracy, move.pp]
      if (past.length) values.push(past)
      return [move.name, values]
    }),
  )
}

/** Game → move → machine label, e.g. { 'firered-leafgreen': { flamethrower: 'TM35' } }. */
export function buildMachines(machines: MachineResponse[], games: Set<string>) {
  const byGame: Record<string, Record<string, string>> = {}
  for (const { item, move, version_group: group } of machines) {
    if (!games.has(group.name)) continue
    byGame[group.name] ??= {}
    byGame[group.name][move.name] = item.name.toUpperCase()
  }
  return byGame
}

/** Ability → what it does, in English, e.g. { blaze: 'Strengthens Fire moves…' }. */
export function buildAbilities(abilities: AbilityResponse[]) {
  const english = (entry: { language: NamedResource }) => entry.language.name === 'en'
  return Object.fromEntries(
    abilities.flatMap((ability) => {
      // The newest abilities only have the games' own text.
      const text =
        ability.effect_entries.find(english)?.short_effect ??
        ability.flavor_text_entries.filter(english).pop()?.flavor_text
      return text ? [[ability.name, text.replace(/\s+/g, ' ')]] : []
    }),
  )
}

/** Game → move → National Dex numbers of the Pokémon that learn it there, in number order. */
export function buildLearners(pokemon: PokemonResponse[], games: Set<string>) {
  const byGame: Record<string, Record<string, Set<number>>> = {}
  for (const { id, moves } of [...pokemon].sort((a, b) => a.id - b.id)) {
    for (const { move, version_group_details: details } of moves) {
      for (const { version_group: group } of details) {
        if (!games.has(group.name)) continue
        byGame[group.name] ??= {}
        ;(byGame[group.name][move.name] ??= new Set()).add(id)
      }
    }
  }
  return Object.fromEntries(
    Object.entries(byGame).map(([game, moves]) => [
      game,
      Object.fromEntries(Object.entries(moves).map(([move, ids]) => [move, [...ids]])),
    ]),
  )
}

async function getJson<T>(url: string): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    const response = await fetch(url)
    if (response.ok) return (await response.json()) as T
    if (attempt === 3) throw new Error(`${response.status} ${response.statusText}: ${url}`)
  }
}

/** Fetches many URLs, a few at a time so PokeAPI isn't flooded. */
async function getAll<T>(urls: string[], concurrency = 20): Promise<T[]> {
  const results: T[] = new Array(urls.length)
  let next = 0
  const worker = async () => {
    while (next < urls.length) {
      const index = next++
      results[index] = await getJson<T>(urls[index])
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker))
  return results
}

type Page = { results: NamedResource[] }
const listUrls = async (resource: string) =>
  (await getJson<Page>(`${API}/${resource}?limit=100000`)).results.map((r) => r.url)

async function main() {
  const species = (await getJson<Page>(`${API}/pokemon-species?limit=100000`)).results
  const typeList = (await getJson<Page>(`${API}/type?limit=100`)).results
  const types = await getAll<TypeResponse>(
    typeList.filter((t) => !SKIPPED_TYPES.includes(t.name)).map((t) => t.url),
  )
  const colors = await getAll<ColorResponse>(await listUrls('pokemon-color'))
  console.log('Fetching Pokémon…')
  const pokemon = await getAll<PokemonResponse>(species.map((s) => `${API}/pokemon/${idFromUrl(s.url)}`))
  const speciesDetails = await getAll<SpeciesResponse>(species.map((s) => s.url))

  console.log('Fetching games…')
  const groups = await getAll<VersionGroupResponse>(await listUrls('version-group'))
  const versions = await getAll<{ name: string; names: { name: string; language: NamedResource }[] }>(
    groups.flatMap((g) => g.versions.map((v) => v.url)),
  )
  const versionNames = new Map(
    versions.map((v) => [v.name, v.names.find((n) => n.language.name === 'en')?.name ?? v.name]),
  )
  const pokedexes = await getAll<PokedexResponse>(
    [...new Set(groups.flatMap((g) => g.pokedexes.map((p) => p.url)))],
  )
  const withLearnsets = new Set(
    pokemon.flatMap((p) => p.moves.flatMap((m) => m.version_group_details.map((d) => d.version_group.name))),
  )
  const games = buildGames(groups, versionNames, pokedexes, withLearnsets)

  console.log('Fetching moves, machines and abilities…')
  const moves = await getAll<MoveResponse>(await listUrls('move'))
  const machines = await getAll<MachineResponse>(await listUrls('machine'))
  const abilities = await getAll<AbilityResponse>(await listUrls('ability'))
  // Every version group's order, so past move values from skipped games still place correctly.
  const gameOrder = new Map(groups.map((g) => [g.name, g.order]))

  const list = buildPokemonList(species, types, colors, pokemon, speciesDetails)
  const lastGeneration = Math.max(...games.map((g) => g.generation))
  const write = (file: string, data: unknown) =>
    writeFile(new URL(file, OUT_DIR), JSON.stringify(data) + '\n')
  await write('pokemon.json', list)
  await write('type-chart.json', buildTypeCharts(types, lastGeneration))
  await write('games.json', games)
  await write('moves.json', {
    moves: buildMoves(moves, gameOrder),
    machines: buildMachines(machines, new Set(games.map((g) => g.id))),
  })
  await write('abilities.json', buildAbilities(abilities))
  await mkdir(LEARNERS_DIR, { recursive: true })
  for (const [game, learners] of Object.entries(buildLearners(pokemon, new Set(games.map((g) => g.id))))) {
    await writeFile(new URL(`${game}.json`, LEARNERS_DIR), JSON.stringify(learners) + '\n')
  }
  console.log(
    `Wrote ${list.length} Pokémon, ${types.length} types, ${games.length} games and ${moves.length} moves to src/data/`,
  )
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main()
