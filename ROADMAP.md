# Roadmap

Ideas for improving Poképedia, ranked by value against effort.

## High value, low effort

- [x] **Search and filter.** Search by name or number (`pika`, `25`, `#025`) and filter by type, on both the home grid and the Pokédex. The filter is shared between the two views.
- [x] **Richer detail page.** Base stats with bars and a total, abilities (hidden ones marked), and a button to play the cry. All of it comes from the `/pokemon/{id}` response the page already fetches.
- [x] **Previous / next on the detail page.** Links in the top bar, ← / → keys and swiping on phones go to #N±1 in National Dex order.
- [x] **Shiny toggle.** One switch, in the list filter bar and on the detail page, shows shiny artwork on gold, sparkling cards everywhere. It's remembered across visits.

## Medium effort

- [x] **Ship the Pokémon list with the app.** The list and type chart live in `src/data/` (regenerate with `bun run update-data`), so a first visit makes no API requests and works offline.
- [x] **Type matchups.** The detail page shows damage taken from each type (4×, 2×, ½×, ¼×, 0×) for the selected form. Abilities like Levitate aren't factored in.
- [x] **Favorites.** A ☆ button on detail pages and a Favorites filter in the lists, stored in `localStorage`. A team builder (6 Pokémon) is still open.
- [x] **Faster Pokédex card.** The big card now follows the list after 100ms instead of 500ms.
- [x] **Size comparison.** The detail page draws the Pokémon next to a 1.6 m trainer, to scale. For serpents and fish (PokeAPI shapes `squiggle` and `fish`) the listed height is a length, so the body is drawn that long and labelled "m long". The serpent length is an estimate from the pose (width + height of the artwork).
- [x] **Page-turn swipe.** On phones, swiping the detail page peels it like paper to the previous or next Pokémon, and letting go early cancels.
- [x] **Pokédex fixes.** Snap scrolling, rows you can click to select, and lists that keep their size when a search returns only a few results.
- [x] **Type picker with symbols.** The type filter is a grid of type symbols, with the selected type highlighted.

## Discoverability

- [x] **A page per Pokémon.** The build writes `dex/<name>.html` with its own title, description and preview image, plus `sitemap.xml` and `robots.txt`. Each view sets its page title.

## Loose ends

- [ ] **Labels hidden by artwork.** On some home cards the artwork covers the type badges (Miraidon's tail over its Electric badge).
- [ ] **Only one evolution method shown.** Leafeon shows "at Eterna Forest" but not Leaf Stone. Marked with a `ponytail:` comment in `src/services/pokemon.ts`.
- [ ] **Sprite cache has no limit.** The `raw.githubusercontent.com` cache grows with every Pokémon viewed. Add an `expiration` setting like the `pokeapi` cache has in `vite.config.ts`.
- [x] **Type order differs between pages.** The shipped list stores types in the game's order, so cards and the detail page agree.
- [ ] **Noisy screen-reader names.** Home card links are announced as "Charmander #4 Fire Charmander Card". An `aria-label` with just the name would be cleaner.
- [ ] **Gyro tilt untested on real phones.** The tilt range and re-centering speed (`GYRO_RANGE`, `GYRO_RECENTER` in `PokemonCard.vue`) and the landscape direction need checking on a real device, over HTTPS.

## Repo housekeeping

- [ ] **Two commits on `v2` don't build** (`db27d9e`, `1f877d3`). Each could be squashed into the commit after it, which needs a force-push.
