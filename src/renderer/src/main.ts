import './assets/style/index.css'
import { createApp } from 'vue'
import App from './App.vue'
import naive from 'naive-ui'
import router from './router'
import pinia from './stores'
import i18n from './i18n'
import 'virtual:uno.css'

const app = createApp(App)
app.use(naive)
app.use(router)
app.use(pinia)
app.use(i18n)
app.mount('#app')
