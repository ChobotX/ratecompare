const DEFAULT_SP500_RATE = 10.2
const DEFAULT_EU_INFLATION = 2
const DEFAULT_EU_LOAN_RATE = 5
const CZECH_LOAN_PREMIUM_PCT = 3
const FETCH_TIMEOUT_MS = 6000

export interface MarketPrefillResult {
  value: number
  source: string
  usedFallback: boolean
}

interface EcbJsonDataResponse {
  dataSets?: Array<{
    series?: Record<string, { observations?: Record<string, Array<number | null>> }>
  }>
}

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

function roundTo2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

export function parseStooqCsvToPoints(csv: string): Array<{ timestampSec: number; close: number }> {
  const lines = csv.trim().split('\n')
  if (lines.length < 2) {
    return []
  }

  return lines
    .slice(1)
    .map((line) => line.split(','))
    .map((parts) => {
      const date = parts[0]
      const close = Number(parts[4])
      const timestampSec = Math.floor(new Date(`${date}T00:00:00Z`).getTime() / 1000)
      return { timestampSec, close }
    })
    .filter((p) => Number.isFinite(p.timestampSec) && Number.isFinite(p.close) && p.close > 0)
}

export function parseSp500GithubCsvToPoints(csv: string): Array<{ timestampSec: number; close: number }> {
  const lines = csv.trim().split('\n')
  if (lines.length < 2) {
    return []
  }

  return lines
    .slice(1)
    .map((line) => line.split(','))
    .map((parts) => {
      const date = parts[0]
      const close = Number(parts[1])
      const timestampSec = Math.floor(new Date(`${date}T00:00:00Z`).getTime() / 1000)
      return { timestampSec, close }
    })
    .filter((p) => Number.isFinite(p.timestampSec) && Number.isFinite(p.close) && p.close > 0)
}

export function computeCagrFromSeries(points: Array<{ timestampSec: number; close: number }>): number | null {
  const valid = points.filter((p) => Number.isFinite(p.close) && p.close > 0).sort((a, b) => a.timestampSec - b.timestampSec)
  if (valid.length < 2) {
    return null
  }

  const first = valid[0]
  const last = valid[valid.length - 1]
  const years = (last.timestampSec - first.timestampSec) / (365.25 * 24 * 3600)
  if (years <= 0) {
    return null
  }
  const cagr = (Math.pow(last.close / first.close, 1 / years) - 1) * 100
  return Number.isFinite(cagr) ? roundTo2(cagr) : null
}

export function selectLastYears(points: Array<{ timestampSec: number; close: number }>, years: number): Array<{ timestampSec: number; close: number }> {
  const valid = points
    .filter((p) => Number.isFinite(p.timestampSec) && Number.isFinite(p.close) && p.close > 0)
    .sort((a, b) => a.timestampSec - b.timestampSec)
  if (valid.length < 2) {
    return valid
  }

  const lastTs = valid[valid.length - 1].timestampSec
  const cutoff = lastTs - years * 365.25 * 24 * 3600
  const sliced = valid.filter((p) => p.timestampSec >= cutoff)
  return sliced.length >= 2 ? sliced : valid
}

export async function fetchSp500TenYearAverageReturn(): Promise<MarketPrefillResult> {
  try {
    const csvUrl = 'https://raw.githubusercontent.com/datasets/s-and-p-500/master/data/data.csv'
    const response = await withTimeout(fetch(csvUrl), FETCH_TIMEOUT_MS)
    if (!response.ok) {
      throw new Error(`http_${response.status}`)
    }
    const csv = await response.text()
    const points = selectLastYears(parseSp500GithubCsvToPoints(csv), 10)

    const computed = computeCagrFromSeries(points)
    if (computed == null) {
      throw new Error('invalid_series')
    }

    return {
      value: computed,
      source: 'GitHub datasets/s-and-p-500 historical close',
      usedFallback: false,
    }
  } catch {
    return {
      value: DEFAULT_SP500_RATE,
      source: 'Static fallback',
      usedFallback: true,
    }
  }
}

export function computeTenYearAverageIndicator(values: Array<{ year: string; value: number | null }>): number | null {
  const sorted = values
    .filter((entry) => entry.value != null && Number.isFinite(entry.value))
    .sort((a, b) => Number(b.year) - Number(a.year))
    .slice(0, 10)
  if (sorted.length < 5) {
    return null
  }
  const avg = sorted.reduce((sum, entry) => sum + (entry.value ?? 0), 0) / sorted.length
  return roundTo2(avg)
}

export const computeTenYearAverageInflation = computeTenYearAverageIndicator

export function extractEcbObservationValues(data: EcbJsonDataResponse): number[] {
  const seriesMap = data?.dataSets?.[0]?.series
  if (!seriesMap) {
    return []
  }
  const firstSeries = Object.values(seriesMap)[0]
  const observations = firstSeries?.observations
  if (!observations) {
    return []
  }

  return Object.entries(observations)
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([, values]) => values?.[0])
    .filter((value): value is number => Number.isFinite(value))
}

export function computeMonthlyAverage(values: number[], months = 120): number | null {
  const usable = values.slice(-months)
  if (usable.length < Math.min(24, Math.floor(months / 2))) {
    return null
  }
  const avg = usable.reduce((sum, value) => sum + value, 0) / usable.length
  return roundTo2(avg)
}

export async function fetchEuTenYearAverageInflation(): Promise<MarketPrefillResult> {
  const url = 'https://data-api.ecb.europa.eu/service/data/ICP/M.U2.N.000000.4.ANR?lastNObservations=120&format=jsondata'
  try {
    const response = await withTimeout(fetch(url), FETCH_TIMEOUT_MS)
    if (!response.ok) {
      throw new Error(`http_${response.status}`)
    }
    const data = (await response.json()) as EcbJsonDataResponse
    const values = extractEcbObservationValues(data)
    const computed = computeMonthlyAverage(values, 120)
    if (computed == null) {
      throw new Error('invalid_series')
    }

    return {
      value: computed,
      source: 'ECB ICP M.U2.N.000000.4.ANR 10y avg',
      usedFallback: false,
    }
  } catch {
    return {
      value: DEFAULT_EU_INFLATION,
      source: 'Static fallback',
      usedFallback: true,
    }
  }
}

export async function fetchEuTenYearAverageLoanRate(): Promise<MarketPrefillResult> {
  const url = 'https://data-api.ecb.europa.eu/service/data/MIR/M.U2.B.A2CC.F.R.A.2250.EUR.N?lastNObservations=120&format=jsondata'
  try {
    const response = await withTimeout(fetch(url), FETCH_TIMEOUT_MS)
    if (!response.ok) {
      throw new Error(`http_${response.status}`)
    }
    const data = (await response.json()) as EcbJsonDataResponse
    const values = extractEcbObservationValues(data)
    const computed = computeMonthlyAverage(values, 120)
    if (computed == null) {
      throw new Error('invalid_series')
    }
    const adjusted = roundTo2(computed + CZECH_LOAN_PREMIUM_PCT)
    return {
      value: adjusted,
      source: 'ECB MIR 10y avg + 3.0 p.p. CZ premium',
      usedFallback: false,
    }
  } catch {
    return {
      value: roundTo2(DEFAULT_EU_LOAN_RATE + CZECH_LOAN_PREMIUM_PCT),
      source: 'Static fallback',
      usedFallback: true,
    }
  }
}
