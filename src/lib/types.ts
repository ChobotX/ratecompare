export interface LoanInput {
  principal: number
  annualRatePct: number
  monthlyPayment: number
  paymentsLeft: number
}

export type DerivedLoanField = 'annualRatePct' | 'monthlyPayment' | 'paymentsLeft' | null

export interface LoanDraftInput {
  principal: number
  annualRatePct: number | null
  monthlyPayment: number | null
  paymentsLeft: number | null
}

export interface LoanDerivationResult {
  loan: LoanInput | null
  derivedField: DerivedLoanField
  isComplete: boolean
  message: string | null
}

export interface MarketInput {
  spareCash: number
  annualReturnPct: number
  annualInflationPct: number
}

export interface LoanResult {
  monthsToPayoff: number
  totalInterestNominal: number
  totalInterestReal: number
  remainingPrincipal: number
  isNegativeAmortization: boolean
}

export interface InvestmentResult {
  endingBalanceNominal: number
  endingBalanceReal: number
}

export interface ComparisonInput {
  loan: LoanInput
  market: MarketInput
}

export interface ComparisonSummary {
  horizonMonths: number
  baselineLoan: LoanResult
  investPath: InvestmentResult
  paydownThenInvestPath: InvestmentResult
  paydownGainNominal: number
  paydownGainReal: number
  investGainNominal: number
  investGainReal: number
  paydownThenInvestGainNominal: number
  paydownThenInvestGainReal: number
  winner: 'invest' | 'paydown' | 'paydownThenInvest' | 'tie'
  winnerDeltaReal: number
}
