import type {
  ComparisonInput,
  ComparisonSummary,
  InvestmentResult,
  LoanDerivationResult,
  LoanDraftInput,
  LoanInput,
  LoanResult,
} from './types'

const MAX_MONTHS = 1200
const MAX_ITERATIONS = 80
const TOLERANCE = 1e-8

const clampMoney = (value: number): number => Math.round((value + Number.EPSILON) * 100) / 100
const sanitizeNumber = (value: number): number => (Number.isFinite(value) ? value : 0)
const monthlyRateFromAnnualPct = (annualRatePct: number): number => sanitizeNumber(annualRatePct) / 100 / 12

export function paymentFromRateAndCount(principal: number, annualRatePct: number, paymentsLeft: number): number {
  const safePrincipal = Math.max(0, sanitizeNumber(principal))
  const n = Math.max(1, Math.floor(sanitizeNumber(paymentsLeft)))
  const monthlyRate = Math.max(0, monthlyRateFromAnnualPct(annualRatePct))
  if (monthlyRate === 0) {
    return safePrincipal / n
  }
  const factor = Math.pow(1 + monthlyRate, n)
  return (safePrincipal * monthlyRate * factor) / (factor - 1)
}

export function countFromRateAndPayment(principal: number, annualRatePct: number, monthlyPayment: number): number | null {
  const safePrincipal = Math.max(0, sanitizeNumber(principal))
  const payment = Math.max(0, sanitizeNumber(monthlyPayment))
  const monthlyRate = Math.max(0, monthlyRateFromAnnualPct(annualRatePct))

  if (safePrincipal === 0) {
    return 0
  }
  if (payment <= 0) {
    return null
  }
  if (monthlyRate === 0) {
    return safePrincipal / payment
  }
  if (payment <= safePrincipal * monthlyRate) {
    return null
  }

  const numerator = Math.log(payment / (payment - safePrincipal * monthlyRate))
  const denominator = Math.log(1 + monthlyRate)
  return numerator / denominator
}

export function rateFromPaymentAndCount(principal: number, monthlyPayment: number, paymentsLeft: number): number | null {
  const safePrincipal = Math.max(0, sanitizeNumber(principal))
  const payment = Math.max(0, sanitizeNumber(monthlyPayment))
  const n = Math.max(1, Math.floor(sanitizeNumber(paymentsLeft)))

  if (safePrincipal === 0) {
    return 0
  }
  if (payment <= 0) {
    return null
  }
  if (payment < safePrincipal / n) {
    return null
  }

  let low = 0
  let high = 1

  const f = (monthlyRate: number): number => {
    if (monthlyRate === 0) {
      return safePrincipal / n - payment
    }
    const factor = Math.pow(1 + monthlyRate, n)
    const computedPayment = (safePrincipal * monthlyRate * factor) / (factor - 1)
    return computedPayment - payment
  }

  if (f(low) > 0) {
    return null
  }

  while (f(high) < 0 && high < 5) {
    high *= 2
  }

  for (let i = 0; i < MAX_ITERATIONS; i += 1) {
    const mid = (low + high) / 2
    const value = f(mid)
    if (Math.abs(value) < TOLERANCE) {
      return mid * 12 * 100
    }
    if (value > 0) {
      high = mid
    } else {
      low = mid
    }
  }

  return ((low + high) / 2) * 12 * 100
}

export function deriveLoanInput(draft: LoanDraftInput): LoanDerivationResult {
  const principal = Math.max(0, sanitizeNumber(draft.principal))
  const rate = draft.annualRatePct != null && Number.isFinite(draft.annualRatePct) ? Math.max(0, draft.annualRatePct) : null
  const payment = draft.monthlyPayment != null && Number.isFinite(draft.monthlyPayment) ? Math.max(0, draft.monthlyPayment) : null
  const count = draft.paymentsLeft != null && Number.isFinite(draft.paymentsLeft) ? Math.max(0, draft.paymentsLeft) : null

  const known = [rate != null, payment != null, count != null].filter(Boolean).length
  if (principal <= 0) {
    return { loan: null, derivedField: null, isComplete: false, message: 'missingPrincipal' }
  }
  if (known < 2) {
    return { loan: null, derivedField: null, isComplete: false, message: 'needTwoOfThree' }
  }

  if (rate != null && payment != null && count != null) {
    return {
      loan: { principal, annualRatePct: rate, monthlyPayment: payment, paymentsLeft: Math.round(count) },
      derivedField: null,
      isComplete: true,
      message: null,
    }
  }

  if (rate != null && count != null) {
    const computedPayment = paymentFromRateAndCount(principal, rate, count)
    return {
      loan: { principal, annualRatePct: rate, monthlyPayment: computedPayment, paymentsLeft: Math.round(count) },
      derivedField: 'monthlyPayment',
      isComplete: true,
      message: null,
    }
  }

  if (rate != null && payment != null) {
    const computedCount = countFromRateAndPayment(principal, rate, payment)
    if (computedCount == null) {
      return { loan: null, derivedField: 'paymentsLeft', isComplete: false, message: 'invalidPaymentForRate' }
    }
    return {
      loan: { principal, annualRatePct: rate, monthlyPayment: payment, paymentsLeft: Math.ceil(computedCount) },
      derivedField: 'paymentsLeft',
      isComplete: true,
      message: null,
    }
  }

  if (payment != null && count != null) {
    const computedRate = rateFromPaymentAndCount(principal, payment, count)
    if (computedRate == null) {
      return { loan: null, derivedField: 'annualRatePct', isComplete: false, message: 'invalidPaymentForCount' }
    }
    return {
      loan: { principal, annualRatePct: computedRate, monthlyPayment: payment, paymentsLeft: Math.round(count) },
      derivedField: 'annualRatePct',
      isComplete: true,
      message: null,
    }
  }

  return { loan: null, derivedField: null, isComplete: false, message: 'needTwoOfThree' }
}

function calculateLoan(loan: LoanInput, annualInflationPct: number, principalOverride?: number): LoanResult {
  const principal = Math.max(0, sanitizeNumber(principalOverride ?? loan.principal))
  const monthlyPayment = Math.max(0, sanitizeNumber(loan.monthlyPayment))
  const monthlyRate = Math.max(0, monthlyRateFromAnnualPct(loan.annualRatePct))
  const monthlyInflation = Math.max(0, monthlyRateFromAnnualPct(annualInflationPct))

  if (principal === 0) {
    return {
      monthsToPayoff: 0,
      totalInterestNominal: 0,
      totalInterestReal: 0,
      remainingPrincipal: 0,
      isNegativeAmortization: false,
    }
  }

  let remainingPrincipal = principal
  let totalInterestNominal = 0
  let totalInterestReal = 0
  let monthsToPayoff = 0
  let isNegativeAmortization = false

  for (let month = 1; month <= MAX_MONTHS && remainingPrincipal > 0; month += 1) {
    const monthInterest = remainingPrincipal * monthlyRate
    const principalPayment = monthlyPayment - monthInterest

    if (principalPayment <= 0) {
      isNegativeAmortization = true
      break
    }

    const discountFactor = Math.pow(1 + monthlyInflation, month)
    totalInterestNominal += monthInterest
    totalInterestReal += monthInterest / discountFactor
    remainingPrincipal = Math.max(0, remainingPrincipal - principalPayment)
    monthsToPayoff = month
  }

  if (!isNegativeAmortization && remainingPrincipal > 0) {
    isNegativeAmortization = true
  }

  return {
    monthsToPayoff,
    totalInterestNominal: clampMoney(totalInterestNominal),
    totalInterestReal: clampMoney(totalInterestReal),
    remainingPrincipal: clampMoney(remainingPrincipal),
    isNegativeAmortization,
  }
}

function calculateInvestment(
  initialInvestment: number,
  annualReturnPct: number,
  annualInflationPct: number,
  horizonMonths: number,
  monthlyContribution = 0,
  contributionStartMonth = 1,
): InvestmentResult {
  const principal = Math.max(0, sanitizeNumber(initialInvestment))
  const monthlyRate = Math.max(0, monthlyRateFromAnnualPct(annualReturnPct))
  const monthlyInflation = Math.max(0, monthlyRateFromAnnualPct(annualInflationPct))
  const totalMonths = Math.max(0, Math.floor(sanitizeNumber(horizonMonths)))
  const contribution = Math.max(0, sanitizeNumber(monthlyContribution))
  const startMonth = Math.max(1, Math.floor(sanitizeNumber(contributionStartMonth)))

  let balance = principal
  for (let month = 1; month <= totalMonths; month += 1) {
    const monthlyAdd = month >= startMonth ? contribution : 0
    balance = (balance + monthlyAdd) * (1 + monthlyRate)
  }

  const endingBalanceNominal = clampMoney(balance)
  const endingBalanceReal = clampMoney(endingBalanceNominal / Math.pow(1 + monthlyInflation, totalMonths))
  return {
    endingBalanceNominal,
    endingBalanceReal,
  }
}

function sumInflationAdjustedCashflow(monthlyAmount: number, annualInflationPct: number, months: number): number {
  const amount = Math.max(0, sanitizeNumber(monthlyAmount))
  const monthlyInflation = Math.max(0, monthlyRateFromAnnualPct(annualInflationPct))
  const horizon = Math.max(0, Math.floor(sanitizeNumber(months)))

  let totalReal = 0
  for (let month = 1; month <= horizon; month += 1) {
    totalReal += amount / Math.pow(1 + monthlyInflation, month)
  }
  return clampMoney(totalReal)
}

function sumNominalCashflow(monthlyAmount: number, months: number): number {
  const amount = Math.max(0, sanitizeNumber(monthlyAmount))
  const horizon = Math.max(0, Math.floor(sanitizeNumber(months)))
  return clampMoney(amount * horizon)
}

export function buildComparison(input: ComparisonInput): ComparisonSummary {
  const spareCash = Math.max(0, sanitizeNumber(input.market.spareCash))
  const payoffAmount = Math.min(spareCash, input.loan.principal)
  const overflowCash = clampMoney(Math.max(0, spareCash - payoffAmount))
  const baselineLoan = calculateLoan(input.loan, input.market.annualInflationPct)
  const horizonMonths = baselineLoan.isNegativeAmortization ? 0 : baselineLoan.monthsToPayoff
  const investPath = calculateInvestment(spareCash, input.market.annualReturnPct, input.market.annualInflationPct, horizonMonths)
  const recastMonthlyPayment = paymentFromRateAndCount(
    Math.max(0, input.loan.principal - payoffAmount),
    input.loan.annualRatePct,
    Math.max(1, input.loan.paymentsLeft),
  )
  const freedMonthlyAmount = clampMoney(Math.max(0, input.loan.monthlyPayment - recastMonthlyPayment))
  const paydownThenInvestPath = calculateInvestment(
    overflowCash,
    input.market.annualReturnPct,
    input.market.annualInflationPct,
    horizonMonths,
    freedMonthlyAmount,
    1,
  )

  const overflowReal = calculateInvestment(overflowCash, 0, input.market.annualInflationPct, horizonMonths).endingBalanceReal
  const paydownGainNominal = clampMoney(sumNominalCashflow(freedMonthlyAmount, horizonMonths) - payoffAmount)
  const paydownGainReal = clampMoney(
    sumInflationAdjustedCashflow(freedMonthlyAmount, input.market.annualInflationPct, horizonMonths) + overflowReal - spareCash,
  )
  const investGainNominal = clampMoney(investPath.endingBalanceNominal - spareCash)
  const investGainReal = clampMoney(investPath.endingBalanceReal - spareCash)
  const paydownThenInvestGainNominal = clampMoney(paydownThenInvestPath.endingBalanceNominal - spareCash)
  const paydownThenInvestGainReal = clampMoney(paydownThenInvestPath.endingBalanceReal - spareCash)

  const candidates: Array<{ key: Exclude<ComparisonSummary['winner'], 'tie'>; value: number }> = [
    { key: 'invest', value: investGainReal },
    { key: 'paydown', value: paydownGainReal },
    { key: 'paydownThenInvest', value: paydownThenInvestGainReal },
  ]
  candidates.sort((a, b) => b.value - a.value)
  const winner = Math.abs(candidates[0].value - candidates[1].value) < 0.01 ? 'tie' : candidates[0].key
  const winnerDeltaReal = clampMoney(Math.abs(candidates[0].value - candidates[1].value))

  return {
    horizonMonths,
    baselineLoan,
    investPath,
    paydownThenInvestPath,
    paydownGainNominal,
    paydownGainReal,
    investGainNominal,
    investGainReal,
    paydownThenInvestGainNominal,
    paydownThenInvestGainReal,
    winner,
    winnerDeltaReal,
  }
}
