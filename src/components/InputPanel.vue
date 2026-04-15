<script setup lang="ts">
import { ref, useId } from 'vue'
import { useI18n } from 'vue-i18n'
import InfoTooltip from './InfoTooltip.vue'
import ResetButton from './ResetButton.vue'
import type { DerivedLoanField, LoanDraftInput, LoanInput, MarketInput } from '../lib/types'
import { defaults, isDefault } from '../lib/defaults'

const { t } = useI18n()

const props = defineProps<{
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

type DerivableKey = 'annualRatePct' | 'monthlyPayment' | 'paymentsLeft'

const draftBuffers = {
  annualRatePct: ref<string | null>(null),
  monthlyPayment: ref<string | null>(null),
  paymentsLeft: ref<string | null>(null),
} as const

const onDerivableInput = (key: DerivableKey, event: Event) => {
  draftBuffers[key].value = (event.target as HTMLInputElement).value
}

const onDerivableBlur = (key: DerivableKey) => {
  const buf = draftBuffers[key].value
  if (buf === null) return
  props.loanDraft[key] = toNumberOrNull(buf)
  draftBuffers[key].value = null
}

const displayValue = (key: DerivableKey, decimals: number): string => {
  const buf = draftBuffers[key].value
  if (buf !== null) return buf
  if (props.loanDraft[key] != null) return String(props.loanDraft[key])
  return formatForInput(props.resolvedLoan?.[key], decimals)
}

const DERIVABLE_KEYS: readonly DerivableKey[] = ['annualRatePct', 'monthlyPayment', 'paymentsLeft']
function resetLoan<K extends keyof LoanDraftInput>(key: K) {
  props.loanDraft[key] = defaults.loanDraft[key]
  if ((DERIVABLE_KEYS as readonly string[]).includes(key as string)) {
    draftBuffers[key as DerivableKey].value = null
  }
}
function resetMarket<K extends keyof MarketInput>(key: K) {
  props.market[key] = defaults.market[key]
}
const loanChanged = (key: keyof LoanDraftInput): boolean => !isDefault(props.loanDraft[key], defaults.loanDraft[key])
const marketChanged = (key: keyof MarketInput): boolean => !isDefault(props.market[key], defaults.market[key])
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
          <div class="relative">
            <input :id="loanPrincipalId" v-model.number="loanDraft.principal" type="number" inputmode="numeric" min="0" class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 pr-10 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
            <ResetButton class="absolute right-2 top-1/2 -translate-y-1/2" :visible="loanChanged('principal')" :label="t('loanValue')" @reset="resetLoan('principal')" />
          </div>
        </div>

        <div class="grid gap-1">
          <div class="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
            <label :for="loanRateId">{{ t('loanInterest') }}</label>
            <InfoTooltip :text="t('tooltipLoanRatePrefill')" :label="t('loanInterest')" />
          </div>
          <div class="relative">
            <input
              :id="loanRateId"
              :value="displayValue('annualRatePct', 2)"
              type="number"
              inputmode="decimal"
              min="0"
              step="0.01"
              class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 pr-10 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              @input="onDerivableInput('annualRatePct', $event)"
              @blur="onDerivableBlur('annualRatePct')"
            />
            <ResetButton class="absolute right-2 top-1/2 -translate-y-1/2" :visible="loanChanged('annualRatePct')" :label="t('loanInterest')" @reset="resetLoan('annualRatePct')" />
          </div>
        </div>

        <div class="grid gap-1">
          <div class="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
            <label :for="monthlyPaymentId">{{ t('monthlyPayment') }}</label>
            <InfoTooltip :text="t('tooltipDerivedPayment')" :label="t('monthlyPayment')" />
          </div>
          <div class="relative">
            <input
              :id="monthlyPaymentId"
              :value="displayValue('monthlyPayment', 2)"
              type="number"
              inputmode="decimal"
              min="0"
              step="0.01"
              class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 pr-10 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              @input="onDerivableInput('monthlyPayment', $event)"
              @blur="onDerivableBlur('monthlyPayment')"
            />
            <ResetButton class="absolute right-2 top-1/2 -translate-y-1/2" :visible="loanChanged('monthlyPayment')" :label="t('monthlyPayment')" @reset="resetLoan('monthlyPayment')" />
          </div>
        </div>

        <div class="grid gap-1">
          <div class="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
            <label :for="paymentsLeftId">{{ t('paymentsLeft') }}</label>
            <InfoTooltip :text="t('tooltipDerivedCount')" :label="t('paymentsLeft')" />
          </div>
          <div class="relative">
            <input
              :id="paymentsLeftId"
              :value="displayValue('paymentsLeft', 0)"
              type="number"
              inputmode="numeric"
              min="0"
              step="1"
              class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 pr-10 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              @input="onDerivableInput('paymentsLeft', $event)"
              @blur="onDerivableBlur('paymentsLeft')"
            />
            <ResetButton class="absolute right-2 top-1/2 -translate-y-1/2" :visible="loanChanged('paymentsLeft')" :label="t('paymentsLeft')" @reset="resetLoan('paymentsLeft')" />
          </div>
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
          <div class="relative">
            <input :id="spareCashId" v-model.number="market.spareCash" type="number" inputmode="numeric" min="0" class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 pr-10 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
            <ResetButton class="absolute right-2 top-1/2 -translate-y-1/2" :visible="marketChanged('spareCash')" :label="t('spareCash')" @reset="resetMarket('spareCash')" />
          </div>
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
          <div class="relative">
            <input :id="expectedReturnId" v-model.number="market.annualReturnPct" type="number" inputmode="decimal" min="-50" step="0.01" class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 pr-10 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
            <ResetButton class="absolute right-2 top-1/2 -translate-y-1/2" :visible="marketChanged('annualReturnPct')" :label="t('expectedReturn')" @reset="resetMarket('annualReturnPct')" />
          </div>
        </div>

        <div class="grid gap-1">
          <div class="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
            <label :for="inflationId">{{ t('inflationRate') }}</label>
            <InfoTooltip :text="t('tooltipInflation')" :label="t('inflationRate')" />
          </div>
          <div class="relative">
            <input :id="inflationId" v-model.number="market.annualInflationPct" type="number" inputmode="decimal" min="-20" step="0.01" class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 pr-10 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
            <ResetButton class="absolute right-2 top-1/2 -translate-y-1/2" :visible="marketChanged('annualInflationPct')" :label="t('inflationRate')" @reset="resetMarket('annualInflationPct')" />
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
