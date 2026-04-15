import { calculateInvestment, paymentFromRateAndCount } from './finance'
import type { TermComparisonSummary, TermLoanInput, TermStrategyResult } from './types'

const clampMoney = (value: number): number => Math.round((value + Number.EPSILON) * 100) / 100
const sanitizeNumber = (value: number): number => (Number.isFinite(value) ? value : 0)
const safePct = (value: number): number => Math.max(0, sanitizeNumber(value))

function amortizationSeries(principal: number, ratePct: number, termMonths: number, horizonMonths: number): number[] {
  const monthlyRate = Math.max(0, safePct(ratePct) / 100 / 12)
  const n = Math.max(1, Math.floor(termMonths))
  const payment = paymentFromRateAndCount(principal, ratePct, n)
  const out: number[] = [clampMoney(principal)]
  let balance = principal
  for (let m = 1; m <= horizonMonths; m += 1) {
    if (m <= n && balance > 0) {
      const interest = balance * monthlyRate
      balance = Math.max(0, balance - (payment - interest))
    } else {
      balance = 0
    }
    out.push(clampMoney(balance))
  }
  return out
}

function buildStrategy(params: {
  principal: number
  ratePct: number
  termMonths: number
  monthlyBudget: number
  annualReturnPct: number
  annualInflationPct: number
  horizonMonths: number
}): TermStrategyResult {
  const { principal, ratePct, termMonths, monthlyBudget, annualReturnPct, annualInflationPct, horizonMonths } = params
  const payment = clampMoney(paymentFromRateAndCount(principal, ratePct, Math.max(1, Math.floor(termMonths))))
  const phase1Contribution = Math.max(0, monthlyBudget - payment)
  const phase1Months = Math.min(termMonths, horizonMonths)
  const phase2Months = Math.max(0, horizonMonths - phase1Months)

  const phase1 = calculateInvestment(0, annualReturnPct, annualInflationPct, phase1Months, phase1Contribution, 1)
  const phase2 = calculateInvestment(
    phase1.endingBalanceNominal,
    annualReturnPct,
    annualInflationPct,
    phase2Months,
    monthlyBudget,
    1,
  )

  const series = phase1.monthlyBalancesNominal.slice()
  for (let i = 1; i < phase2.monthlyBalancesNominal.length; i += 1) {
    series.push(phase2.monthlyBalancesNominal[i])
  }

  const monthlyInflation = safePct(annualInflationPct) / 100 / 12
  const deflator = Math.pow(1 + monthlyInflation, horizonMonths)
  const endingNominal = clampMoney(phase2Months > 0 ? phase2.endingBalanceNominal : phase1.endingBalanceNominal)
  const endingReal = clampMoney(endingNominal / deflator)

  const loanSeriesNominal = amortizationSeries(principal, ratePct, termMonths, horizonMonths)

  return {
    monthlyPayment: payment,
    monthlyInvestPhase1: clampMoney(phase1Contribution),
    monthlyInvestPhase2: phase2Months > 0 ? clampMoney(monthlyBudget) : 0,
    seriesNominal: series,
    loanSeriesNominal,
    endingBalanceNominal: endingNominal,
    endingBalanceReal: endingReal,
  }
}

export function buildTermComparison(input: TermLoanInput): TermComparisonSummary {
  const principal = Math.max(0, sanitizeNumber(input.principal))
  const monthlyBudget = Math.max(0, sanitizeNumber(input.monthlyBudget))
  const longTerm = Math.max(1, Math.floor(sanitizeNumber(input.longTermMonths)))
  const shortTerm = Math.max(1, Math.floor(sanitizeNumber(input.shortTermMonths)))
  const horizonMonths = Math.max(longTerm, shortTerm)

  const longStrategy = buildStrategy({
    principal,
    ratePct: safePct(input.longRatePct),
    termMonths: longTerm,
    monthlyBudget,
    annualReturnPct: safePct(input.annualReturnPct),
    annualInflationPct: safePct(input.annualInflationPct),
    horizonMonths,
  })

  const shortStrategy = buildStrategy({
    principal,
    ratePct: safePct(input.shortRatePct),
    termMonths: shortTerm,
    monthlyBudget,
    annualReturnPct: safePct(input.annualReturnPct),
    annualInflationPct: safePct(input.annualInflationPct),
    horizonMonths,
  })

  const budgetTooLow = monthlyBudget < Math.max(longStrategy.monthlyPayment, shortStrategy.monthlyPayment)
  const shortTermExceedsLong = shortTerm >= longTerm

  const diff = longStrategy.endingBalanceReal - shortStrategy.endingBalanceReal
  const winner: TermComparisonSummary['winner'] = Math.abs(diff) < 0.01 ? 'tie' : diff > 0 ? 'long' : 'short'
  const winnerDeltaReal = clampMoney(Math.abs(diff))

  return {
    horizonMonths,
    longPayment: longStrategy.monthlyPayment,
    shortPayment: shortStrategy.monthlyPayment,
    longStrategy,
    shortStrategy,
    winner,
    winnerDeltaReal,
    budgetTooLow,
    shortTermExceedsLong,
  }
}
