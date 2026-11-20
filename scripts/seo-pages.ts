// Gives every page its own static HTML at build time, so search engines and link previews
// (Slack, Discord, X, iMessage…), which mostly don't run JavaScript, see a real title,
// description and image instead of the bare app shell. Also writes a sitemap.
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import type { Plugin, ResolvedConfig } from 'vite'
import pokemonData from '../src/data/pokemon.json' with { type: 'json' }

export interface PokemonEntry {
  number: number
  name: string
  types: string[]
}

export interface PageMeta {
  path: string
  title: string
  description: string
  image?: string
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
]

export function pokemonPage({ number, name, types }: PokemonEntry): PageMeta {
  const displayName = titleCase(name)
  const typeLabel = types.map(titleCase).join('/')
  const dexNumber = String(number).padStart(4, '0')
  const article = /^[aeiou]/i.test(typeLabel) ? 'an' : 'a'
  return {
    path: `/dex/${name}`,
    title: `${displayName} (#${dexNumber}) · ${typeLabel} · ${SITE_NAME}`,
    description: `${displayName} is ${article} ${typeLabel}-type Pokémon, #${number} in the National Pokédex. See its base stats, abilities, type matchups, forms and evolutions.`,
    image: artwork(number),
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
      const pages = [...listPages, ...(pokemonData as PokemonEntry[]).map(pokemonPage)]
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
