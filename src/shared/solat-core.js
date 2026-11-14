/**
 * Logik solat yang dikongsi antara proses utama (Node) dan renderer (browser).
 * Dimuatkan sebagai CommonJS di main, dan sebagai <script> biasa di renderer.
 */
;(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory()
  else root.SolatCore = factory()
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict'

  const MONTHS = {
    Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
    Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11
  }

  // Susunan rasmi JAKIM. Imsak/Syuruk/Dhuha dipaparkan tetapi bukan "solat".
  const ALL_KEYS = ['imsak', 'fajr', 'syuruk', 'dhuha', 'dhuhr', 'asr', 'maghrib', 'isha']
  const PRAYER_KEYS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']
  const DISPLAY_KEYS = ['imsak', 'fajr', 'syuruk', 'dhuhr', 'asr', 'maghrib', 'isha']

  const LABELS = {
    imsak: 'Imsak',
    fajr: 'Subuh',
    syuruk: 'Syuruk',
    dhuha: 'Dhuha',
    dhuhr: 'Zohor',
    asr: 'Asar',
    maghrib: 'Maghrib',
    isha: 'Isyak'
  }

  const WEEKDAYS_MS = ['Ahad', 'Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu']
  const MONTHS_MS = ['Jan', 'Feb', 'Mac', 'Apr', 'Mei', 'Jun', 'Jul', 'Ogos', 'Sep', 'Okt', 'Nov', 'Dis']
  const HIJRI_MONTHS = [
    'Muharram', 'Safar', 'Rabiulawal', 'Rabiulakhir', 'Jamadilawal', 'Jamadilakhir',
    'Rejab', 'Syaaban', 'Ramadan', 'Syawal', 'Zulkaedah', 'Zulhijjah'
  ]

  const MYT_OFFSET_MINUTES = 480 // UTC+8

  function pad(n) {
    return n < 10 ? '0' + n : String(n)
  }

  function toISODate(d) {
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate())
  }

  /** "14-Nov-2026" -> { y, m, d } */
  function parseApiDate(str) {
    const parts = String(str || '').split('-')
    if (parts.length !== 3) return null
    const day = parseInt(parts[0], 10)
    const month = MONTHS[parts[1]]
    const year = parseInt(parts[2], 10)
    if (!Number.isFinite(day) || month === undefined || !Number.isFinite(year)) return null
    return { y: year, m: month, d: day }
  }

  /** "05:48:00" -> { h, m, s } */
  function parseApiTime(str) {
    const parts = String(str || '').split(':')
    if (parts.length < 2) return null
    const h = parseInt(parts[0], 10)
    const m = parseInt(parts[1], 10)
    const s = parts[2] ? parseInt(parts[2], 10) : 0
    if (!Number.isFinite(h) || !Number.isFinite(m)) return null
    return { h: h, m: m, s: Number.isFinite(s) ? s : 0 }
  }

  /**
   * Bina Date untuk sesuatu tarikh + masa.
   * asMYT = true bermaksud masa API ialah waktu Malaysia (UTC+8), bukan zon peranti.
   */
  function buildDate(dateISO, timeStr, asMYT) {
    const d = parseApiDate(dateISO) || (function () {
      const p = String(dateISO).split('-')
      return { y: +p[0], m: +p[1] - 1, d: +p[2] }
    })()
    const t = parseApiTime(timeStr)
    if (!d || !t) return null
    if (asMYT) {
      return new Date(Date.UTC(d.y, d.m, d.d, t.h - 8, t.m, t.s))
    }
    return new Date(d.y, d.m, d.d, t.h, t.m, t.s)
  }

  /** Normalisasi satu baris daripada API JAKIM. */
  function normalizeRow(row, asMYT) {
    const parsed = parseApiDate(row.date)
    const dateISO = parsed
      ? parsed.y + '-' + pad(parsed.m + 1) + '-' + pad(parsed.d)
      : String(row.date)
    const times = {}
    for (let i = 0; i < ALL_KEYS.length; i++) {
      const key = ALL_KEYS[i]
      times[key] = row[key] || null
    }
    return {
      dateISO: dateISO,
      hijri: row.hijri || null,
      weekday: row.day || null,
      times: times,
      asMYT: !!asMYT
    }
  }

  function normalizeDays(rows, asMYT) {
    const map = Object.create(null)
    for (let i = 0; i < rows.length; i++) {
      const row = normalizeRow(rows[i], asMYT)
      map[row.dateISO] = row
    }
    return Object.keys(map).sort().map(function (k) { return map[k] })
  }

  /** Senarai semua waktu solat (5 solat) sebagai event bertarikh. */
  function prayerEvents(days) {
    const out = []
    for (let i = 0; i < days.length; i++) {
      const day = days[i]
      for (let j = 0; j < PRAYER_KEYS.length; j++) {
        const key = PRAYER_KEYS[j]
        const at = buildDate(day.dateISO, day.times[key], day.asMYT)
        if (!at) continue
        out.push({ key: key, label: LABELS[key], dateISO: day.dateISO, at: at })
      }
    }
    out.sort(function (a, b) { return a.at - b.at })
    return out
  }

  /** Cari solat seterusnya berdasarkan jam peranti. */
  function scheduleFor(days, now) {
    const events = prayerEvents(days)
    if (!events.length) return null
    const t = now.getTime()
    let nextIdx = -1
    for (let i = 0; i < events.length; i++) {
      if (events[i].at.getTime() > t) { nextIdx = i; break }
    }
    const next = nextIdx >= 0 ? events[nextIdx] : null
    const prev = nextIdx > 0 ? events[nextIdx - 1] : (nextIdx === -1 ? events[events.length - 1] : null)
    const todayISO = toISODate(now)
    const todayRow = days.find(function (d) { return d.dateISO === todayISO }) || null

    let progress = 0
    if (next && prev && next.at > prev.at) {
      const total = next.at.getTime() - prev.at.getTime()
      const done = t - prev.at.getTime()
      progress = Math.min(1, Math.max(0, done / total))
    }

    return {
      next: next,
      prev: prev,
      remainingMs: next ? Math.max(0, next.at.getTime() - t) : 0,
      progress: progress,
      todayISO: todayISO,
      todayRow: todayRow,
      isTomorrow: next ? next.dateISO !== todayISO : false,
      nowISO: toISODate(now)
    }
  }

  function formatCountdown(ms) {
    const total = Math.max(0, Math.floor(ms / 1000))
    const h = Math.floor(total / 3600)
    const m = Math.floor((total % 3600) / 60)
    const s = total % 60
    return pad(h) + ':' + pad(m) + ':' + pad(s)
  }

  /** "05:48:00" -> "5:48 PG" / "17:48" (mengikut preferensi). */
  function formatTime(timeStr, opts) {
    const t = parseApiTime(timeStr)
    if (!t) return '--:--'
    const want12 = opts && opts.hour12
    if (!want12) return pad(t.h) + ':' + pad(t.m)
    const suffix = t.h < 12 ? 'PG' : 'PTG'
    let hour = t.h % 12
    if (hour === 0) hour = 12
    return hour + ':' + pad(t.m) + ' ' + suffix
  }

  function formatDateLong(date) {
    return WEEKDAYS_MS[date.getDay()] + ', ' + date.getDate() + ' ' +
      MONTHS_MS[date.getMonth()] + ' ' + date.getFullYear()
  }

  /** "1448-06-04" -> "4 Jamadilakhir 1448" */
  function formatHijri(str) {
    if (!str) return ''
    const p = String(str).split('-')
    if (p.length !== 3) return str
    const y = parseInt(p[0], 10)
    const m = parseInt(p[1], 10)
    const d = parseInt(p[2], 10)
    const name = HIJRI_MONTHS[(m - 1 + 12) % 12] || ''
    return d + ' ' + name + ' ' + y
  }

  function isMalaysiaTime(date) {
    return -date.getTimezoneOffset() === MYT_OFFSET_MINUTES
  }

  return {
    ALL_KEYS: ALL_KEYS,
    PRAYER_KEYS: PRAYER_KEYS,
    DISPLAY_KEYS: DISPLAY_KEYS,
    LABELS: LABELS,
    HIJRI_MONTHS: HIJRI_MONTHS,
    MYT_OFFSET_MINUTES: MYT_OFFSET_MINUTES,
    pad: pad,
    toISODate: toISODate,
    parseApiDate: parseApiDate,
    parseApiTime: parseApiTime,
    buildDate: buildDate,
    normalizeRow: normalizeRow,
    normalizeDays: normalizeDays,
    prayerEvents: prayerEvents,
    scheduleFor: scheduleFor,
    formatCountdown: formatCountdown,
    formatTime: formatTime,
    formatDateLong: formatDateLong,
    formatHijri: formatHijri,
    isMalaysiaTime: isMalaysiaTime
  }
})
