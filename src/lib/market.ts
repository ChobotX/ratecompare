export interface MarketPrefillResult {
  value: number
  source: string
  usedFallback: boolean
  cachedAt?: number
}

export interface MarketBundle {
  sp500: MarketPrefillResult
  inflation: MarketPrefillResult
  loanRate: MarketPrefillResult
}

const DEFAULT_SP500: MarketPrefillResult = { value: 10.2, source: 'Static fallback', usedFallback: true }
const DEFAULT_INFLATION: MarketPrefillResult = { value: 2, source: 'Static fallback', usedFallback: true }
const DEFAULT_LOAN_RATE: MarketPrefillResult = { value: 8, source: 'Static fallback', usedFallback: true }

const FETCH_TIMEOUT_MS = 8000

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), timeoutMs)
    promise
      .then((value) => {
        clearTimeout(timer)
        resolve(value)
      })
      .catch((error) => {
        clearTimeout(timer)
        reject(error)
      })
  })
}

export async function fetchMarketBundle(): Promise<MarketBundle> {
  try {
    const response = await withTimeout(fetch('/api/market'), FETCH_TIMEOUT_MS)
    if (!response.ok) throw new Error(`http_${response.status}`)
    const data = (await response.json()) as Partial<MarketBundle>
    return {
      sp500: data.sp500 ?? DEFAULT_SP500,
      inflation: data.inflation ?? DEFAULT_INFLATION,
      loanRate: data.loanRate ?? DEFAULT_LOAN_RATE,
    }
  } catch {
    return { sp500: DEFAULT_SP500, inflation: DEFAULT_INFLATION, loanRate: DEFAULT_LOAN_RATE }
  }
}
