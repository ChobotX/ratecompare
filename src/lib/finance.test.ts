import { buildComparison, deriveLoanInput, paymentFromRateAndCount, rateFromPaymentAndCount } from './finance'

describe('deriveLoanInput', () => {
  it('derives monthly payment from rate + count', () => {
    const result = deriveLoanInput({
      principal: 1_000_000,
      annualRatePct: 5,
      monthlyPayment: null,
      paymentsLeft: 240,
    })
    expect(result.isComplete).toBe(true)
    expect(result.derivedField).toBe('monthlyPayment')
    expect(result.loan?.monthlyPayment).toBeGreaterThan(0)
  })

  it('derives rate from payment + count', () => {
    const payment = paymentFromRateAndCount(1_000_000, 4.5, 240)
    const result = deriveLoanInput({
      principal: 1_000_000,
      annualRatePct: null,
      monthlyPayment: payment,
      paymentsLeft: 240,
    })
    expect(result.isComplete).toBe(true)
    expect(result.derivedField).toBe('annualRatePct')
    expect(result.loan?.annualRatePct ?? 0).toBeCloseTo(4.5, 1)
  })
})

describe('rateFromPaymentAndCount', () => {
  it('returns null for impossible payment', () => {
    const rate = rateFromPaymentAndCount(1_000_000, 100, 120)
    expect(rate).toBeNull()
  })
})

describe('buildComparison', () => {
  it('computes real-term winner summary', () => {
    const loan = deriveLoanInput({
      principal: 1_500_000,
      annualRatePct: 5,
      monthlyPayment: 12_000,
      paymentsLeft: null,
    }).loan
    expect(loan).not.toBeNull()

    const summary = buildComparison({
      loan: loan!,
      market: {
        spareCash: 250_000,
        annualReturnPct: 8,
        annualInflationPct: 2.5,
      },
    })

    expect(summary.horizonMonths).toBeGreaterThan(0)
    expect(summary.baselineLoan.totalInterestReal).toBeLessThanOrEqual(summary.baselineLoan.totalInterestNominal)
    expect(summary.paydownGainReal).toBeLessThan(summary.paydownThenInvestGainReal)
    expect(summary.investGainNominal).toBeGreaterThanOrEqual(summary.investGainReal)
    expect(summary.paydownGainNominal).toBeGreaterThanOrEqual(summary.paydownGainReal)
    expect(summary.paydownThenInvestGainNominal).toBeGreaterThanOrEqual(summary.paydownThenInvestGainReal)
    expect(summary.paydownThenInvestPath.endingBalanceReal).toBeGreaterThan(0)
    expect(['invest', 'paydown', 'paydownThenInvest', 'tie']).toContain(summary.winner)

    const expectedLen = summary.horizonMonths + 1
    expect(summary.investSeriesNominal).toHaveLength(expectedLen)
    expect(summary.paydownSeriesNominal).toHaveLength(expectedLen)
    expect(summary.paydownThenInvestSeriesNominal).toHaveLength(expectedLen)
    expect(summary.investSeriesNominal[0]).toBeCloseTo(250_000, 0)
    expect(summary.paydownSeriesNominal[0]).toBe(0)
    expect(summary.paydownThenInvestSeriesNominal[0]).toBe(0)
    expect(summary.investSeriesNominal.at(-1)).toBeCloseTo(summary.investGainNominal, 0)
    expect(summary.paydownSeriesNominal.at(-1)).toBeCloseTo(summary.paydownGainNominal, 0)
    expect(summary.paydownThenInvestSeriesNominal.at(-1)).toBeCloseTo(summary.paydownThenInvestGainNominal, 0)
  })

  it('keeps overflow cash in all scenarios when spare cash exceeds loan', () => {
    const loan = deriveLoanInput({
      principal: 300_000,
      annualRatePct: 5,
      monthlyPayment: 6_000,
      paymentsLeft: null,
    }).loan
    expect(loan).not.toBeNull()

    const summary = buildComparison({
      loan: loan!,
      market: {
        spareCash: 500_000,
        annualReturnPct: 6,
        annualInflationPct: 2,
      },
    })

    expect(summary.investPath.endingBalanceNominal).toBeGreaterThan(500_000)
    expect(summary.paydownThenInvestPath.endingBalanceNominal).toBeGreaterThan(200_000)
    expect(Number.isFinite(summary.paydownGainNominal)).toBe(true)
    expect(summary.paydownThenInvestGainNominal).toBeCloseTo(
      summary.paydownThenInvestPath.endingBalanceNominal,
      2,
    )
  })
})
