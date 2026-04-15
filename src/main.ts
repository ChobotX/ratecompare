import { createApp, watchEffect } from 'vue'
import App from './App.vue'
import { i18n, detectBrowserLocale, defaultLocale, supportedLocales } from './i18n'
import './assets/tailwind.css'
import './lib/theme'

const LANG_STORAGE_KEY = 'lang-redirect'

function maybeRedirectToPreferredLocale() {
  if (typeof window === 'undefined') return false
  if (window.location.pathname !== '/') return false
  if (window.sessionStorage?.getItem(LANG_STORAGE_KEY)) return false
  const preferred = detectBrowserLocale()
  if (preferred === defaultLocale || !supportedLocales.includes(preferred)) return false
  try {
    window.sessionStorage?.setItem(LANG_STORAGE_KEY, '1')
  } catch {}
  window.location.replace(`/${preferred}/`)
  return true
}

if (!maybeRedirectToPreferredLocale()) {
  watchEffect(() => {
    const locale = i18n.global.locale.value
    document.documentElement.lang = locale
    const title = i18n.global.t('appName') + ' — ' + i18n.global.t('title')
    document.title = title
  })

  createApp(App).use(i18n).mount('#app')
}
