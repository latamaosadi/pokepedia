import { describe, expect, test } from 'vitest'
import pokemonData from '../../src/data/pokemon.json'
import { listPages, pokemonPage, sitemap, withMeta } from '../seo-pages'

const SITE = 'https://example.test'
const shell = `<!doctype html>
<html lang="en">
  <head>
    <title>Poképedia</title>
    <meta
      name="description"
      content="A fanmade pokedex app that works offline"
    />
  </head>
  <body><div id="app"></div></body>
</html>`

describe('pokemonPage', () => {
  test('names the Pokémon, its number and types', () => {
    expect(pokemonPage({ number: 6, name: 'charizard', types: ['fire', 'flying'] })).toMatchObject({
      path: '/dex/charizard',
      title: 'Charizard #0006 – Stats, Moves & Weaknesses · Poképedia',
      description:
        'Charizard is a Fire/Flying-type Pokémon, #6 in the National Pokédex. See its base stats, the moves it learns in each game, its type weaknesses, abilities, evolutions and forms.',
      image:
        'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/6.png',
    })
  })

  test('its page has a heading and links to its neighbours for crawlers', () => {
    const { body } = pokemonPage(
      { number: 122, name: 'mr-mime', types: ['psychic', 'fairy'] },
      { number: 121, name: 'starmie', types: [] },
      { number: 123, name: 'scyther', types: [] },
    )
    expect(body).toContain('<h1>Mr Mime #0122</h1>')
    expect(body).toContain('Previous: <a href="/dex/starmie">Starmie</a>')
    expect(body).toContain('Next: <a href="/dex/scyther">Scyther</a>')
  })

  test('every Pokémon in the shipped data gets its own page', () => {
    const paths = pokemonData.map((entry) => pokemonPage(entry).path)
    expect(new Set(paths).size).toBe(pokemonData.length)
    expect(paths).toContain('/dex/mr-mime')
  })
})

describe('withMeta', () => {
  test("replaces the shell's title and description and adds canonical and preview tags", () => {
    const html = withMeta(shell, pokemonPage({ number: 25, name: 'pikachu', types: ['electric'] }), SITE)

    expect(html).toContain('<title>Pikachu #0025 – Stats, Moves &amp; Weaknesses · Poképedia</title>')
    expect(html).toContain('<meta name="description" content="Pikachu is an Electric-type Pokémon,')
    expect(html).not.toContain('A fanmade pokedex app')
    expect(html).toContain('<link rel="canonical" href="https://example.test/dex/pikachu" />')
    expect(html).toContain('<meta property="og:url" content="https://example.test/dex/pikachu" />')
    expect(html).toContain('official-artwork/25.png" />')
    expect(html).toContain('<div id="app"><h1>Pikachu #0025</h1>')
  })

  test('escapes text and falls back to the app icon for pages without artwork', () => {
    const html = withMeta(shell, { path: '/', title: 'A & B <C>', description: 'Say "hi"' }, SITE)

    expect(html).toContain('<title>A &amp; B &lt;C&gt;</title>')
    expect(html).toContain('content="Say &quot;hi&quot;"')
    expect(html).toContain('<link rel="canonical" href="https://example.test/" />')
    expect(html).toContain('<meta property="og:image" content="https://example.test/pwa-512x512.png" />')
  })
})

test('the sitemap lists every page with absolute URLs', () => {
  const xml = sitemap(SITE, [...listPages, pokemonPage({ number: 1, name: 'bulbasaur', types: ['grass'] })])

  expect(xml).toContain('<loc>https://example.test/</loc>')
  expect(xml).toContain('<loc>https://example.test/dex</loc>')
  expect(xml).toContain('<loc>https://example.test/dex/bulbasaur</loc>')
  expect(xml).toContain('<loc>https://example.test/team</loc>')
  expect(xml.match(/<url>/g)).toHaveLength(4)
})
