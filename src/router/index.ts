import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: { name: 'dex' },
    component: () => import('@/layouts/DefaultLayout.vue'),
    children: [
      {
        path: 'dex',
        name: 'dex',
        component: () => import('@/pages/HomePage.vue'),
        // children: [
        //   {
        //     path: ':id',
        //     name: 'dex.detail',
        //     component: () => import('@/pages/DetailPage.vue'),
        //   },
        // ],
      },
      {
        path: 'dex/:id',
        name: 'dex.detail',
        component: () => import('@/pages/DetailPage.vue'),
      },
    ],
  },
  { path: '/:pathMatch(.*)*', redirect: { name: 'dex' } },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (to.name === 'dex' && savedPosition) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({ top: savedPosition.top })
        }, 50)
      })
    }
    return { top: 0 }
  },
})

export default router
