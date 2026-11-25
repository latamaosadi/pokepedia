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

## Game guide

- [x] **Game selector.** Pick one of 22 games (Red / Blue to Legends: Z-A) in the list filter bar. The lists show that game's regional Pokédex in its order and numbering, and previous/next follows it.
- [x] **Era-accurate data.** With a game picked, types, base stats (Gen 1's Special), abilities (none before Gen 3, no hidden ones before Gen 5) and type matchups are as they were then. Bundled from PokeAPI's past values by `bun run update-data`.
- [x] **Movesets.** The detail page lists level-up, TM/HM/TR, egg and tutor moves for the game, with each move's type, category, power, accuracy and PP in that game.
- [x] **Per-game Pokédex entries.** The About tab shows the selected game's entry, one per version when they differ (Sun and Moon), or the newest game's when there's none.
- [x] **Evolution by game.** The Evolution tab leaves out Pokémon from later generations and shows each evolution's method in the selected game (Leafeon at Eterna Forest in Diamond / Pearl, Leaf Stone from Sword / Shield), as cards in each Pokémon's colour. Location methods apply per generation, a stand-in for region.
- [x] **Forms by game.** The Form picker lists only the forms in the selected game: Megas from X / Y, regional forms from their own game, Gigantamax in Sword / Shield.
- [x] **Abilities, training and breeding.** Each ability's effect, EV yield, catch rate, base friendship, growth rate, egg groups, gender ratio, egg cycles and wild held items per version. Mechanics are hidden in games older than them (no EVs listed before Gen 3, no breeding in Gen 1).
- [x] **Stat calculator.** The Stats tab works out a Pokémon's stats from level, nature, IVs and EVs, with Gen 1–2's DVs and stat experience when one of those games is picked.
- [ ] **Where to find it.** Wild encounter locations per game. PokeAPI only has them up to Gen 7.
- [ ] **Game in the URL.** The selected game is remembered per device. A `?game=` parameter would make shared links open in the same game.

## Discoverability

- [x] **A page per Pokémon.** The build writes `dex/<name>.html` with its own title, description and preview image, plus `sitemap.xml` and `robots.txt`. Each view sets its page title.

## Loose ends

- [ ] **Labels hidden by artwork.** On some home cards the artwork covers the type badges (Miraidon's tail over its Electric badge).
- [ ] **Sprite cache has no limit.** The `raw.githubusercontent.com` cache grows with every Pokémon viewed. Add an `expiration` setting like the `pokeapi` cache has in `vite.config.ts`.
- [x] **Type order differs between pages.** The shipped list stores types in the game's order, so cards and the detail page agree.
- [ ] **Noisy screen-reader names.** Home card links are announced as "Charmander #4 Fire Charmander Card". An `aria-label` with just the name would be cleaner.
- [ ] **Gyro tilt untested on real phones.** The tilt range and re-centering speed (`GYRO_RANGE`, `GYRO_RECENTER` in `PokemonCard.vue`) and the landscape direction need checking on a real device, over HTTPS.

## Repo housekeeping

- [ ] **Two commits on `v2` don't build** (`db27d9e`, `1f877d3`). Each could be squashed into the commit after it, which needs a force-push.
