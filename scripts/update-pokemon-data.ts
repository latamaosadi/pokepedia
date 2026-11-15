// Regenerates the Pokémon list and type chart shipped with the app, so a first
// visit needs no API calls. Run when new Pokémon are released:
//   bun run update-data
import { writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const API = 'https://pokeapi.co/api/v2'
const OUT_DIR = new URL('../src/data/', import.meta.url)
// Not real types: "unknown" and "shadow" have no Pokémon in the Dex, "stellar" is a Tera type.
const SKIPPED_TYPES = ['unknown', 'shadow', 'stellar']

interface NamedResource {
  name: string
  url: string
}

export interface TypeResponse {
  name: string
  pokemon: { slot: number; pokemon: NamedResource }[]
  damage_relations: Record<
    'double_damage_to' | 'half_damage_to' | 'no_damage_to',
    NamedResource[]
  >
}

export interface ColorResponse {
  name: string
  pokemon_species: NamedResource[]
}

export interface PokemonEntry {
  number: number
  name: string
  types: string[]
  color: string
}

const idFromUrl = (url: string) => Number(url.match(/\/(\d+)\/?$/)?.[1] ?? 0)

export function buildPokemonList(
  species: NamedResource[],
  types: TypeResponse[],
  colors: ColorResponse[],
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

  return species.map(({ name, url }) => {
    const number = idFromUrl(url)
    return {
      number,
      name,
      types: (typesById.get(number) ?? []).sort((a, b) => a.slot - b.slot).map((t) => t.name),
      color: colorById.get(number) ?? '',
    }
  })
}

/** Attacking type → defending type → damage multiplier, listing only non-1× entries. */
export function buildTypeChart(types: TypeResponse[]) {
  const chart: Record<string, Record<string, number>> = {}
  for (const { name, damage_relations: damage } of types) {
    chart[name] = {}
    for (const { name: target } of damage.double_damage_to) chart[name][target] = 2
    for (const { name: target } of damage.half_damage_to) chart[name][target] = 0.5
    for (const { name: target } of damage.no_damage_to) chart[name][target] = 0
  }
  return chart
}

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${url}`)
  return (await response.json()) as T
}

type Page = { results: NamedResource[] }

async function main() {
  const species = (await getJson<Page>(`${API}/pokemon-species?limit=100000`)).results
  const typeList = (await getJson<Page>(`${API}/type?limit=100`)).results
  const types = await Promise.all(
    typeList
      .filter((t) => !SKIPPED_TYPES.includes(t.name))
      .map((t) => getJson<TypeResponse>(t.url)),
  )
  const colorList = (await getJson<Page>(`${API}/pokemon-color?limit=100`)).results
  const colors = await Promise.all(colorList.map((c) => getJson<ColorResponse>(c.url)))

  const list = buildPokemonList(species, types, colors)
  await writeFile(new URL('pokemon.json', OUT_DIR), JSON.stringify(list) + '\n')
  await writeFile(
    new URL('type-chart.json', OUT_DIR),
    JSON.stringify(buildTypeChart(types), null, 2) + '\n',
  )
  console.log(`Wrote ${list.length} Pokémon and ${types.length} types to src/data/`)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main()
