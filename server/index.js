import http from 'node:http'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const PORT = Number(process.env.PORT || 80)
const DATA_DIR = process.env.DATA_DIR || '/data'
const CACHE_FILE = path.join(DATA_DIR, 'market.json')
const TTL_MS = 30 * 24 * 60 * 60 * 1000
const FETCH_TIMEOUT_MS = 8000
const STATIC_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist')

const DEFAULTS = {
  sp500: { value: 10.2, source: 'Static fallback', usedFallback: true },
  inflation: { value: 2, source: 'Static fallback', usedFallback: true },
  loanRate: { value: 8, source: 'Static fallback', usedFallback: true },
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
}

function roundTo2(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout')), ms)
    promise.then((v) => { clearTimeout(t); resolve(v) }).catch((e) => { clearTimeout(t); reject(e) })
  })
}

function parseSp500Csv(csv) {
  const lines = csv.trim().split('\n')
  if (lines.length < 2) return []
  return lines.slice(1).map((line) => {
    const [date, close] = line.split(',')
    return {
      timestampSec: Math.floor(new Date(`${date}T00:00:00Z`).getTime() / 1000),
      close: Number(close),
    }
  }).filter((p) => Number.isFinite(p.timestampSec) && Number.isFinite(p.close) && p.close > 0)
}

function selectLastYears(points, years) {
  const sorted = [...points].sort((a, b) => a.timestampSec - b.timestampSec)
  if (sorted.length < 2) return sorted
  const lastTs = sorted[sorted.length - 1].timestampSec
  const cutoff = lastTs - years * 365.25 * 24 * 3600
  const sliced = sorted.filter((p) => p.timestampSec >= cutoff)
  return sliced.length >= 2 ? sliced : sorted
}

function computeCagr(points) {
  if (points.length < 2) return null
  const first = points[0]
  const last = points[points.length - 1]
  const years = (last.timestampSec - first.timestampSec) / (365.25 * 24 * 3600)
  if (years <= 0) return null
  const cagr = (Math.pow(last.close / first.close, 1 / years) - 1) * 100
  return Number.isFinite(cagr) ? roundTo2(cagr) : null
}

function extractEcbValues(data) {
  const series = data?.dataSets?.[0]?.series
  if (!series) return []
  const first = Object.values(series)[0]
  const obs = first?.observations
  if (!obs) return []
  return Object.entries(obs)
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([, v]) => v?.[0])
    .filter((v) => Number.isFinite(v))
}

function monthlyAverage(values, months = 120) {
  const usable = values.slice(-months)
  if (usable.length < Math.min(24, Math.floor(months / 2))) return null
  return roundTo2(usable.reduce((s, v) => s + v, 0) / usable.length)
}

async function fetchSp500() {
  const response = await withTimeout(fetch('https://raw.githubusercontent.com/datasets/s-and-p-500/master/data/data.csv'), FETCH_TIMEOUT_MS)
  if (!response.ok) throw new Error(`http_${response.status}`)
  const csv = await response.text()
  const value = computeCagr(selectLastYears(parseSp500Csv(csv), 10))
  if (value == null) throw new Error('invalid_series')
  return { value, source: 'GitHub datasets/s-and-p-500 historical close' }
}

async function fetchEcb(url, months) {
  const response = await withTimeout(fetch(url), FETCH_TIMEOUT_MS)
  if (!response.ok) throw new Error(`http_${response.status}`)
  const data = await response.json()
  const value = monthlyAverage(extractEcbValues(data), months)
  if (value == null) throw new Error('invalid_series')
  return value
}

async function fetchInflation() {
  const value = await fetchEcb('https://data-api.ecb.europa.eu/service/data/ICP/M.U2.N.000000.4.ANR?lastNObservations=120&format=jsondata', 120)
  return { value, source: 'ECB ICP M.U2.N.000000.4.ANR 10y avg' }
}

async function fetchLoanRate() {
  const value = await fetchEcb('https://data-api.ecb.europa.eu/service/data/MIR/M.U2.B.A2CC.F.R.A.2250.EUR.N?lastNObservations=12&format=jsondata', 12)
  return { value, source: 'ECB MIR 1y avg' }
}

async function readCacheFile() {
  try {
    const raw = await fs.readFile(CACHE_FILE, 'utf8')
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

async function writeCacheFile(cache) {
  await fs.mkdir(DATA_DIR, { recursive: true }).catch(() => {})
  const tmp = `${CACHE_FILE}.tmp`
  await fs.writeFile(tmp, JSON.stringify(cache, null, 2))
  await fs.rename(tmp, CACHE_FILE)
}

const inFlight = new Map()

async function refreshKey(key, producer, cache) {
  if (inFlight.has(key)) return inFlight.get(key)
  const task = (async () => {
    try {
      const fresh = await producer()
      cache[key] = { ...fresh, storedAt: Date.now() }
      await writeCacheFile(cache)
      return { ...cache[key], usedFallback: false, cachedAt: cache[key].storedAt }
    } finally {
      inFlight.delete(key)
    }
  })()
  inFlight.set(key, task)
  return task
}

async function resolveKey(key, producer, cache) {
  const entry = cache[key]
  const now = Date.now()
  if (entry && now - entry.storedAt < TTL_MS) {
    return { value: entry.value, source: entry.source, usedFallback: false, cachedAt: entry.storedAt }
  }
  try {
    return await refreshKey(key, producer, cache)
  } catch {
    if (entry) {
      return { value: entry.value, source: `${entry.source} (stale)`, usedFallback: false, cachedAt: entry.storedAt }
    }
    return DEFAULTS[key]
  }
}

async function getMarketBundle() {
  const cache = await readCacheFile()
  const [sp500, inflation, loanRate] = await Promise.all([
    resolveKey('sp500', fetchSp500, cache),
    resolveKey('inflation', fetchInflation, cache),
    resolveKey('loanRate', fetchLoanRate, cache),
  ])
  return { sp500, inflation, loanRate }
}

function send(res, status, headers, body) {
  res.writeHead(status, headers)
  res.end(body)
}

async function serveStatic(req, res) {
  const urlPath = decodeURIComponent((req.url || '/').split('?')[0])
  const safe = path.normalize(urlPath).replace(/^(\.\.[\/\\])+/, '')
  let filePath = path.join(STATIC_ROOT, safe === '/' ? 'index.html' : safe)
  if (!filePath.startsWith(STATIC_ROOT)) {
    return send(res, 403, { 'content-type': 'text/plain' }, 'forbidden')
  }

  try {
    const stat = await fs.stat(filePath)
    if (stat.isDirectory()) filePath = path.join(filePath, 'index.html')
  } catch {
    filePath = path.join(STATIC_ROOT, 'index.html')
  }

  try {
    const body = await fs.readFile(filePath)
    const ext = path.extname(filePath).toLowerCase()
    const headers = { 'content-type': MIME[ext] || 'application/octet-stream' }
    if (filePath.includes(`${path.sep}assets${path.sep}`)) {
      headers['cache-control'] = 'public, max-age=31536000, immutable'
    } else {
      headers['cache-control'] = 'no-cache'
    }
    send(res, 200, headers, body)
  } catch {
    send(res, 404, { 'content-type': 'text/plain' }, 'not found')
  }
}

const server = http.createServer(async (req, res) => {
  try {
    const url = (req.url || '/').split('?')[0]
    if (url === '/api/market' && req.method === 'GET') {
      const bundle = await getMarketBundle()
      return send(res, 200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-cache' }, JSON.stringify(bundle))
    }
    if (url === '/healthz') {
      return send(res, 200, { 'content-type': 'text/plain' }, 'ok')
    }
    await serveStatic(req, res)
  } catch (err) {
    console.error('request failed', err)
    if (!res.headersSent) send(res, 500, { 'content-type': 'text/plain' }, 'server error')
  }
})

server.listen(PORT, () => {
  console.log(`ratecompare listening on :${PORT}, data dir ${DATA_DIR}`)
})
