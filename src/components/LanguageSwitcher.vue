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
      class="h-9 rounded-full border border-slate-300 bg-white px-3 text-sm text-slate-700 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
      @change="onChange"
    >
      <option v-for="opt in options" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
    </select>
  </div>
</template>
