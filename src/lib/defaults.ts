import { reactive } from 'vue'
import type { LoanDraftInput, MarketInput, TermLoanInput } from './types'

export const defaults = reactive({
  loanDraft: {
    principal: 2_250_000,
    annualRatePct: 5.2,
    monthlyPayment: null,
    paymentsLeft: 276,
  } as LoanDraftInput,
  market: {
    spareCash: 200_000,
    annualReturnPct: 8,
    annualInflationPct: 2.2,
  } as MarketInput,
  term: {
    principal: 3_000_000,
    monthlyBudget: 30_000,
    longRatePct: 5.2,
    longTermMonths: 360,
    shortRatePct: 5.2,
    shortTermMonths: 180,
    annualReturnPct: 8,
    annualInflationPct: 2.2,
  } as TermLoanInput,
})

const EPSILON = 1e-6

export function isDefault(current: unknown, def: unknown): boolean {
  if (current === def) return true
  if (current == null && def == null) return true
  if (typeof current === 'number' && typeof def === 'number') {
    return Math.abs(current - def) < EPSILON
  }
  return false
}
