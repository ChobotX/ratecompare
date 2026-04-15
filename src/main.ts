import { createApp, watchEffect } from 'vue'
import App from './App.vue'
import { i18n } from './i18n'
import './assets/tailwind.css'
import './lib/theme'

watchEffect(() => {
  const locale = i18n.global.locale.value
  document.documentElement.lang = locale
  const title = i18n.global.t('appName') + ' — ' + i18n.global.t('title')
  document.title = title
})

createApp(App).use(i18n).mount('#app')
