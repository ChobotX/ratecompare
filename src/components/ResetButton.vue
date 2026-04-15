<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const props = defineProps<{ visible: boolean; label?: string; controls?: string }>()
const emit = defineEmits<{ (e: 'reset'): void }>()

const { t } = useI18n()

function onClick() {
  emit('reset')
  if (props.controls) {
    requestAnimationFrame(() => {
      document.getElementById(props.controls as string)?.focus()
    })
  }
}
</script>

<template>
  <button
    v-if="visible"
    type="button"
    class="inline-flex h-6 w-6 items-center justify-center rounded-full bg-transparent text-slate-400 hover:bg-slate-200 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-sky-500 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-200 dark:focus-visible:ring-offset-slate-950"
    :aria-label="label ? `${t('resetToDefault')}: ${label}` : t('resetToDefault')"
    :aria-controls="controls"
    :title="t('resetToDefault')"
    @click="onClick"
  >
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="h-3.5 w-3.5" aria-hidden="true">
      <path fill-rule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0v2.43l-.31-.31A7 7 0 003.239 8.188a.75.75 0 101.448.389A5.5 5.5 0 0113.89 6.11l.311.31h-2.432a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z" clip-rule="evenodd" />
    </svg>
  </button>
</template>
