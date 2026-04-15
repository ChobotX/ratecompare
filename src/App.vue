<script setup lang="ts">
import { computed, onMounted, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import InputPanel from './components/InputPanel.vue'
import SummaryPanel from './components/SummaryPanel.vue'
import ThemeToggle from './components/ThemeToggle.vue'
import LanguageSwitcher from './components/LanguageSwitcher.vue'
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
  <a href="#main-content" class="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-[10000] focus:rounded-lg focus:bg-sky-600 focus:px-4 focus:py-2 focus:text-white focus:shadow-lg">
    {{ t('skipToContent') }}
  </a>
  <header class="bg-gradient-to-br from-slate-50 via-white to-sky-50 px-4 pt-10 md:px-8 dark:from-slate-950 dark:via-slate-900 dark:to-sky-950">
    <div class="mx-auto flex max-w-7xl items-start justify-between gap-4">
      <div class="space-y-2">
        <p class="text-sm uppercase tracking-[0.2em] text-sky-600 dark:text-sky-300">{{ t('appName') }}</p>
        <h1 class="text-3xl font-bold text-slate-900 md:text-4xl dark:text-white">{{ t('title') }}</h1>
        <p class="max-w-3xl text-slate-600 dark:text-slate-300">
          {{ t('subtitle') }}
        </p>
      </div>
      <div class="flex shrink-0 items-center gap-2">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>
    </div>
  </header>

  <main id="main-content" class="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50 px-4 pb-10 pt-6 md:px-8 dark:from-slate-950 dark:via-slate-900 dark:to-sky-950">
    <div class="mx-auto max-w-7xl space-y-6">
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
        class="rounded-xl border border-amber-400/60 bg-amber-500/10 p-4 text-sm text-amber-800 dark:border-amber-400/50 dark:text-amber-100"
      >
        {{ t(`deriveMessage.${derivedLoan.message}`) }}
      </div>

      <div
        v-if="hasLoanWarning"
        class="rounded-xl border border-amber-400/60 bg-amber-500/10 p-4 text-sm text-amber-800 dark:border-amber-400/50 dark:text-amber-100"
      >
        {{ t('warning') }}
      </div>

      <SummaryPanel v-if="comparison" :summary="comparison" />

      <footer class="text-xs text-slate-500 dark:text-slate-400">
        {{ t('assumptions') }}
      </footer>
    </div>
  </main>
</template>
