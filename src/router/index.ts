import { createRouter, createWebHistory } from 'vue-router'

// Last scroll position of the home grid, so coming back via the
// "All Pokémon" link (not just the browser's back button) lands where you left.
let homeScrollTop = 0

// The virtual grid only gets its full height after measuring a card, so wait
// until the page can actually scroll that far before restoring.
function whenScrollable(top: number) {
  return new Promise<void>((resolve) => {
    const start = performance.now()
    const check = () => {
      const maxTop = document.documentElement.scrollHeight - window.innerHeight
      if (maxTop >= top || performance.now() - start > 1500) resolve()
      else requestAnimationFrame(check)
    }
    check()
  })
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/HomeView.vue'),
    },
    {
      path: '/dex',
      name: 'dex',
      component: () => import('../views/PokedexView.vue'),
    },
    {
      path: '/dex/:id',
      name: 'dex.detail',
      component: () => import('../views/PokemonDetailView.vue'),
    },
  ],
  async scrollBehavior(to, _from, savedPosition) {
    const top = savedPosition?.top ?? (to.name === 'home' ? homeScrollTop : 0)
    if (top) await whenScrollable(top)
    return { top }
  },
})

router.beforeEach((_to, from) => {
  if (from.name === 'home') homeScrollTop = window.scrollY
})

export default router
