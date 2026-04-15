<script setup lang="ts">
import { useId } from 'vue'
import { useI18n } from 'vue-i18n'
import InfoTooltip from './InfoTooltip.vue'
import ResetButton from './ResetButton.vue'
import type { TermLoanInput } from '../lib/types'
import { defaults, isDefault } from '../lib/defaults'

const { t } = useI18n()

const props = defineProps<{
  input: TermLoanInput
  longPayment: number
  shortPayment: number
}>()

function resetTerm<K extends keyof TermLoanInput>(key: K) {
  props.input[key] = defaults.term[key]
}
const termChanged = (key: keyof TermLoanInput): boolean => !isDefault(props.input[key], defaults.term[key])

const principalId = `fld-${useId()}`
const budgetId = `fld-${useId()}`
const longRateId = `fld-${useId()}`
const longTermId = `fld-${useId()}`
const shortRateId = `fld-${useId()}`
const shortTermId = `fld-${useId()}`
const returnId = `fld-${useId()}`
const inflId = `fld-${useId()}`

const fmtMoney = (v: number): string =>
  new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(Math.round(v))

const inputCls = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 pr-10 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100'
const resetCls = 'absolute right-2 top-1/2 -translate-y-1/2'
</script>

<template>
  <div class="grid gap-6">
    <section class="rounded-2xl border border-sky-400/40 bg-white/80 p-5 shadow-glow backdrop-blur dark:border-sky-400/30 dark:bg-slate-900/60">
      <h2 class="text-lg font-semibold text-sky-700 dark:text-sky-300">{{ t('termStep1Title') }}</h2>
      <p class="mt-1 text-sm text-slate-600 dark:text-slate-300">{{ t('termStep1Description') }}</p>
      <div class="mt-5 grid gap-4 md:grid-cols-2">
        <div class="grid gap-1">
          <div class="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
            <label :for="principalId">{{ t('termPrincipal') }}</label>
            <InfoTooltip :text="t('tooltipTermPrincipal')" :label="t('termPrincipal')" />
          </div>
          <div class="relative">
            <input :id="principalId" v-model.number="input.principal" type="number" inputmode="numeric" min="0" :class="inputCls" />
            <ResetButton :class="resetCls" :visible="termChanged('principal')" :label="t('termPrincipal')" @reset="resetTerm('principal')" />
          </div>
        </div>
        <div class="grid gap-1">
          <div class="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
            <label :for="budgetId">{{ t('termBudget') }}</label>
            <InfoTooltip :text="t('tooltipTermBudget')" :label="t('termBudget')" />
          </div>
          <div class="relative">
            <input :id="budgetId" v-model.number="input.monthlyBudget" type="number" inputmode="numeric" min="0" :class="inputCls" />
            <ResetButton :class="resetCls" :visible="termChanged('monthlyBudget')" :label="t('termBudget')" @reset="resetTerm('monthlyBudget')" />
          </div>
        </div>
      </div>
    </section>

    <section class="rounded-2xl border border-emerald-400/40 bg-white/80 p-5 shadow-glow backdrop-blur dark:border-emerald-400/30 dark:bg-slate-900/60">
      <h2 class="text-lg font-semibold text-emerald-700 dark:text-emerald-300">{{ t('termStep2Title') }}</h2>
      <p class="mt-1 text-sm text-slate-600 dark:text-slate-300">{{ t('termStep2Description') }}</p>
      <div class="mt-5 grid gap-4 md:grid-cols-2">
        <div class="grid gap-1">
          <div class="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
            <label :for="longRateId">{{ t('termLongRate') }}</label>
            <InfoTooltip :text="t('tooltipLoanRatePrefill')" :label="t('termLongRate')" />
          </div>
          <div class="relative">
            <input :id="longRateId" v-model.number="input.longRatePct" type="number" inputmode="decimal" min="0" step="0.01" :class="inputCls" />
            <ResetButton :class="resetCls" :visible="termChanged('longRatePct')" :label="t('termLongRate')" @reset="resetTerm('longRatePct')" />
          </div>
        </div>
        <div class="grid gap-1">
          <div class="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
            <label :for="longTermId">{{ t('termLongMonths') }}</label>
            <InfoTooltip :text="t('tooltipTermLongMonths')" :label="t('termLongMonths')" />
          </div>
          <div class="relative">
            <input :id="longTermId" v-model.number="input.longTermMonths" type="number" inputmode="numeric" min="1" step="1" :class="inputCls" />
            <ResetButton :class="resetCls" :visible="termChanged('longTermMonths')" :label="t('termLongMonths')" @reset="resetTerm('longTermMonths')" />
          </div>
        </div>
      </div>
      <p class="mt-3 text-xs text-slate-500 dark:text-slate-400">{{ t('termLongComputed', { payment: fmtMoney(longPayment) }) }}</p>
    </section>

    <section class="rounded-2xl border border-violet-400/40 bg-white/80 p-5 shadow-glow backdrop-blur dark:border-violet-400/30 dark:bg-slate-900/60">
      <h2 class="text-lg font-semibold text-violet-700 dark:text-violet-300">{{ t('termStep3Title') }}</h2>
      <p class="mt-1 text-sm text-slate-600 dark:text-slate-300">{{ t('termStep3Description') }}</p>
      <div class="mt-5 grid gap-4 md:grid-cols-2">
        <div class="grid gap-1">
          <div class="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
            <label :for="shortRateId">{{ t('termShortRate') }}</label>
            <InfoTooltip :text="t('tooltipLoanRatePrefill')" :label="t('termShortRate')" />
          </div>
          <div class="relative">
            <input :id="shortRateId" v-model.number="input.shortRatePct" type="number" inputmode="decimal" min="0" step="0.01" :class="inputCls" />
            <ResetButton :class="resetCls" :visible="termChanged('shortRatePct')" :label="t('termShortRate')" @reset="resetTerm('shortRatePct')" />
          </div>
        </div>
        <div class="grid gap-1">
          <div class="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
            <label :for="shortTermId">{{ t('termShortMonths') }}</label>
            <InfoTooltip :text="t('tooltipTermShortMonths')" :label="t('termShortMonths')" />
          </div>
          <div class="relative">
            <input :id="shortTermId" v-model.number="input.shortTermMonths" type="number" inputmode="numeric" min="1" step="1" :class="inputCls" />
            <ResetButton :class="resetCls" :visible="termChanged('shortTermMonths')" :label="t('termShortMonths')" @reset="resetTerm('shortTermMonths')" />
          </div>
        </div>
      </div>
      <p class="mt-3 text-xs text-slate-500 dark:text-slate-400">{{ t('termShortComputed', { payment: fmtMoney(shortPayment) }) }}</p>
    </section>

    <section class="rounded-2xl border border-indigo-400/40 bg-white/80 p-5 shadow-glow backdrop-blur dark:border-indigo-400/30 dark:bg-slate-900/60">
      <h2 class="text-lg font-semibold text-indigo-700 dark:text-indigo-300">{{ t('termStep4Title') }}</h2>
      <div class="mt-5 grid gap-4 md:grid-cols-2">
        <div class="grid gap-1">
          <div class="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
            <label :for="returnId">{{ t('expectedReturn') }}</label>
            <InfoTooltip :text="t('tooltipSp500')" :label="t('expectedReturn')" />
          </div>
          <div class="relative">
            <input :id="returnId" v-model.number="input.annualReturnPct" type="number" inputmode="decimal" min="-50" step="0.01" :class="inputCls" />
            <ResetButton :class="resetCls" :visible="termChanged('annualReturnPct')" :label="t('expectedReturn')" @reset="resetTerm('annualReturnPct')" />
          </div>
        </div>
        <div class="grid gap-1">
          <div class="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
            <label :for="inflId">{{ t('inflationRate') }}</label>
            <InfoTooltip :text="t('tooltipInflation')" :label="t('inflationRate')" />
          </div>
          <div class="relative">
            <input :id="inflId" v-model.number="input.annualInflationPct" type="number" inputmode="decimal" min="-20" step="0.01" :class="inputCls" />
            <ResetButton :class="resetCls" :visible="termChanged('annualInflationPct')" :label="t('inflationRate')" @reset="resetTerm('annualInflationPct')" />
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
