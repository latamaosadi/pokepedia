# Roadmap

Ideas for improving Poképedia, ranked by value against effort.

## High value, low effort

- [x] **Search and filter.** Search by name or number (`pika`, `25`, `#025`) and filter by type, on both the home grid and the Pokédex. The filter is shared between the two views.
- [x] **Richer detail page.** Base stats with bars and a total, abilities (hidden ones marked), and a button to play the cry. All of it comes from the `/pokemon/{id}` response the page already fetches.
- [x] **Previous / next on the detail page.** Links in the top bar, ← / → keys and swiping on phones go to #N±1 in National Dex order.
- [x] **Shiny toggle.** One switch, in the list filter bar and on the detail page, shows shiny artwork on gold, sparkling cards everywhere. It's remembered across visits.

## Medium effort

- [ ] **Ship the Pokémon list with the app.** A first visit sends 29 PokeAPI requests before anything shows. Generating the list as JSON at build time would make the first load instant and offline-ready, and remove the main way the app can fail.
- [ ] **Type matchups.** Show weaknesses and resistances on the detail page. The `/type` responses the app fetches already include damage relations, but they're discarded.
- [ ] **Favorites or a team builder.** Star Pokémon or build a team of 6, stored in `localStorage`.
- [ ] **Faster Pokédex card.** The big card waits 500ms after the list settles before switching. With snapping in place, about 100ms should be enough.

## Loose ends

- [ ] **Labels hidden by artwork.** On some home cards the artwork covers the type badges (Miraidon's tail over its Electric badge).
- [ ] **Only one evolution method shown.** Leafeon shows "at Eterna Forest" but not Leaf Stone. Marked with a `ponytail:` comment in `src/services/pokemon.ts`.
- [ ] **Sprite cache has no limit.** The `raw.githubusercontent.com` cache grows with every Pokémon viewed. Add an `expiration` setting like the `pokeapi` cache has in `vite.config.ts`.
- [ ] **Type order differs between pages.** Home cards show Charizard as "Flying, Fire" while the detail page shows "Fire, Flying" (the game's order).
- [ ] **Noisy screen-reader names.** Home card links are announced as "Charmander #4 Fire Charmander Card". An `aria-label` with just the name would be cleaner.
- [ ] **Gyro tilt untested on real phones.** The tilt range and re-centering speed (`GYRO_RANGE`, `GYRO_RECENTER` in `PokemonCard.vue`) and the landscape direction need checking on a real device, over HTTPS.

## Repo housekeeping

- [ ] **Two commits on `v2` don't build** (`db27d9e`, `1f877d3`). Each could be squashed into the commit after it, which needs a force-push.
