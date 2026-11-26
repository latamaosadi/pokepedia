// Gives every page its own static HTML at build time, so search engines and link previews
// (Slack, Discord, X, iMessage…), which mostly don't run JavaScript, see a real title,
// description and image instead of the bare app shell. Also writes a sitemap.
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import type { Plugin, ResolvedConfig } from 'vite'
import pokemonData from '../src/data/pokemon.json' with { type: 'json' }
import { defensiveMatchups } from '../src/utils/type-matchups'

export interface PokemonEntry {
  number: number
  name: string
  types: string[]
  genus?: string
}

export interface PageMeta {
  path: string
  title: string
  description: string
  image?: string
  /** Shown until the app starts, so crawlers that don't run JavaScript still see content. */
  body?: string
}

const SITE_NAME = 'Poképedia'

const titleCase = (text: string) =>
  text.replace(/^[-_]*(.)/, (_, c) => c.toUpperCase()).replace(/[-_]+(.)/g, (_, c) => ' ' + c.toUpperCase())

const escapeHtml = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const artwork = (number: number) =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${number}.png`

/** The list pages: the home grid and the Pokédex view. */
export const listPages: PageMeta[] = [
  {
    path: '/',
    title: `${SITE_NAME} – Browse all Pokémon`,
    description:
      'A fan-made Pokédex that works offline: browse and search all Pokémon, with stats, abilities, type matchups, evolutions and shiny artwork.',
  },
  {
    path: '/dex',
    title: `Pokédex · ${SITE_NAME}`,
    description:
      'Scroll through the National Pokédex one Pokémon at a time, with search, type filters, favorites and shiny artwork.',
  },
  {
    path: '/team',
    title: `Pokémon Team Builder & Weakness Checker · ${SITE_NAME}`,
    description:
      "Build a team of six and see its shared weaknesses, resistances and the types it can't hit super effectively, with the type chart of the game you're playing.",
  },
]

const link = (entry: PokemonEntry) => `<a href="/dex/${entry.name}">${escapeHtml(titleCase(entry.name))}</a>`

const FRACTIONS: Record<number, string> = { 4: '4×', 0.25: '¼×' }

/** "Rock (4×), Water, Electric" for the attacking types in the given multipliers. */
function matchups(types: string[], multipliers: number[]) {
  return defensiveMatchups(types)
    .filter(({ multiplier }) => multipliers.includes(multiplier))
    .flatMap(({ multiplier, types }) =>
      types.map((type) => titleCase(type) + (FRACTIONS[multiplier] ? ` (${FRACTIONS[multiplier]})` : '')),
    )
    .join(', ')
}

export function pokemonPage(entry: PokemonEntry, previous?: PokemonEntry, next?: PokemonEntry): PageMeta {
  const { number, name, types, genus } = entry
  const displayName = titleCase(name)
  const typeLabel = types.map(titleCase).join('/')
  const dexNumber = String(number).padStart(4, '0')
  const article = /^[aeiou]/i.test(typeLabel) ? 'an' : 'a'
  const weak = matchups(types, [4, 2])
  const resists = matchups(types, [0.5, 0.25])
  const immune = matchups(types, [0])
  const description = [
    `${displayName}${genus ? `, the ${genus},` : ''} is ${article} ${typeLabel}-type Pokémon, #${number} in the National Pokédex.`,
    weak && `Weak to ${weak}.`,
    'See its stats, moves in each game, abilities and evolutions.',
  ]
    .filter(Boolean)
    .join(' ')
  const neighbours = [previous && `Previous: ${link(previous)}`, next && `Next: ${link(next)}`].filter(Boolean)
  return {
    path: `/dex/${name}`,
    title: `${displayName} #${dexNumber} – Stats, Moves & Weaknesses · ${SITE_NAME}`,
    description,
    image: artwork(number),
    body: [
      `<h1>${escapeHtml(displayName)} #${dexNumber}</h1>`,
      `<p>${escapeHtml(description)}</p>`,
      '<h2>Weaknesses</h2>',
      `<dl><dt>Weak to</dt><dd>${weak || 'None'}</dd><dt>Resists</dt><dd>${resists || 'None'}</dd>` +
        (immune ? `<dt>Immune to</dt><dd>${immune}</dd>` : '') +
        '</dl>',
      `<nav>${[...neighbours, '<a href="/">All Pokémon</a>'].join(' · ')}</nav>`,
    ].join(''),
  }
}

/** Swaps the page's title and description and adds canonical and link-preview tags. */
export function withMeta(html: string, meta: PageMeta, siteUrl: string) {
  const url = siteUrl + (meta.path === '/' ? '/' : meta.path)
  const image = meta.image ?? `${siteUrl}/pwa-512x512.png`
  const tags = [
    `<link rel="canonical" href="${url}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${SITE_NAME}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:title" content="${escapeHtml(meta.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(meta.description)}" />`,
    `<meta property="og:image" content="${image}" />`,
    `<meta name="twitter:card" content="summary" />`,
  ].join('\n    ')
  return html
    .replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(meta.title)}</title>`)
    .replace(
      /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/,
      `<meta name="description" content="${escapeHtml(meta.description)}" />`,
    )
    .replace('</head>', `  ${tags}\n  </head>`)
    .replace('<div id="app"></div>', `<div id="app">${meta.body ?? ''}</div>`)
}

export function sitemap(siteUrl: string, pages: PageMeta[]) {
  const urls = pages.map((page) => `  <url><loc>${siteUrl}${page.path}</loc></url>`).join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
}

/** Path of the HTML file for a page; served extensionless thanks to Vercel's cleanUrls. */
const fileFor = (path: string) => (path === '/' ? 'index.html' : `${path.slice(1)}.html`)

export function seoPages(siteUrl: string): Plugin {
  let config: ResolvedConfig
  return {
    name: 'seo-pages',
    apply: 'build',
    configResolved(resolved) {
      config = resolved
    },
    async closeBundle() {
      const outDir = join(config.root, config.build.outDir)
      const shell = await readFile(join(outDir, 'index.html'), 'utf8')
      const pokemon = pokemonData as PokemonEntry[]
      const pages = [...listPages, ...pokemon.map((entry, i) => pokemonPage(entry, pokemon[i - 1], pokemon[i + 1]))]
      await mkdir(join(outDir, 'dex'), { recursive: true })
      await Promise.all(
        pages.map((page) => writeFile(join(outDir, fileFor(page.path)), withMeta(shell, page, siteUrl))),
      )
      await writeFile(join(outDir, 'sitemap.xml'), sitemap(siteUrl, pages))
      await writeFile(
        join(outDir, 'robots.txt'),
        `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`,
      )
    },
  }
}
