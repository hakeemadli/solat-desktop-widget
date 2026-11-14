'use strict'

const Core = window.SolatCore
const api = window.solat

const CHECK_SVG =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">' +
  '<path d="M4 12.5l5 5L20 6.5"/></svg>'

const state = {
  config: {},
  data: null,
  error: null,
  geoError: null,
  loading: true,
  zones: [],
  isPackaged: false,
  version: ''
}

let tickTimer = null
let rowEls = new Map()
let lastTodayISO = null
let sheetOpen = false
let refreshing = false

function el(id) {
  return document.getElementById(id)
}

function cfg(key, fallback) {
  const value = state.config ? state.config[key] : undefined
  return value === undefined || value === null ? fallback : value
}

/* ------------------------------------------------------------------ *
 * Data helpers
 * ------------------------------------------------------------------ */

function todayRow() {
  if (!state.data || !state.data.days || !state.data.days.length) return null
  const iso = Core.toISODate(new Date())
  return state.data.days.find(function (d) { return d.dateISO === iso }) || state.data.days[0]
}

function rowForEvent(event) {
  if (!state.data || !event) return null
  return state.data.days.find(function (d) { return d.dateISO === event.dateISO }) || null
}

function timeOf(event) {
  const row = rowForEvent(event)
  if (row && row.times && row.times[event.key]) return row.times[event.key]
  return null
}

function eventLabel(event) {
  const raw = timeOf(event)
  if (raw) return Core.formatTime(raw, { hour12: cfg('hour12', false) })
  return Core.pad(event.at.getHours()) + ':' + Core.pad(event.at.getMinutes())
}

function currentSchedule() {
  if (!state.data) return null
  return Core.scheduleFor(state.data.days, new Date())
}

function zoneInfo() {
  const code = (state.data && state.data.zone) || cfg('zone', null)
  if (!code) return null
  return state.zones.find(function (z) { return z.code === code }) || null
}

function visibleKeys() {
  return Core.DISPLAY_KEYS.filter(function (key) {
    if (key === 'imsak') return cfg('showImsak', true)
    if (key === 'syuruk') return cfg('showSyuruk', true)
    return true
  })
}

/* ------------------------------------------------------------------ *
 * Render
 * ------------------------------------------------------------------ */

function renderZoneChip() {
  const zone = zoneInfo()
  el('zoneChip').textContent = zone ? zone.code : '—'
  el('zoneChip').title = zone ? zone.code + ' — ' + zone.label : 'Pilih zon'
}

function renderLocation() {
  const zone = zoneInfo()
  const detected = cfg('detected', null)
  let text = ''
  if (detected && detected.city) {
    text = detected.city + (detected.region ? ', ' + detected.region : '')
  } else if (zone) {
    text = zone.label
  } else {
    text = 'Lokasi belum ditetapkan'
  }
  el('locText').textContent = text
}

function renderHero(sched) {
  const nameEl = el('nextName')
  const atEl = el('nextAt')
  const countdownEl = el('countdown')
  const fillEl = el('progressFill')
  const footEl = el('heroFoot')

  if (!sched || !sched.next) {
    nameEl.textContent = state.error ? 'Tiada data' : 'Memuatkan'
    atEl.textContent = '--:--'
    countdownEl.textContent = '--:--:--'
    fillEl.style.width = '0%'
    footEl.textContent = state.error || 'Mengambil data JAKIM…'
    el('tomorrowBadge').classList.add('hidden')
    return
  }

  nameEl.textContent = sched.next.label
  atEl.textContent = eventLabel(sched.next)
  countdownEl.textContent = Core.formatCountdown(sched.remainingMs)
  fillEl.style.width = (sched.progress * 100).toFixed(1) + '%'
  el('tomorrowBadge').classList.toggle('hidden', !sched.isTomorrow)

  if (sched.prev) {
    footEl.textContent = sched.prev.label + ' ' + eventLabel(sched.prev) +
      '  →  ' + sched.next.label + ' ' + eventLabel(sched.next)
  } else {
    footEl.textContent = sched.next.label + ' ' + eventLabel(sched.next)
  }
}

function renderTimes() {
  const list = el('times')
  const row = todayRow()
  rowEls = new Map()
  list.innerHTML = ''

  if (!row) return

  const keys = visibleKeys()
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]
    const li = document.createElement('li')
    li.className = 'row'
    li.dataset.key = key

    const name = document.createElement('span')
    name.className = 'name'
    name.textContent = Core.LABELS[key]

    const leader = document.createElement('span')
    leader.className = 'leader'

    const time = document.createElement('span')
    time.className = 'time'
    time.textContent = Core.formatTime(row.times[key], { hour12: cfg('hour12', false) })

    const tick = document.createElement('span')
    tick.className = 'tick'
    tick.innerHTML = CHECK_SVG

    li.appendChild(name)
    li.appendChild(leader)
    li.appendChild(time)
    li.appendChild(tick)
    list.appendChild(li)
    rowEls.set(key, li)
  }

}

function renderRowStates(sched) {
  const row = todayRow()
  if (!row) return
  const now = Date.now()
  const nextKey = sched && sched.next && sched.next.dateISO === row.dateISO ? sched.next.key : null

  rowEls.forEach(function (li, key) {
    const at = Core.buildDate(row.dateISO, row.times[key], row.asMYT)
    const isPast = at ? at.getTime() <= now : false
    li.classList.toggle('past', isPast && key !== nextKey)
    li.classList.toggle('next', key === nextKey)
  })
}

function renderMeta() {
  const now = new Date()
  const row = todayRow()
  let line = Core.formatDateLong(now)
  if (row && row.hijri) line += ' · ' + Core.formatHijri(row.hijri)
  el('dateLine').textContent = line
}

function renderStatus() {
  const parts = []
  if (state.loading) {
    parts.push('Mengambil data JAKIM…')
  } else if (state.error) {
    parts.push(state.error)
  } else if (state.data) {
    let stamp = ''
    const server = String(state.data.serverTime || '').match(/(\d{2}:\d{2})/)
    if (server) {
      stamp = server[1]
    } else if (state.data.fetchedAt) {
      const t = new Date(state.data.fetchedAt)
      stamp = Core.pad(t.getHours()) + ':' + Core.pad(t.getMinutes())
    }
    parts.push(stamp ? 'Data ' + stamp : 'Data JAKIM')
    if (state.data.fromCache) parts.push('cache')
    if (state.data.stale) parts.push('offline')
    if (state.data.asMYT) parts.push('waktu MYT')
  } else {
    parts.push('Tiada data')
  }
  el('status').textContent = parts.join(' · ')
  el('staleBadge').classList.toggle('hidden', !(state.data && state.data.stale))
}

function renderPin() {
  el('btnPin').setAttribute('aria-pressed', cfg('alwaysOnTop', true) ? 'true' : 'false')
  el('btnPin').title = cfg('alwaysOnTop', true) ? 'Sentiasa di atas: aktif' : 'Sentiasa di atas: mati'
}

function renderAll() {
  el('card').classList.toggle('loading', !state.data)
  renderZoneChip()
  renderLocation()
  renderPin()
  renderTimes()
  const sched = currentSchedule()
  renderHero(sched)
  renderRowStates(sched)
  renderMeta()
  renderStatus()
  syncPrefs()
}

/* ------------------------------------------------------------------ *
 * Ticker
 * ------------------------------------------------------------------ */

function tick() {
  if (!state.data) {
    if (state.error) renderHero(null)
    return
  }
  const now = new Date()
  const todayISO = Core.toISODate(now)

  if (lastTodayISO && todayISO !== lastTodayISO) {
    lastTodayISO = todayISO
    requestRefresh()
    return
  }
  lastTodayISO = todayISO

  const sched = currentSchedule()
  renderHero(sched)
  renderRowStates(sched)
  renderStatus()
}

function startTicker() {
  if (tickTimer) clearInterval(tickTimer)
  tickTimer = setInterval(tick, 500)
}

/* ------------------------------------------------------------------ *
 * Tetapan
 * ------------------------------------------------------------------ */

function syncPrefs() {
  const setChecked = function (id, value) {
    const node = el(id)
    if (node) node.checked = !!value
  }
  setChecked('prefNotify', cfg('notifyEnabled', true))
  setChecked('prefTop', cfg('alwaysOnTop', true))
  setChecked('prefImsak', cfg('showImsak', true))
  setChecked('prefSyuruk', cfg('showSyuruk', true))
  setChecked('prefHour12', cfg('hour12', false))
  setChecked('prefAuto', cfg('autoLaunch', false))

  const lead = el('prefLead')
  if (lead) {
    const value = String(cfg('notifyLead', 10))
    if (lead.value !== value) lead.value = value
  }

  const auto = el('prefAuto')
  const hint = el('autoHint')
  if (auto) auto.disabled = !state.isPackaged
  if (hint) {
    hint.textContent = state.isPackaged
      ? 'Widget akan mula tersembunyi di tray apabila Windows dihidupkan.'
      : 'Pilihan ini hanya aktif pada versi yang dibina (.exe).'
  }

  el('versionText').textContent = 'v' + (state.version || '1.0.0')
}

function renderZoneList(filter) {
  const list = el('zoneList')
  const query = String(filter || '').trim().toLowerCase()
  const activeCode = (state.data && state.data.zone) || cfg('zone', null)
  const items = state.zones.filter(function (z) {
    if (!query) return true
    return (z.code + ' ' + z.state + ' ' + z.label).toLowerCase().indexOf(query) !== -1
  })

  list.innerHTML = ''
  if (!items.length) {
    const li = document.createElement('li')
    li.textContent = 'Tiada zon sepadan.'
    li.style.cursor = 'default'
    li.style.color = 'rgba(233,246,240,0.5)'
    list.appendChild(li)
    return
  }

  items.forEach(function (zone) {
    const li = document.createElement('li')
    if (zone.code === activeCode) li.classList.add('active')

    const code = document.createElement('span')
    code.className = 'zcode'
    code.textContent = zone.code

    const label = document.createElement('span')
    label.className = 'zlabel'
    label.textContent = zone.state + ' · ' + zone.label

    li.appendChild(code)
    li.appendChild(label)
    li.title = zone.code + ' — ' + zone.label
    li.addEventListener('click', function () { chooseZone(zone.code) })
    list.appendChild(li)
  })
}

function renderDetectHint() {
  const detected = cfg('detected', null)
  const zone = zoneInfo()
  const hint = el('detectHint')
  if (detected && detected.city) {
    hint.textContent = 'Dikesan: ' + detected.city +
      (detected.region ? ', ' + detected.region : '') +
      (zone ? ' → ' + zone.code : '')
  } else if (state.geoError === 'outside-malaysia') {
    hint.textContent = 'Lokasi rangkaian bukan di Malaysia. Pilih zon secara manual.'
  } else if (state.geoError) {
    hint.textContent = 'Gagal mengesan lokasi. Pilih zon secara manual.'
  } else {
    hint.textContent = 'Zon dipilih secara automatik daripada lokasi rangkaian.'
  }
}

function openSheet() {
  sheetOpen = true
  el('sheet').classList.remove('hidden')
  renderZoneList('')
  renderDetectHint()
  syncPrefs()
  el('zoneSearch').value = ''
}

function closeSheet() {
  sheetOpen = false
  el('sheet').classList.add('hidden')
}

async function chooseZone(code) {
  try {
    el('btnDetect').disabled = true
    await api.setZone(code)
  } catch (err) {
    console.warn('setZone gagal', err)
  } finally {
    el('btnDetect').disabled = false
  }
  closeSheet()
}

async function detectLocation() {
  const btn = el('btnDetect')
  const original = btn.innerHTML
  btn.disabled = true
  btn.textContent = 'Mengesan…'
  try {
    const result = await api.detect()
    if (!result || !result.ok) {
      state.geoError = result ? result.reason : 'offline'
      if (result && result.zone) state.config.zone = result.zone
    } else {
      state.geoError = null
    }
    renderAll()
    renderZoneList(el('zoneSearch').value)
    renderDetectHint()
  } catch (err) {
    state.geoError = 'offline'
    renderDetectHint()
  } finally {
    btn.disabled = false
    btn.innerHTML = original
  }
}

async function requestRefresh() {
  if (refreshing) return
  refreshing = true
  const btn = el('btnRefresh')
  btn.classList.add('spin')
  try {
    await api.refresh()
  } catch (err) {
    console.warn('refresh gagal', err)
  } finally {
    refreshing = false
    btn.classList.remove('spin')
  }
}

async function setPref(patch) {
  Object.assign(state.config, patch)
  renderAll()
  try {
    const next = await api.setPref(patch)
    if (next) state.config = next
    renderAll()
  } catch (err) {
    console.warn('setPref gagal', err)
  }
}

/* ------------------------------------------------------------------ *
 * Event binding
 * ------------------------------------------------------------------ */

function bindUi() {
  el('btnClose').addEventListener('click', function () { api.quit() })
  el('btnMin').addEventListener('click', function () { api.hide() })
  el('btnRefresh').addEventListener('click', requestRefresh)
  el('zoneChip').addEventListener('click', function () {
    openSheet()
    el('zoneSearch').focus()
  })
  el('btnSettings').addEventListener('click', function () {
    if (sheetOpen) closeSheet()
    else openSheet()
  })
  el('btnPin').addEventListener('click', function () {
    setPref({ alwaysOnTop: !cfg('alwaysOnTop', true) })
  })

  el('btnCloseSheet').addEventListener('click', closeSheet)
  el('btnDetect').addEventListener('click', detectLocation)
  el('btnQuit').addEventListener('click', function () { api.quit() })
  el('btnHide').addEventListener('click', function () { api.hide() })

  el('zoneSearch').addEventListener('input', function (e) {
    renderZoneList(e.target.value)
  })

  el('prefNotify').addEventListener('change', function (e) {
    setPref({ notifyEnabled: e.target.checked })
  })
  el('prefLead').addEventListener('change', function (e) {
    setPref({ notifyLead: Number(e.target.value) })
  })
  el('prefTop').addEventListener('change', function (e) {
    setPref({ alwaysOnTop: e.target.checked })
  })
  el('prefImsak').addEventListener('change', function (e) {
    setPref({ showImsak: e.target.checked })
  })
  el('prefSyuruk').addEventListener('change', function (e) {
    setPref({ showSyuruk: e.target.checked })
  })
  el('prefHour12').addEventListener('change', function (e) {
    setPref({ hour12: e.target.checked })
  })
  el('prefAuto').addEventListener('change', function (e) {
    setPref({ autoLaunch: e.target.checked })
  })

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && sheetOpen) closeSheet()
  })
}

/* ------------------------------------------------------------------ *
 * Boot
 * ------------------------------------------------------------------ */

function applyUpdate(payload) {
  if (!payload) return
  state.config = payload.config || state.config
  state.data = payload.data
  state.error = payload.error
  state.loading = !!payload.loading
  if (payload.geoError !== undefined) state.geoError = payload.geoError

  renderAll()

  if (sheetOpen) renderZoneList(el('zoneSearch').value)
}

async function boot() {
  bindUi()

  try {
    const init = await api.init()
    state.config = init.config || {}
    state.data = init.data || null
    state.error = init.error || null
    state.geoError = init.geoError || null
    state.loading = !!init.loading
    state.zones = init.zones || []
    state.isPackaged = !!init.isPackaged
    state.version = init.version || ''
  } catch (err) {
    state.error = 'Gagal memulakan widget'
    console.error(err)
  }

  api.onUpdate(applyUpdate)

  lastTodayISO = Core.toISODate(new Date())
  renderAll()
  startTicker()
}

boot()
