'use strict'

const fs = require('fs')
const path = require('path')
const { app, net } = require('electron')
const Core = require('../shared/solat-core')

const API = 'https://www.e-solat.gov.my/index.php'
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) SolatWidget/1.0'
const TIMEOUT_MS = 15000
const MONTH_TTL_MS = 6 * 60 * 60 * 1000
const RETRIES = 3

function sleep(ms) {
  return new Promise(function (resolve) { setTimeout(resolve, ms) })
}

function cacheDir() {
  // Jangan guna "cache" — Chromium guna folder <userData>/Cache untuk dirinya.
  return path.join(app.getPath('userData'), 'data')
}

function cachePath(zone, scope) {
  return path.join(cacheDir(), zone + '-' + scope + '.json')
}

function readCache(zone, scope) {
  try {
    const raw = JSON.parse(fs.readFileSync(cachePath(zone, scope), 'utf8'))
    if (raw && raw.payload && Array.isArray(raw.payload.prayerTime)) return raw
  } catch (e) { /* tiada cache */ }
  return null
}

function writeCache(zone, scope, payload) {
  try {
    fs.mkdirSync(cacheDir(), { recursive: true })
    fs.writeFileSync(cachePath(zone, scope), JSON.stringify({ savedAt: Date.now(), payload: payload }), 'utf8')
  } catch (e) {
    console.error('[jakim] gagal menulis cache:', e.message)
  }
}

function scopeKey(year, monthIndex) {
  return 'month-' + year + '-' + Core.pad(monthIndex + 1)
}

async function request(zone, period) {
  const url = API + '?r=esolatApi/takwimsolat&period=' + period +
    '&zone=' + encodeURIComponent(zone) + '&lang=ms_my'
  let lastError = null
  for (let attempt = 0; attempt < RETRIES; attempt++) {
    if (attempt > 0) await sleep(600 * Math.pow(2, attempt - 1))
    try {
      const res = await net.fetch(url, {
        headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
        signal: AbortSignal.timeout(TIMEOUT_MS)
      })
      if (!res.ok) throw new Error('HTTP ' + res.status)
      const json = await res.json()
      if (!json || !Array.isArray(json.prayerTime) || !json.prayerTime.length) {
        throw new Error(json && json.status ? 'JAKIM: ' + json.status : 'Invalid JAKIM response')
      }
      return json
    } catch (err) {
      lastError = err
      console.warn('[jakim] cubaan ' + (attempt + 1) + ' gagal: ' + err.message)
    }
  }
  throw lastError || new Error('Ralat rangkaian')
}

async function getPeriod(zone, period, options) {
  const force = !!(options && options.force)
  const ttl = (options && options.ttlMs) || MONTH_TTL_MS
  const scope = period === 'month'
    ? scopeKey(options.year, options.monthIndex)
    : period
  const cached = readCache(zone, scope)
  if (!force && cached && Date.now() - cached.savedAt < ttl) {
    return { payload: cached.payload, cached: true, stale: false }
  }
  try {
    const payload = await request(zone, period)
    writeCache(zone, scope, payload)
    return { payload: payload, cached: false, stale: false }
  } catch (err) {
    if (cached) {
      return { payload: cached.payload, cached: true, stale: true, error: err.message }
    }
    throw err
  }
}

/**
 * Ambil jadual solat untuk satu zon.
 * Bulan semasa diambil. Pada hari-hari terakhir bulan, jadual mingguan turut
 * diambil kerana API JAKIM hanya memulangkan bulan semasa — mingguan menutupi
 * Subuh esok selepas Isyak (dan selepas tengah malam sehingga muat semula).
 */
async function getData(zone, options) {
  const force = !!(options && options.force)
  const asMYT = Core.isMalaysiaTime(new Date()) === false
  const now = new Date()
  const year = now.getFullYear()
  const monthIndex = now.getMonth()

  const requests = [{ period: 'month', year: year, monthIndex: monthIndex, ttlMs: MONTH_TTL_MS }]
  const lastDayOfMonth = new Date(year, monthIndex + 1, 0).getDate()
  if (now.getDate() >= lastDayOfMonth - 1) {
    requests.push({ period: 'week', ttlMs: 60 * 60 * 1000 })
  }

  const rows = []
  let stale = false
  let serverTime = null
  let lastError = null
  let allCached = true

  for (const spec of requests) {
    try {
      const result = await getPeriod(zone, spec.period, {
        force: force,
        ttlMs: spec.ttlMs,
        year: spec.year,
        monthIndex: spec.monthIndex
      })
      if (result.stale) stale = true
      if (!result.cached) allCached = false
      if (result.payload.serverTime) serverTime = result.payload.serverTime
      rows.push.apply(rows, result.payload.prayerTime)
    } catch (err) {
      lastError = err
      stale = true
    }
  }

  if (!rows.length) {
    throw new Error(lastError ? lastError.message : 'No JAKIM data for zone ' + zone)
  }

  const days = Core.normalizeDays(rows, asMYT)

  return {
    zone: zone,
    days: days,
    asMYT: asMYT,
    stale: stale,
    fromCache: allCached,
    serverTime: serverTime,
    fetchedAt: new Date().toISOString(),
    error: lastError ? lastError.message : null
  }
}

module.exports = { getData: getData, API: API }
