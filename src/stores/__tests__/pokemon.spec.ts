import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import { usePokemonStore } from '../pokemon'

const API = 'https://pokeapi.co/api/v2'

// Minimal PokeAPI: bulbasaur (grass/poison, green) and charmander (fire, red).
const types: Record<number, { name: string; ids: number[] }> = {
  4: { name: 'poison', ids: [1] },
  10: { name: 'fire', ids: [4] },
  12: { name: 'grass', ids: [1] },
}
const colors: Record<number, { name: string; ids: number[] }> = {
  5: { name: 'green', ids: [1] },
  8: { name: 'red', ids: [4] },
}

function fakeApi(failing?: string) {
  return async (url: string) => {
    if (url === failing) return new Response('boom', { status: 500 })
    let body: unknown
    if (url.startsWith(`${API}/pokemon-species?`)) {
      body = {
        results: [
          { name: 'bulbasaur', url: `${API}/pokemon-species/1/` },
          { name: 'charmander', url: `${API}/pokemon-species/4/` },
        ],
      }
    } else if (url.startsWith(`${API}/type/`)) {
      const t = types[Number(url.split('/').pop())] ?? { name: 'normal', ids: [] }
      body = {
        name: t.name,
        pokemon: t.ids.map((id) => ({ pokemon: { url: `${API}/pokemon/${id}/` } })),
      }
    } else if (url.startsWith(`${API}/pokemon-color/`)) {
      const c = colors[Number(url.split('/').pop())] ?? { name: 'black', ids: [] }
      body = { name: c.name, pokemon_species: c.ids.map((id) => ({ url: `${API}/pokemon-species/${id}/` })) }
    } else {
      throw new Error(`unexpected url ${url}`)
    }
    return new Response(JSON.stringify(body))
  }
}

beforeEach(() => {
  localStorage.clear()
  setActivePinia(createPinia())
})
afterEach(() => vi.unstubAllGlobals())

describe('pokemon store', () => {
  test('builds the list with each pokemon’s types and color, and caches it', async () => {
    vi.stubGlobal('fetch', vi.fn(fakeApi()))
    const store = usePokemonStore()

    await store.getList()
    await nextTick()

    expect(store.error).toBeNull()
    expect(store.list.map(({ name, types, color }) => ({ name, types, color }))).toEqual([
      { name: 'bulbasaur', types: [{ name: 'poison' }, { name: 'grass' }], color: 'green' },
      { name: 'charmander', types: [{ name: 'fire' }], color: 'red' },
    ])
    expect(JSON.parse(localStorage.getItem('pokedex/v2/pokemon')!)).toEqual(store.list)
  })

  test('a failed request reports an error and caches nothing; retry recovers', async () => {
    vi.stubGlobal('fetch', vi.fn(fakeApi(`${API}/type/7`)))
    const store = usePokemonStore()

    await store.getList()
    await nextTick()

    expect(store.error?.message).toContain('500')
    expect(store.list).toEqual([])
    expect(JSON.parse(localStorage.getItem('pokedex/v2/pokemon') ?? '[]')).toEqual([])

    vi.stubGlobal('fetch', vi.fn(fakeApi()))
    await store.getList()

    expect(store.error).toBeNull()
    expect(store.list.map((p) => p.name)).toEqual(['bulbasaur', 'charmander'])
  })

  test('uses the cached list without touching the network', async () => {
    const cached = [{ name: 'pikachu', formattedName: 'Pikachu', number: 25, sprite: 's' }]
    localStorage.setItem('pokedex/v2/pokemon', JSON.stringify(cached))
    vi.stubGlobal('fetch', () => Promise.reject(new Error('offline')))
    const store = usePokemonStore()

    await store.getList()

    expect(store.error).toBeNull()
    expect(store.list).toEqual(cached)
  })

  test('drops caches from older versions', () => {
    localStorage.setItem('pokedex/pokemon', '[{"name":"stale"}]')
    localStorage.setItem('pokedex/types', '[]')

    usePokemonStore()

    expect(localStorage.getItem('pokedex/pokemon')).toBeNull()
    expect(localStorage.getItem('pokedex/types')).toBeNull()
  })
})
