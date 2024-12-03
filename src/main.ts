import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import VueLazyload from 'vue-lazyload'
import loadingImage from '@/assets/loading.png'

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(VueLazyload, {
  loading: loadingImage,
})

app.mount('#app')
