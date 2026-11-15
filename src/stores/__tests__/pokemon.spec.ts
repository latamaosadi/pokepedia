import { beforeEach, describe, expect, test } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import { usePokemonStore } from '../pokemon'

const sprites = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon'

beforeEach(() => {
  localStorage.clear()
  setActivePinia(createPinia())
})

describe('pokemon store', () => {
  test('ships the full National Dex with types in game order, without any network', () => {
    const store = usePokemonStore()

    expect(store.list).toHaveLength(1025)
    expect(store.list[5]).toEqual({
      number: 6,
      name: 'charizard',
      formattedName: 'Charizard',
      sprite: `${sprites}/6.png`,
      artwork: `${sprites}/other/official-artwork/6.png`,
      color: 'red',
      types: [{ name: 'fire' }, { name: 'flying' }],
    })
    expect(store.list.every((pokemon) => pokemon.types?.length && pokemon.color)).toBe(true)
  })

  test.each([
    ['#001', '', ['bulbasaur']],
    ['025', '', ['pikachu']],
    ['25', '', ['pikachu', 'ho-oh', 'celebi', 'treecko', 'grovyle', 'sceptile', 'torchic', 'combusken', 'blaziken', 'mudkip', 'marshtomp']],
    ['charm', '', ['charmander', 'charmeleon']],
    ['MR MIME', '', ['mr-mime']],
    ['bulba', 'fire', []],
  ] as const)('filters by search %j and type %j', (query, type, expected) => {
    const store = usePokemonStore()

    store.query = query
    store.type = type

    expect(store.filtered.map((p) => p.name)).toEqual(expected)
  })

  test('the type filter keeps only Pokémon of that type', () => {
    const store = usePokemonStore()

    store.type = 'dragon'

    expect(store.filtered.length).toBeGreaterThan(50)
    expect(store.filtered.every((p) => p.types?.some((t) => t.name === 'dragon'))).toBe(true)
    expect(store.filtered.map((p) => p.name)).toContain('dragonite')
  })

  test('the shiny switch shows shiny art without changing the list, and is remembered', async () => {
    const store = usePokemonStore()

    store.shiny = true
    await nextTick()

    expect(store.filtered[0]).toMatchObject({
      name: 'bulbasaur',
      sprite: `${sprites}/shiny/1.png`,
      artwork: `${sprites}/other/official-artwork/shiny/1.png`,
    })
    expect(store.list[0].artwork).toBe(`${sprites}/other/official-artwork/1.png`)
    expect(localStorage.getItem('pokedex/shiny')).toBe('true')
  })

  test('favorites can be toggled, filtered to, combined with search, and are remembered', async () => {
    const store = usePokemonStore()

    store.toggleFavorite(6)
    store.toggleFavorite(25)
    store.toggleFavorite(150)
    store.toggleFavorite(25)
    store.favoritesOnly = true
    await nextTick()

    expect(store.filtered.map((p) => p.name)).toEqual(['charizard', 'mewtwo'])
    store.query = 'mew'
    expect(store.filtered.map((p) => p.name)).toEqual(['mewtwo'])
    expect(JSON.parse(localStorage.getItem('pokedex/favorites')!)).toEqual([6, 150])
  })

  test('drops caches from versions that fetched the list at runtime', () => {
    localStorage.setItem('pokedex/pokemon', '[{"name":"stale"}]')
    localStorage.setItem('pokedex/v2/pokemon', '[{"name":"stale"}]')

    usePokemonStore()

    expect(localStorage.getItem('pokedex/pokemon')).toBeNull()
    expect(localStorage.getItem('pokedex/v2/pokemon')).toBeNull()
  })
})
