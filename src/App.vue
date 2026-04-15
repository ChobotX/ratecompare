<script setup lang="ts">
import { computed, onMounted, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import InputPanel from './components/InputPanel.vue'
import SummaryPanel from './components/SummaryPanel.vue'
import { buildComparison, deriveLoanInput } from './lib/finance'
import { fetchMarketBundle } from './lib/market'
import type { LoanDraftInput, MarketInput, LoanInput } from './lib/types'

const { t } = useI18n()

const loanDraft = reactive<LoanDraftInput>({
  principal: 2_250_000,
  annualRatePct: 5.2,
  monthlyPayment: null,
  paymentsLeft: 276,
})

const market = reactive<MarketInput>({
  spareCash: 200_000,
  annualReturnPct: 8,
  annualInflationPct: 2.2,
})

const rateMeta = reactive({
  sp500Source: '',
  inflationSource: '',
  sp500Fallback: false,
  inflationFallback: false,
})

const derivedLoan = computed(() => deriveLoanInput(loanDraft))

const comparison = computed(() => (derivedLoan.value.loan ? buildComparison({ loan: derivedLoan.value.loan, market }) : null))
const hasLoanWarning = computed(() => comparison.value?.baselineLoan.isNegativeAmortization ?? false)

onMounted(async () => {
  const { sp500, inflation, loanRate } = await fetchMarketBundle()
  loanDraft.annualRatePct = loanRate.value
  market.annualReturnPct = sp500.value
  market.annualInflationPct = inflation.value
  rateMeta.sp500Source = sp500.source
  rateMeta.inflationSource = inflation.source
  rateMeta.sp500Fallback = sp500.usedFallback
  rateMeta.inflationFallback = inflation.usedFallback
})
</script>

<template>
  <main class="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950 px-4 py-10 md:px-8">
    <div class="mx-auto max-w-7xl space-y-6">
      <header class="space-y-2">
        <p class="text-sm uppercase tracking-[0.2em] text-sky-300">{{ t('appName') }}</p>
        <h1 class="text-3xl font-bold text-white md:text-4xl">{{ t('title') }}</h1>
        <p class="max-w-3xl text-slate-300">
          {{ t('subtitle') }}
        </p>
      </header>

      <InputPanel
        :loan-draft="loanDraft"
        :resolved-loan="derivedLoan.loan as LoanInput | null"
        :market="market"
        :derived-field="derivedLoan.derivedField"
        :derivation-message="derivedLoan.message"
        :sp500-source="rateMeta.sp500Source"
        :inflation-source="rateMeta.inflationSource"
        :sp500-fallback="rateMeta.sp500Fallback"
        :inflation-fallback="rateMeta.inflationFallback"
      />

      <div
        v-if="derivedLoan.message"
        class="rounded-xl border border-amber-400/50 bg-amber-500/10 p-4 text-sm text-amber-100"
      >
        {{ t(`deriveMessage.${derivedLoan.message}`) }}
      </div>

      <div
        v-if="hasLoanWarning"
        class="rounded-xl border border-amber-400/50 bg-amber-500/10 p-4 text-sm text-amber-100"
      >
        {{ t('warning') }}
      </div>

      <SummaryPanel v-if="comparison" :summary="comparison" />

      <footer class="text-xs text-slate-400">
        {{ t('assumptions') }}
      </footer>
    </div>
  </main>
</template>
