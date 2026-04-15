<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { buildLocalePath, defaultLocale, parseLocalePath, type AppTab, type SupportedLocale } from './i18n'
import InputPanel from './components/InputPanel.vue'
import SummaryPanel from './components/SummaryPanel.vue'
import TermInputPanel from './components/TermInputPanel.vue'
import TermSummaryPanel from './components/TermSummaryPanel.vue'
import ThemeToggle from './components/ThemeToggle.vue'
import LanguageSwitcher from './components/LanguageSwitcher.vue'
import { buildComparison, deriveLoanInput } from './lib/finance'
import { buildTermComparison } from './lib/termFinance'
import { fetchMarketBundle } from './lib/market'
import type { LoanDraftInput, MarketInput, LoanInput, TermLoanInput } from './lib/types'

const { t, locale } = useI18n()

const STORAGE_KEY = 'ratecompare:inputs:v2'
const LEGACY_KEY = 'ratecompare:inputs:v1'

type ActiveTab = AppTab

type Persisted = {
  activeTab?: ActiveTab
  loanDraft: LoanDraftInput
  market: MarketInput
  term?: TermLoanInput
}

function loadPersisted(): Persisted | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_KEY)
    return raw ? (JSON.parse(raw) as Persisted) : null
  } catch {
    return null
  }
}

const persisted = loadPersisted()

const initialRoute = parseLocalePath(window.location.pathname)
const activeTab = ref<ActiveTab>(initialRoute.tab)

const loanDraft = reactive<LoanDraftInput>(persisted?.loanDraft ?? {
  principal: 2_250_000,
  annualRatePct: 5.2,
  monthlyPayment: null,
  paymentsLeft: 276,
})

const market = reactive<MarketInput>(persisted?.market ?? {
  spareCash: 200_000,
  annualReturnPct: 8,
  annualInflationPct: 2.2,
})

const term = reactive<TermLoanInput>(persisted?.term ?? {
  principal: 3_000_000,
  monthlyBudget: 30_000,
  longRatePct: 5.2,
  longTermMonths: 360,
  shortRatePct: 5.2,
  shortTermMonths: 180,
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

const termSummary = computed(() => buildTermComparison(term))

watch([loanDraft, market, term, activeTab], () => {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ activeTab: activeTab.value, loanDraft, market, term } satisfies Persisted),
    )
  } catch {
    // quota/disabled — ignore
  }
}, { deep: true })

const tabListRef = ref<HTMLDivElement | null>(null)

function syncUrl(next: ActiveTab, method: 'push' | 'replace' = 'push') {
  const target = buildLocalePath((locale.value as SupportedLocale) ?? defaultLocale, next) + window.location.search + window.location.hash
  if (window.location.pathname + window.location.search + window.location.hash === target) return
  if (method === 'replace') window.history.replaceState({ tab: next }, '', target)
  else window.history.pushState({ tab: next }, '', target)
}

function selectTab(next: ActiveTab, focus = false) {
  if (activeTab.value !== next) {
    activeTab.value = next
    syncUrl(next, 'push')
  }
  if (focus) {
    nextTick(() => {
      const el = tabListRef.value?.querySelector<HTMLButtonElement>(`[data-tab-id="${next}"]`)
      el?.focus()
    })
  }
}

function onPopState() {
  const { tab } = parseLocalePath(window.location.pathname)
  activeTab.value = tab
}

function onTabKeydown(e: KeyboardEvent) {
  const order: ActiveTab[] = ['payoff', 'term']
  const idx = order.indexOf(activeTab.value)
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
    e.preventDefault()
    selectTab(order[(idx + 1) % order.length], true)
  } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
    e.preventDefault()
    selectTab(order[(idx - 1 + order.length) % order.length], true)
  } else if (e.key === 'Home') {
    e.preventDefault()
    selectTab(order[0], true)
  } else if (e.key === 'End') {
    e.preventDefault()
    selectTab(order[order.length - 1], true)
  }
}

const pageTitle = computed(() => {
  const base = t('title')
  return activeTab.value === 'term' ? `${t('tabs.term')} — ${base}` : base
})

watch(pageTitle, (v) => {
  document.title = v
}, { immediate: true })

onMounted(async () => {
  syncUrl(activeTab.value, 'replace')
  window.addEventListener('popstate', onPopState)
  const { sp500, inflation, loanRate } = await fetchMarketBundle()
  if (!persisted) {
    loanDraft.annualRatePct = loanRate.value
    market.annualReturnPct = sp500.value
    market.annualInflationPct = inflation.value
    term.annualReturnPct = sp500.value
    term.annualInflationPct = inflation.value
    term.longRatePct = loanRate.value
    term.shortRatePct = loanRate.value
  }
  rateMeta.sp500Source = sp500.source
  rateMeta.inflationSource = inflation.source
  rateMeta.sp500Fallback = sp500.usedFallback
  rateMeta.inflationFallback = inflation.usedFallback
})

onBeforeUnmount(() => {
  window.removeEventListener('popstate', onPopState)
})
</script>

<template>
  <a href="#main-content" class="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-[10000] focus:rounded-lg focus:bg-sky-600 focus:px-4 focus:py-2 focus:text-white focus:shadow-lg">
    {{ t('skipToContent') }}
  </a>
  <header class="bg-gradient-to-br from-slate-50 via-white to-sky-50 px-4 pt-10 md:px-8 dark:from-slate-950 dark:via-slate-900 dark:to-sky-950">
    <div class="mx-auto max-w-7xl space-y-2">
      <div class="flex items-center justify-between gap-4">
        <p class="text-sm uppercase tracking-[0.2em] text-sky-600 dark:text-sky-300">{{ t('appName') }}</p>
        <div class="flex shrink-0 items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </div>
      <h1 class="text-3xl font-bold text-slate-900 md:text-4xl dark:text-white">{{ t('title') }}</h1>
      <p class="max-w-3xl text-slate-600 dark:text-slate-300">{{ t('subtitle') }}</p>
    </div>
  </header>

  <main id="main-content" class="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50 px-4 pb-10 pt-6 md:px-8 dark:from-slate-950 dark:via-slate-900 dark:to-sky-950">
    <div class="mx-auto max-w-7xl space-y-6">
      <div
        ref="tabListRef"
        role="tablist"
        :aria-label="t('tabs.ariaLabel')"
        class="flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-white/70 p-1 backdrop-blur dark:border-slate-700 dark:bg-slate-900/60"
        @keydown="onTabKeydown"
      >
        <button
          v-for="tab in (['payoff', 'term'] as const)"
          :key="tab"
          role="tab"
          :id="`tab-${tab}`"
          :data-tab-id="tab"
          :aria-selected="activeTab === tab"
          :aria-controls="`panel-${tab}`"
          :tabindex="activeTab === tab ? 0 : -1"
          class="flex-1 rounded-lg px-4 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
          :class="activeTab === tab
            ? 'bg-sky-600 text-white shadow'
            : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'"
          @click="selectTab(tab)"
        >
          {{ t(`tabs.${tab}`) }}
        </button>
      </div>

      <section
        v-show="activeTab === 'payoff'"
        id="panel-payoff"
        role="tabpanel"
        aria-labelledby="tab-payoff"
        tabindex="0"
        class="space-y-6 focus-visible:outline-none"
      >
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
          role="alert"
          class="rounded-xl border border-amber-400/60 bg-amber-500/10 p-4 text-sm text-amber-800 dark:border-amber-400/50 dark:text-amber-100"
        >
          {{ t(`deriveMessage.${derivedLoan.message}`) }}
        </div>

        <div
          v-if="hasLoanWarning"
          role="alert"
          class="rounded-xl border border-amber-400/60 bg-amber-500/10 p-4 text-sm text-amber-800 dark:border-amber-400/50 dark:text-amber-100"
        >
          {{ t('warning') }}
        </div>

        <SummaryPanel v-if="comparison" :summary="comparison" />
      </section>

      <section
        v-show="activeTab === 'term'"
        id="panel-term"
        role="tabpanel"
        aria-labelledby="tab-term"
        tabindex="0"
        class="space-y-6 focus-visible:outline-none"
      >
        <TermInputPanel
          :input="term"
          :long-payment="termSummary.longPayment"
          :short-payment="termSummary.shortPayment"
        />

        <div
          v-if="termSummary.budgetTooLow"
          role="alert"
          class="rounded-xl border border-amber-400/60 bg-amber-500/10 p-4 text-sm text-amber-800 dark:border-amber-400/50 dark:text-amber-100"
        >
          {{ t('termWarningBudget') }}
        </div>

        <div
          v-if="termSummary.shortTermExceedsLong"
          role="alert"
          class="rounded-xl border border-amber-400/60 bg-amber-500/10 p-4 text-sm text-amber-800 dark:border-amber-400/50 dark:text-amber-100"
        >
          {{ t('termWarningTerms') }}
        </div>

        <TermSummaryPanel :summary="termSummary" />
      </section>

      <footer class="text-xs text-slate-500 dark:text-slate-400">
        {{ t('assumptions') }}
      </footer>
    </div>
  </main>
</template>
