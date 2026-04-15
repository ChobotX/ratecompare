<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import InfoTooltip from './InfoTooltip.vue'
import GainsChart from './GainsChart.vue'
import type { TermComparisonSummary } from '../lib/types'

const props = defineProps<{ summary: TermComparisonSummary }>()

const { t, locale } = useI18n()

const asMoney = (value: number): string =>
  new Intl.NumberFormat(locale.value, { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 }).format(value)

const chartSeries = computed(() => [
  { key: 'long', label: t('termLongLabel'), color: '#10b981', data: props.summary.longStrategy.seriesNominal },
  { key: 'short', label: t('termShortLabel'), color: '#8b5cf6', data: props.summary.shortStrategy.seriesNominal, dashed: true },
  { key: 'longLoan', label: t('termLongLoanLabel'), color: '#f43f5e', data: props.summary.longStrategy.loanSeriesNominal },
  { key: 'shortLoan', label: t('termShortLoanLabel'), color: '#f59e0b', data: props.summary.shortStrategy.loanSeriesNominal, dashed: true },
])

const toneFor = (winnerKey: 'long' | 'short') => {
  if (props.summary.winner === 'tie') return 'text-amber-600 dark:text-amber-300'
  return props.summary.winner === winnerKey ? 'text-emerald-600 dark:text-emerald-300' : 'text-rose-600 dark:text-rose-300'
}

const cardFor = (winnerKey: 'long' | 'short') => {
  if (props.summary.winner === winnerKey) {
    return winnerKey === 'long'
      ? 'border-emerald-500/60 bg-emerald-500/10'
      : 'border-violet-500/60 bg-violet-500/10'
  }
  return 'border-slate-200 bg-white/70 dark:border-slate-700 dark:bg-slate-950/70'
}
</script>

<template>
  <section
    aria-live="polite"
    aria-labelledby="term-summary-heading"
    class="rounded-2xl border border-emerald-400/40 bg-white/80 p-5 backdrop-blur dark:border-emerald-400/30 dark:bg-slate-900/70"
  >
    <h2 id="term-summary-heading" class="text-lg font-semibold text-emerald-700 dark:text-emerald-300">{{ t('termSummaryTitle') }}</h2>
    <p class="mt-1 text-sm text-slate-600 dark:text-slate-300">{{ t('comparisonHorizon', { months: summary.horizonMonths }) }}</p>

    <div class="mt-5 grid gap-4 md:grid-cols-2">
      <article class="rounded-xl border p-4" :class="cardFor('long')">
        <div class="flex items-center justify-between gap-2">
          <h3 class="text-sm text-slate-600 dark:text-slate-300">{{ t('termLongLabel') }}</h3>
          <InfoTooltip :text="t('tooltipTermLong')" :label="t('termLongLabel')" />
        </div>
        <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">{{ t('termLongDesc') }}</p>
        <p class="mt-2 text-2xl font-semibold" :class="toneFor('long')">
          {{ asMoney(summary.longStrategy.endingBalanceNominal) }}
        </p>
        <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {{ t('realAfterInflation') }}: {{ asMoney(summary.longStrategy.endingBalanceReal) }}
        </p>
        <dl class="mt-3 grid grid-cols-2 gap-1 text-xs text-slate-500 dark:text-slate-400">
          <dt>{{ t('termPaymentLabel') }}</dt>
          <dd class="text-right">{{ asMoney(summary.longStrategy.monthlyPayment) }}</dd>
          <dt>{{ t('termInvestMonthly') }}</dt>
          <dd class="text-right">{{ asMoney(summary.longStrategy.monthlyInvestPhase1) }}</dd>
        </dl>
      </article>

      <article class="rounded-xl border p-4" :class="cardFor('short')">
        <div class="flex items-center justify-between gap-2">
          <h3 class="text-sm text-slate-600 dark:text-slate-300">{{ t('termShortLabel') }}</h3>
          <InfoTooltip :text="t('tooltipTermShort')" :label="t('termShortLabel')" />
        </div>
        <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">{{ t('termShortDesc') }}</p>
        <p class="mt-2 text-2xl font-semibold" :class="toneFor('short')">
          {{ asMoney(summary.shortStrategy.endingBalanceNominal) }}
        </p>
        <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {{ t('realAfterInflation') }}: {{ asMoney(summary.shortStrategy.endingBalanceReal) }}
        </p>
        <dl class="mt-3 grid grid-cols-2 gap-1 text-xs text-slate-500 dark:text-slate-400">
          <dt>{{ t('termPaymentLabel') }}</dt>
          <dd class="text-right">{{ asMoney(summary.shortStrategy.monthlyPayment) }}</dd>
          <dt>{{ t('termInvestPhase1') }}</dt>
          <dd class="text-right">{{ asMoney(summary.shortStrategy.monthlyInvestPhase1) }}</dd>
          <dt>{{ t('termInvestPhase2') }}</dt>
          <dd class="text-right">{{ asMoney(summary.shortStrategy.monthlyInvestPhase2) }}</dd>
        </dl>
      </article>
    </div>

    <GainsChart :series="chartSeries" :horizon-months="summary.horizonMonths" :title="t('termChartTitle')" />
  </section>
</template>
