<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import InfoTooltip from './InfoTooltip.vue'
import type { ComparisonSummary } from '../lib/types'

const props = defineProps<{
  summary: ComparisonSummary
}>()

const { t, locale } = useI18n()

const asMoney = (value: number): string =>
  new Intl.NumberFormat(locale.value, { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 }).format(value)

const cardToneByKey = computed(() => {
  const values = {
    invest: props.summary.investGainReal,
    paydown: props.summary.paydownGainReal,
    paydownThenInvest: props.summary.paydownThenInvestGainReal,
  }
  const list = Object.values(values)
  const min = Math.min(...list)
  const max = Math.max(...list)

  const toneFor = (value: number): string => {
    if (value === max) {
      return 'text-emerald-300'
    }
    if (value === min) {
      return 'text-rose-300'
    }
    return 'text-amber-300'
  }

  return {
    invest: toneFor(values.invest),
    paydown: toneFor(values.paydown),
    paydownThenInvest: toneFor(values.paydownThenInvest),
  }
})

const winnerCardClassByKey = computed(() => ({
  invest:
    props.summary.winner === 'invest'
      ? 'border-emerald-500/60 bg-emerald-500/10'
      : 'border-slate-700 bg-slate-950/70',
  paydown:
    props.summary.winner === 'paydown'
      ? 'border-sky-500/60 bg-sky-500/10'
      : 'border-slate-700 bg-slate-950/70',
  paydownThenInvest:
    props.summary.winner === 'paydownThenInvest'
      ? 'border-violet-500/60 bg-violet-500/10'
      : 'border-slate-700 bg-slate-950/70',
}))
</script>

<template>
  <section class="rounded-2xl border border-emerald-400/30 bg-slate-900/70 p-5 backdrop-blur">
    <h2 class="text-lg font-semibold text-emerald-300">{{ t('step4Title') }}</h2>
    <p class="mt-1 text-sm text-slate-300">{{ t('comparisonHorizon', { months: summary.horizonMonths }) }}</p>

    <div class="mt-5 grid gap-4 md:grid-cols-3">
      <article class="rounded-xl border p-4" :class="winnerCardClassByKey.invest">
        <h3 class="flex items-center gap-2 text-sm text-slate-300">
          {{ t('investPathGain') }}
          <InfoTooltip :text="t('tooltipInvestPath')" />
        </h3>
        <p class="mt-2 text-2xl font-semibold" :class="cardToneByKey.invest">
          {{ asMoney(summary.investGainNominal) }}
        </p>
        <p class="mt-1 text-xs text-slate-400">
          {{ t('realAfterInflation') }}: {{ asMoney(summary.investGainReal) }}
        </p>
      </article>

      <article class="rounded-xl border p-4" :class="winnerCardClassByKey.paydown">
        <h3 class="flex items-center gap-2 text-sm text-slate-300">
          {{ t('paydownPathGain') }}
          <InfoTooltip :text="t('tooltipPaydownPath')" />
        </h3>
        <p class="mt-2 text-2xl font-semibold" :class="cardToneByKey.paydown">
          {{ asMoney(summary.paydownGainNominal) }}
        </p>
        <p class="mt-1 text-xs text-slate-400">
          {{ t('realAfterInflation') }}: {{ asMoney(summary.paydownGainReal) }}
        </p>
      </article>

      <article class="rounded-xl border p-4" :class="winnerCardClassByKey.paydownThenInvest">
        <h3 class="flex items-center gap-2 text-sm text-slate-300">
          {{ t('paydownThenInvestPathGain') }}
          <InfoTooltip :text="t('tooltipPaydownThenInvestPath')" />
        </h3>
        <p class="mt-2 text-2xl font-semibold" :class="cardToneByKey.paydownThenInvest">
          {{ asMoney(summary.paydownThenInvestGainNominal) }}
        </p>
        <p class="mt-1 text-xs text-slate-400">
          {{ t('realAfterInflation') }}: {{ asMoney(summary.paydownThenInvestGainReal) }}
        </p>
      </article>
    </div>

  </section>
</template>
