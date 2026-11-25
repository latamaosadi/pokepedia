import { afterEach, describe, expect, test, vi } from 'vitest'
import { describeEvolution, getPokemonInfo } from '../pokemon'

const API = 'https://pokeapi.co/api/v2'
const en = { name: 'en' }
const ref = (name: string, path = 'x/1') => ({ name, url: `${API}/${path}/` })

const levelUp = (extra = {}) => ({ trigger: ref('level-up'), ...extra })

const responses: Record<string, unknown> = {
  [`${API}/pokemon-species/charizard`]: {
    id: 6,
    name: 'charizard',
    names: [{ language: ref('ja'), name: 'リザードン' }, { language: en, name: 'Charizard' }],
    genera: [{ language: en, genus: 'Flame Pokémon' }],
    color: ref('red'),
    shape: ref('upright'),
    flavor_text_entries: [
      { language: en, version: ref('red'), flavor_text: 'Spits fire that\nis hot enough to\nmelt boulders.\fKnown to cause' },
      { language: ref('ja'), version: ref('red'), flavor_text: 'くちから しゃくねつの ほのおを' },
      { language: en, version: ref('ruby'), flavor_text: 'This POKéMON is a pow\u00ad\nerful flier.' },
    ],
    evolution_chain: { url: `${API}/evolution-chain/2/` },
    varieties: [
      { is_default: true, pokemon: ref('charizard', 'pokemon/6') },
      { is_default: false, pokemon: ref('charizard-mega-x', 'pokemon/10034') },
      { is_default: false, pokemon: ref('charizard-totem', 'pokemon/99999') },
    ],
  },
  [`${API}/pokemon/6/`]: {
    id: 6,
    name: 'charizard',
    height: 17,
    weight: 905,
    types: [{ type: ref('fire') }, { type: ref('flying') }],
    stats: [
      { base_stat: 78, stat: ref('hp') },
      { base_stat: 109, stat: ref('special-attack') },
    ],
    abilities: [
      { is_hidden: false, ability: ref('blaze') },
      { is_hidden: true, ability: ref('solar-power') },
    ],
    cries: { latest: 'https://example.test/6.ogg', legacy: null },
    moves: [
      {
        move: ref('flamethrower', 'move/53'),
        version_group_details: [
          { level_learned_at: 0, move_learn_method: ref('machine'), version_group: ref('firered-leafgreen') },
          { level_learned_at: 46, move_learn_method: ref('level-up'), version_group: ref('x-y') },
        ],
      },
    ],
    past_stats: [{ generation: ref('generation-i', 'generation/1'), stats: [{ base_stat: 85, stat: ref('special') }] }],
    past_abilities: [
      {
        generation: ref('generation-iv', 'generation/4'),
        abilities: [{ is_hidden: true, slot: 3, ability: null }],
      },
    ],
  },
  [`${API}/pokemon/10034/`]: {
    id: 10034,
    name: 'charizard-mega-x',
    height: 17,
    weight: 1105,
    types: [{ type: ref('fire') }, { type: ref('dragon') }],
    stats: [{ base_stat: 78, stat: ref('hp') }],
    abilities: [{ is_hidden: false, ability: ref('tough-claws') }],
    cries: { latest: null, legacy: null },
    moves: [],
  },
  [`${API}/evolution-chain/2/`]: {
    chain: {
      species: ref('charmander', 'pokemon-species/4'),
      evolution_details: [],
      evolves_to: [
        {
          species: ref('charmeleon', 'pokemon-species/5'),
          evolution_details: [levelUp({ min_level: 16 })],
          evolves_to: [
            {
              species: ref('charizard', 'pokemon-species/6'),
              evolution_details: [levelUp({ min_level: 36 })],
              evolves_to: [],
            },
          ],
        },
      ],
    },
  },
}

afterEach(() => vi.unstubAllGlobals())

describe('getPokemonInfo', () => {
  test('maps species, forms and evolution chain from PokeAPI', async () => {
    vi.stubGlobal('fetch', async (url: string) =>
      url in responses
        ? new Response(JSON.stringify(responses[url]))
        : new Response('not found', { status: 404 }),
    )

    const info = await getPokemonInfo('charizard')

    expect(info).toMatchObject({
      formattedName: 'Charizard',
      number: 6,
      color: 'red',
      shape: 'upright',
      genus: 'Flame Pokémon',
      entries: {
        red: 'Spits fire that is hot enough to melt boulders. Known to cause',
        ruby: 'This Pokémon is a powerful flier.',
      },
    })
    // Totem form is hidden.
    expect(info.forms.map(({ name, types, height, weight }) => ({ name, types, height, weight })))
      .toEqual([
        { name: 'Charizard', types: [{ name: 'fire' }, { name: 'flying' }], height: '1.7 m', weight: '90.5 kg' },
        { name: 'Mega Charizard X', types: [{ name: 'fire' }, { name: 'dragon' }], height: '1.7 m', weight: '110.5 kg' },
      ])
    expect(info.forms[0]).toMatchObject({
      heightMeters: 1.7,
      stats: [
        { name: 'HP', value: 78 },
        { name: 'Sp. Atk', value: 109 },
      ],
      abilities: [
        { name: 'Blaze', hidden: false },
        { name: 'Solar Power', hidden: true },
      ],
      cry: 'https://example.test/6.ogg',
      // Kept to show the form as it was in older games.
      pastTypes: [],
      pastStats: [[1, [{ name: 'Special', value: 85 }]]],
      pastAbilities: [[4, [{ slot: 3, ability: null }]]],
      learnset: {
        'firered-leafgreen': [{ move: 'flamethrower', method: 'machine', level: 0 }],
        'x-y': [{ move: 'flamethrower', method: 'level-up', level: 46 }],
      },
    })
    expect(info.forms[1].cry).toBeUndefined()

    const chain = info.evolutionChain!
    const charmeleon = chain.evolvesTo[0]
    expect([chain.name, chain.number, chain.requirement]).toEqual(['charmander', 4, undefined])
    expect([charmeleon.formattedName, charmeleon.requirement]).toEqual(['Charmeleon', 'Lv. 16'])
    expect(charmeleon.evolvesTo.map((p) => [p.name, p.requirement])).toEqual([['charizard', 'Lv. 36']])
  })

  test('rejects when the API fails', async () => {
    vi.stubGlobal('fetch', async () => new Response('down', { status: 503 }))

    await expect(getPokemonInfo('charizard')).rejects.toThrow('503')
  })
})

describe('describeEvolution', () => {
  test.each([
    [{ trigger: ref('use-item'), item: ref('water-stone') }, 'Water Stone'],
    [levelUp({ min_happiness: 160, time_of_day: 'day' }), 'High friendship (day)'],
    [{ trigger: ref('trade'), held_item: ref('metal-coat') }, 'Trade holding Metal Coat'],
    [levelUp({ known_move_type: ref('fairy'), min_affection: 2 }), 'knowing a Fairy move High affection'],
    [levelUp({ location: ref('eterna-forest') }), 'at Eterna Forest'],
    [levelUp(), 'Level Up'],
    [{ trigger: ref('three-critical-hits') }, 'Three Critical Hits'],
  ])('%o → %s', (detail, expected) => {
    expect(describeEvolution(detail)).toBe(expected)
  })
})
