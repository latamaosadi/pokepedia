import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'
import './style.css'
import VueLazyload from 'vue-lazyload'
import placeholder from './assets/images/placeholder.png'
import router from './router'

const pinia = createPinia()
const app = createApp(App)

app.use(router)
app.use(pinia)
app.use(VueLazyload, {
  loading: placeholder,
})
app.mount('#app')
