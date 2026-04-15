<script setup lang="ts">
import { computed, useId } from 'vue'
import { useI18n } from 'vue-i18n'
import { supportedLocales, defaultLocale, type SupportedLocale } from '../i18n'

const { t, locale } = useI18n()

const labelId = `lang-${useId()}`

const options: { value: SupportedLocale; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'cs', label: 'Čeština' },
  { value: 'de', label: 'Deutsch' },
  { value: 'sk', label: 'Slovenčina' },
  { value: 'pl', label: 'Polski' },
]

const current = computed<SupportedLocale>(() => (locale.value as SupportedLocale) ?? defaultLocale)

function onChange(event: Event) {
  const next = (event.target as HTMLSelectElement).value as SupportedLocale
  if (!supportedLocales.includes(next) || next === current.value) return
  const target = next === defaultLocale ? '/' : `/${next}/`
  window.location.assign(target)
}
</script>

<template>
  <div class="flex items-center gap-1">
    <label :id="labelId" :for="`${labelId}-select`" class="sr-only">{{ t('languageLabel') }}</label>
    <select
      :id="`${labelId}-select`"
      :aria-labelledby="labelId"
      :value="current"
      class="lang-select h-9 appearance-none rounded-full border border-slate-300 bg-white bg-no-repeat pl-4 pr-9 text-sm text-slate-700 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
      @change="onChange"
    >
      <option v-for="opt in options" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
    </select>
  </div>
</template>

<style scoped>
.lang-select {
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%2364748b'><path fill-rule='evenodd' d='M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 111.08 1.04l-4.25 4.39a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z' clip-rule='evenodd'/></svg>");
  background-position: right 0.75rem center;
  background-size: 16px 16px;
}
:global(.dark) .lang-select {
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%2394a3b8'><path fill-rule='evenodd' d='M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 111.08 1.04l-4.25 4.39a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z' clip-rule='evenodd'/></svg>");
}
</style>
