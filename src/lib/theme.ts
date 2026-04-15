import { ref, watch } from 'vue'

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'theme'
const media = window.matchMedia('(prefers-color-scheme: dark)')
const stored = localStorage.getItem(STORAGE_KEY) as Theme | null

export const theme = ref<Theme>(stored ?? (media.matches ? 'dark' : 'light'))

const apply = (t: Theme) => {
  document.documentElement.classList.toggle('dark', t === 'dark')
}

apply(theme.value)

watch(theme, (t) => {
  apply(t)
  localStorage.setItem(STORAGE_KEY, t)
})

media.addEventListener('change', (event) => {
  if (localStorage.getItem(STORAGE_KEY)) return
  theme.value = event.matches ? 'dark' : 'light'
})

export const toggleTheme = () => {
  theme.value = theme.value === 'dark' ? 'light' : 'dark'
}
