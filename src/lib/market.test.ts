import {
  computeCagrFromSeries,
  computeMonthlyAverage,
  computeTenYearAverageIndicator,
  computeTenYearAverageInflation,
  extractEcbObservationValues,
  parseSp500GithubCsvToPoints,
  parseStooqCsvToPoints,
  selectLastYears,
} from './market'

describe('computeCagrFromSeries', () => {
  it('computes cagr from valid points', () => {
    const result = computeCagrFromSeries([
      { timestampSec: 0, close: 100 },
      { timestampSec: 31557600 * 10, close: 200 },
    ])
    expect(result).not.toBeNull()
    expect(result ?? 0).toBeGreaterThan(7)
    expect(result ?? 0).toBeLessThan(8)
  })
})

describe('computeTenYearAverageInflation', () => {
  it('averages latest ten entries', () => {
    const values = Array.from({ length: 12 }).map((_, idx) => ({
      year: `${2024 - idx}`,
      value: 2 + idx * 0.1,
    }))
    const result = computeTenYearAverageInflation(values)
    expect(result).not.toBeNull()
    expect(result ?? 0).toBeGreaterThan(2)
  })
})

describe('computeTenYearAverageIndicator', () => {
  it('works for generic yearly indicators', () => {
    const values = [
      { year: '2024', value: 5 },
      { year: '2023', value: 4.5 },
      { year: '2022', value: 4.2 },
      { year: '2021', value: 4.0 },
      { year: '2020', value: 3.8 },
      { year: '2019', value: 3.7 },
      { year: '2018', value: 3.9 },
      { year: '2017', value: 4.1 },
      { year: '2016', value: 4.0 },
      { year: '2015', value: 4.2 },
    ]
    const result = computeTenYearAverageIndicator(values)
    expect(result).not.toBeNull()
    expect(result ?? 0).toBeGreaterThan(3.5)
  })
})

describe('extractEcbObservationValues', () => {
  it('extracts and sorts observation values from ECB jsondata shape', () => {
    const values = extractEcbObservationValues({
      dataSets: [
        {
          series: {
            '0:0:0': {
              observations: {
                '2': [3.5],
                '0': [2.5],
                '1': [3.0],
              },
            },
          },
        },
      ],
    })
    expect(values).toEqual([2.5, 3, 3.5])
  })
})

describe('computeMonthlyAverage', () => {
  it('averages latest N monthly values', () => {
    const values = Array.from({ length: 130 }).map((_, idx) => 1 + idx * 0.01)
    const avg = computeMonthlyAverage(values, 120)
    expect(avg).not.toBeNull()
    expect(avg ?? 0).toBeGreaterThan(1.5)
  })
})

describe('parseStooqCsvToPoints', () => {
  it('parses monthly csv format', () => {
    const csv = `Date,Open,High,Low,Close,Volume
2024-01-31,100,110,90,105,0
2024-02-29,105,120,100,115,0`
    const points = parseStooqCsvToPoints(csv)
    expect(points).toHaveLength(2)
    expect(points[0].close).toBe(105)
    expect(points[1].close).toBe(115)
    expect(points[0].timestampSec).toBeGreaterThan(0)
  })
})

describe('parseSp500GithubCsvToPoints', () => {
  it('parses date,close csv format', () => {
    const csv = `Date,SP500
2024-01-31,4850.0
2024-02-29,5096.2`
    const points = parseSp500GithubCsvToPoints(csv)
    expect(points).toHaveLength(2)
    expect(points[0].close).toBe(4850)
    expect(points[1].close).toBeCloseTo(5096.2, 2)
  })
})

describe('selectLastYears', () => {
  it('keeps only recent window for CAGR input', () => {
    const points = [
      { timestampSec: 0, close: 100 },
      { timestampSec: 31557600 * 5, close: 120 },
      { timestampSec: 31557600 * 10, close: 150 },
      { timestampSec: 31557600 * 15, close: 220 },
    ]
    const last10 = selectLastYears(points, 10)
    expect(last10).toHaveLength(3)
    expect(last10[0].timestampSec).toBe(31557600 * 5)
    expect(last10[last10.length - 1].timestampSec).toBe(31557600 * 15)
  })
})
