<script setup lang="ts">
import { useId } from 'vue'
import { useI18n } from 'vue-i18n'
import InfoTooltip from './InfoTooltip.vue'
import type { DerivedLoanField, LoanDraftInput, LoanInput, MarketInput } from '../lib/types'

const { t } = useI18n()

defineProps<{
  loanDraft: LoanDraftInput
  resolvedLoan: LoanInput | null
  market: MarketInput
  derivedField: DerivedLoanField
  derivationMessage: string | null
  sp500Source: string
  inflationSource: string
  sp500Fallback: boolean
  inflationFallback: boolean
}>()

const loanPrincipalId = `fld-${useId()}`
const loanRateId = `fld-${useId()}`
const monthlyPaymentId = `fld-${useId()}`
const paymentsLeftId = `fld-${useId()}`
const spareCashId = `fld-${useId()}`
const expectedReturnId = `fld-${useId()}`
const inflationId = `fld-${useId()}`

const toNumberOrNull = (raw: string): number | null => {
  if (raw.trim() === '') {
    return null
  }
  const parsed = Number(raw)
  return Number.isFinite(parsed) ? parsed : null
}

const formatForInput = (value: number | null | undefined, decimals?: number): string => {
  if (value == null || !Number.isFinite(value)) {
    return ''
  }
  if (decimals == null) {
    return String(value)
  }
  return value.toFixed(decimals)
}
</script>

<template>
  <div class="grid gap-6">
    <section class="rounded-2xl border border-sky-400/40 bg-white/80 p-5 shadow-glow backdrop-blur dark:border-sky-400/30 dark:bg-slate-900/60">
      <h2 class="text-lg font-semibold text-sky-700 dark:text-sky-300">{{ t('step1Title') }}</h2>
      <p class="mt-1 text-sm text-slate-600 dark:text-slate-300">{{ t('step1Description') }}</p>

      <div class="mt-5 grid gap-4">
        <div class="grid gap-1">
          <div class="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
            <label :for="loanPrincipalId">{{ t('loanValue') }}</label>
            <InfoTooltip :text="t('tooltipLoanValue')" :label="t('loanValue')" />
          </div>
          <input :id="loanPrincipalId" v-model.number="loanDraft.principal" type="number" inputmode="numeric" min="0" class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
        </div>

        <div class="grid gap-1">
          <div class="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
            <label :for="loanRateId">{{ t('loanInterest') }}</label>
            <InfoTooltip :text="t('tooltipLoanRatePrefill')" :label="t('loanInterest')" />
          </div>
          <input
            :id="loanRateId"
            :value="loanDraft.annualRatePct ?? formatForInput(resolvedLoan?.annualRatePct, 2)"
            type="number"
            inputmode="decimal"
            min="0"
            step="0.01"
            class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            @input="loanDraft.annualRatePct = toNumberOrNull(($event.target as HTMLInputElement).value)"
          />
        </div>

        <div class="grid gap-1">
          <div class="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
            <label :for="monthlyPaymentId">{{ t('monthlyPayment') }}</label>
            <InfoTooltip :text="t('tooltipDerivedPayment')" :label="t('monthlyPayment')" />
          </div>
          <input
            :id="monthlyPaymentId"
            :value="loanDraft.monthlyPayment ?? formatForInput(resolvedLoan?.monthlyPayment, 2)"
            type="number"
            inputmode="decimal"
            min="0"
            step="0.01"
            class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            @input="loanDraft.monthlyPayment = toNumberOrNull(($event.target as HTMLInputElement).value)"
          />
        </div>

        <div class="grid gap-1">
          <div class="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
            <label :for="paymentsLeftId">{{ t('paymentsLeft') }}</label>
            <InfoTooltip :text="t('tooltipDerivedCount')" :label="t('paymentsLeft')" />
          </div>
          <input
            :id="paymentsLeftId"
            :value="loanDraft.paymentsLeft ?? formatForInput(resolvedLoan?.paymentsLeft, 0)"
            type="number"
            inputmode="numeric"
            min="0"
            step="1"
            class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            @input="loanDraft.paymentsLeft = toNumberOrNull(($event.target as HTMLInputElement).value)"
          />
        </div>

        <p class="text-xs text-slate-500 dark:text-slate-400">
          {{ t('derivedFieldHint') }}:
          <span class="font-semibold text-slate-700 dark:text-slate-200">{{ derivedField ? t(`field.${derivedField}`) : t('none') }}</span>
          <span v-if="derivationMessage">- {{ t(`deriveMessage.${derivationMessage}`) }}</span>
        </p>
      </div>
    </section>

    <section class="rounded-2xl border border-indigo-400/40 bg-white/80 p-5 shadow-glow backdrop-blur dark:border-indigo-400/30 dark:bg-slate-900/60">
      <h2 class="text-lg font-semibold text-indigo-700 dark:text-indigo-300">{{ t('step2Title') }}</h2>
      <p class="mt-1 text-sm text-slate-600 dark:text-slate-300">{{ t('step2Description') }}</p>

      <div class="mt-5">
        <div class="grid gap-1">
          <label :for="spareCashId" class="text-sm text-slate-700 dark:text-slate-200">{{ t('spareCash') }}</label>
          <input :id="spareCashId" v-model.number="market.spareCash" type="number" inputmode="numeric" min="0" class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
        </div>
      </div>
    </section>

    <section class="rounded-2xl border border-violet-400/40 bg-white/80 p-5 shadow-glow backdrop-blur dark:border-violet-400/30 dark:bg-slate-900/60">
      <h2 class="text-lg font-semibold text-violet-700 dark:text-violet-300">{{ t('step3Title') }}</h2>
      <p class="mt-1 text-sm text-slate-600 dark:text-slate-300">{{ t('step3Description') }}</p>

      <div class="mt-5 grid gap-4">
        <div class="grid gap-1">
          <div class="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
            <label :for="expectedReturnId">{{ t('expectedReturn') }}</label>
            <InfoTooltip :text="t('tooltipSp500')" :label="t('expectedReturn')" />
          </div>
          <input :id="expectedReturnId" v-model.number="market.annualReturnPct" type="number" inputmode="decimal" min="-50" step="0.01" class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
        </div>

        <div class="grid gap-1">
          <div class="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
            <label :for="inflationId">{{ t('inflationRate') }}</label>
            <InfoTooltip :text="t('tooltipInflation')" :label="t('inflationRate')" />
          </div>
          <input :id="inflationId" v-model.number="market.annualInflationPct" type="number" inputmode="decimal" min="-20" step="0.01" class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
        </div>
      </div>
    </section>
  </div>
</template>
