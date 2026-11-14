'use strict'

const path = require('path')
const {
  app, BrowserWindow, Tray, Menu, ipcMain, Notification,
  nativeImage, screen, shell
} = require('electron')

const store = require('./store')
const jakim = require('./jakim')
const zones = require('./zones')
const geolocate = require('./geolocate')
const Core = require('../shared/solat-core')

const APP_ID = 'com.solatwidget.widget'
const WINDOW_WIDTH = 344
const WINDOW_HEIGHT = 486
const DEFAULT_ZONE = 'WLY01'

const isDev = !app.isPackaged
const startHidden = process.argv.indexOf('--hidden') !== -1
const openDevTools = process.argv.indexOf('--devtools') !== -1

let win = null
let tray = null
let isQuitting = false
let timers = []
let tooltipTimer = null

const state = {
  data: null,
  error: null,
  loading: false,
  geoError: null
}

/* ------------------------------------------------------------------ *
 * Config
 * ------------------------------------------------------------------ */

function cfg() {
  return store.all()
}

function userDataPath() {
  return app.getPath('userData')
}

/* ------------------------------------------------------------------ *
 * Window
 * ------------------------------------------------------------------ */

function clampToDisplays(bounds) {
  if (!bounds || !Number.isFinite(bounds.x) || !Number.isFinite(bounds.y)) return null
  const probe = { x: bounds.x, y: bounds.y, width: WINDOW_WIDTH, height: WINDOW_HEIGHT }
  const display = screen.getDisplayMatching(probe)
  const area = display.workArea
  const margin = 24
  const minX = area.x - WINDOW_WIDTH + 80
  const maxX = area.x + area.width - 80
  const minY = area.y - 40
  const maxY = area.y + area.height - 80
  const x = Math.min(maxX, Math.max(minX, bounds.x))
  const y = Math.min(maxY, Math.max(minY, bounds.y))
  // Kalau tersasar jauh, letak semula di penjuru kanan bawah.
  const offscreen = Math.abs(x - bounds.x) > 200 || Math.abs(y - bounds.y) > 200
  if (offscreen) return null
  return { x: x, y: y, margin: margin }
}

function defaultPosition() {
  const display = screen.getPrimaryDisplay()
  const area = display.workArea
  return {
    x: area.x + area.width - WINDOW_WIDTH - 28,
    y: area.y + area.height - WINDOW_HEIGHT - 28
  }
}

function createWindow() {
  const saved = clampToDisplays(cfg().bounds)
  const pos = saved || defaultPosition()

  win = new BrowserWindow({
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
    x: pos.x,
    y: pos.y,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    resizable: false,
    maximizable: false,
    minimizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    hasShadow: false,
    show: false,
    alwaysOnTop: cfg().alwaysOnTop !== false,
    icon: path.join(__dirname, '../../assets/icon-256.png'),
    title: 'Solat Widget',
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
      devTools: isDev
    }
  })

  win.setMenu(null)
  win.loadFile(path.join(__dirname, '../renderer/index.html'))

  win.once('ready-to-show', function () {
    if (!startHidden) win.show()
    if (openDevTools) win.webContents.openDevTools({ mode: 'detach' })
  })

  win.on('moved', function () {
    const b = win.getBounds()
    store.set('bounds', { x: b.x, y: b.y })
  })

  win.on('close', function (e) {
    if (!isQuitting) {
      e.preventDefault()
      win.hide()
    }
  })

  win.on('show', function () {
    if (cfg().alwaysOnTop !== false) win.setAlwaysOnTop(true)
  })

  // Jangan benarkan navigasi keluar dari app.
  win.webContents.setWindowOpenHandler(function (details) {
    if (/^https?:/i.test(details.url)) shell.openExternal(details.url)
    return { action: 'deny' }
  })
  win.webContents.on('will-navigate', function (e) { e.preventDefault() })
}

function showWindow() {
  if (!win) return
  if (win.isMinimized()) win.restore()
  win.show()
  win.focus()
}

function toggleWindow() {
  if (!win) return
  if (win.isVisible() && win.isFocused()) win.hide()
  else showWindow()
}

/* ------------------------------------------------------------------ *
 * Tray
 * ------------------------------------------------------------------ */

function eventTimeLabel(event) {
  if (!event) return '--:--'
  if (state.data) {
    const row = state.data.days.find(function (d) { return d.dateISO === event.dateISO })
    if (row && row.times[event.key]) return Core.formatTime(row.times[event.key], { hour12: cfg().hour12 })
  }
  const d = event.at
  return Core.pad(d.getHours()) + ':' + Core.pad(d.getMinutes())
}

function nextPrayerSummary() {
  if (!state.data) return 'Memuatkan…'
  const s = Core.scheduleFor(state.data.days, new Date())
  if (!s || !s.next) return 'Tiada data'
  return s.next.label + ' ' + eventTimeLabel(s.next) + ' (' + Core.formatCountdown(s.remainingMs) + ')'
}

function updateTooltip() {
  if (!tray) return
  let text = 'Solat Widget'
  if (state.data) {
    text += '\n' + nextPrayerSummary()
    const z = zones.byCode(state.data.zone)
    if (z) text += '\n' + z.code + ' · ' + z.state
  } else if (state.error) {
    text += '\n' + state.error
  }
  tray.setToolTip(text)
}

function buildTrayMenu() {
  const c = cfg()
  const zone = zones.byCode(c.zone)
  const items = [
    { label: state.data ? nextPrayerSummary() : 'Memuatkan…', enabled: false },
    { label: zone ? 'Zon: ' + zone.code + ' · ' + zone.state : 'Zon: belum dipilih', enabled: false },
    { type: 'separator' },
    { label: 'Tunjuk Widget', click: showWindow },
    { label: 'Muat Semula Data', click: function () { loadData({ force: true, reason: 'tray' }) } },
    { type: 'separator' },
    {
      label: 'Sentiasa di Atas',
      type: 'checkbox',
      checked: c.alwaysOnTop !== false,
      click: function (item) { applyPref({ alwaysOnTop: item.checked }) }
    },
    {
      label: 'Mula Bersama Windows',
      type: 'checkbox',
      checked: !!c.autoLaunch,
      enabled: app.isPackaged,
      click: function (item) { applyPref({ autoLaunch: item.checked }) }
    },
    {
      label: 'Notifikasi Azan',
      type: 'checkbox',
      checked: c.notifyEnabled !== false,
      click: function (item) { applyPref({ notifyEnabled: item.checked }) }
    },
    { type: 'separator' },
    { label: 'Keluar', click: function () { quitApp() } }
  ]
  return Menu.buildFromTemplate(items)
}

function createTray() {
  const iconPath = path.join(__dirname, '../../assets/tray-32.png')
  let image = nativeImage.createFromPath(iconPath)
  if (image.isEmpty()) {
    image = nativeImage.createFromPath(path.join(__dirname, '../../assets/icon-256.png')).resize({ width: 20, height: 20 })
  }
  tray = new Tray(image)
  tray.setToolTip('Solat Widget')
  tray.on('click', toggleWindow)
  tray.on('right-click', function () { tray.popUpContextMenu(buildTrayMenu()) })
  updateTooltip()
  if (tooltipTimer) clearInterval(tooltipTimer)
  tooltipTimer = setInterval(updateTooltip, 20000)
}

/* ------------------------------------------------------------------ *
 * Data
 * ------------------------------------------------------------------ */

function payload() {
  return {
    config: cfg(),
    data: state.data,
    error: state.error,
    geoError: state.geoError,
    loading: state.loading,
    isPackaged: app.isPackaged,
    version: app.getVersion()
  }
}

function broadcast() {
  if (win && !win.isDestroyed()) win.webContents.send('solat:update', payload())
  updateTooltip()
}

function setError(message) {
  state.error = message || null
}

async function loadData(options) {
  const opts = options || {}
  const zone = String(opts.zone || cfg().zone || DEFAULT_ZONE).toUpperCase()
  state.loading = true
  broadcast()
  try {
    const data = await jakim.getData(zone, { force: !!opts.force })
    state.data = data
    setError(data.error && data.stale ? 'Data cache digunakan (' + data.error + ')' : null)
  } catch (err) {
    setError(err.message || 'Gagal mendapatkan data JAKIM')
    console.error('[main] gagal memuat data:', err.message)
  } finally {
    state.loading = false
  }
  scheduleTimers()
  broadcast()
  return state.data
}

async function resolveZoneFromLocation() {
  const result = await geolocate.detect()
  if (result.zone) {
    const detected = {
      city: result.geo.city || null,
      region: result.geo.region || null,
      country: result.geo.country || null,
      lat: result.geo.lat || null,
      lon: result.geo.lon || null,
      via: result.via || null,
      provider: result.geo.provider || null,
      at: new Date().toISOString()
    }
    store.patch({ zone: result.zone.code, detected: detected })
    state.geoError = null
    return result.zone.code
  }
  state.geoError = result.reason
  return null
}

/* ------------------------------------------------------------------ *
 * Notifikasi & penjadual
 * ------------------------------------------------------------------ */

function clearTimers() {
  timers.forEach(function (t) { clearTimeout(t) })
  timers = []
}

function showAdhanNotification(event, lead) {
  if (!Notification.isSupported()) return
  const zone = zones.byCode(cfg().zone)
  const isNow = !lead
  const title = isNow ? 'Masuk waktu ' + event.label : event.label + ' ' + lead + ' minit lagi'
  const body = event.label + ' ' + eventTimeLabel(event) +
    (zone ? ' · ' + zone.code + ' · ' + zone.state : '')

  const notification = new Notification({
    title: title,
    body: body,
    icon: path.join(__dirname, '../../assets/icon-256.png'),
    silent: false
  })
  notification.on('click', showWindow)
  notification.show()
}

function scheduleTimers() {
  clearTimers()
  if (!state.data) return
  const config = cfg()
  const now = Date.now()
  const leadMs = Math.max(0, Number(config.notifyLead) || 0) * 60000
  const events = Core.prayerEvents(state.data.days)

  if (config.notifyEnabled !== false) {
    for (let i = 0; i < events.length; i++) {
      const ev = events[i]
      const azanAt = ev.at.getTime()
      if (azanAt < now) continue
      const delay = azanAt - leadMs - now
      if (delay > 0 && delay < 30 * 60 * 60 * 1000) {
        timers.push(setTimeout(function () { fire(ev) }, delay))
      }
    }
  }

  // Muat semula selepas tengah malam untuk tarikh baharu.
  const midnight = new Date()
  midnight.setHours(24, 0, 25, 0)
  const midnightDelay = Math.max(10000, midnight.getTime() - now)
  timers.push(setTimeout(function () {
    loadData({ force: true, reason: 'midnight' })
  }, midnightDelay))
}

let lastNotified = null
function fire(event) {
  if (!event) return
  const config = cfg()
  if (config.notifyEnabled === false) return
  const key = event.dateISO + '|' + event.key + '|' + config.notifyLead
  if (lastNotified === key || config.lastNotified === key) return
  lastNotified = key
  store.set('lastNotified', key)
  showAdhanNotification(event, Number(config.notifyLead) || 0)
  updateTooltip()
}

/* ------------------------------------------------------------------ *
 * Preferensi
 * ------------------------------------------------------------------ */

function applyAutoLaunch(enabled) {
  if (!app.isPackaged) return
  try {
    app.setLoginItemSettings({
      openAtLogin: !!enabled,
      path: process.execPath,
      args: ['--hidden']
    })
  } catch (err) {
    console.error('[main] setLoginItemSettings gagal:', err.message)
  }
}

const PREF_KEYS = {
  alwaysOnTop: 'boolean',
  showImsak: 'boolean',
  showSyuruk: 'boolean',
  hour12: 'boolean',
  notifyEnabled: 'boolean',
  notifyLead: 'number',
  autoLaunch: 'boolean'
}

function applyPref(input) {
  const patch = {}
  Object.keys(input || {}).forEach(function (key) {
    if (!Object.prototype.hasOwnProperty.call(PREF_KEYS, key)) return
    let value = input[key]
    if (PREF_KEYS[key] === 'boolean') value = !!value
    if (PREF_KEYS[key] === 'number') {
      value = Math.max(0, Math.min(60, Math.round(Number(value) || 0)))
    }
    patch[key] = value
  })
  if (!Object.keys(patch).length) return cfg()

  store.patch(patch)

  if (Object.prototype.hasOwnProperty.call(patch, 'alwaysOnTop') && win) {
    win.setAlwaysOnTop(!!patch.alwaysOnTop)
  }
  if (Object.prototype.hasOwnProperty.call(patch, 'autoLaunch')) {
    applyAutoLaunch(patch.autoLaunch)
  }
  if (Object.prototype.hasOwnProperty.call(patch, 'notifyEnabled') ||
      Object.prototype.hasOwnProperty.call(patch, 'notifyLead')) {
    lastNotified = null
    scheduleTimers()
  }
  broadcast()
  return cfg()
}

/* ------------------------------------------------------------------ *
 * IPC
 * ------------------------------------------------------------------ */

function registerIpc() {
  ipcMain.handle('solat:init', function () {
    return Object.assign(payload(), {
      zones: zones.minimal(),
      platform: process.platform
    })
  })

  ipcMain.handle('solat:refresh', function () {
    return loadData({ force: true, reason: 'manual' })
  })

  ipcMain.handle('solat:setZone', function (_e, code) {
    const zone = zones.byCode(code)
    if (!zone) throw new Error('Zon tidak sah: ' + code)
    store.patch({ zone: zone.code })
    state.error = null
    return loadData({ zone: zone.code, force: false, reason: 'zone' })
  })

  ipcMain.handle('solat:detect', async function () {
    const before = cfg().zone
    const code = await resolveZoneFromLocation()
    if (!code) {
      broadcast()
      return { ok: false, reason: state.geoError, zone: before }
    }
    await loadData({ zone: code, force: true, reason: 'detect' })
    broadcast()
    return { ok: true, zone: code, detected: cfg().detected }
  })

  ipcMain.handle('solat:setPref', function (_e, pref) {
    return applyPref(pref)
  })

  ipcMain.handle('solat:openExternal', function (_e, url) {
    if (/^https?:/i.test(String(url || ''))) shell.openExternal(url)
  })

  ipcMain.on('solat:hide', function () { if (win) win.hide() })
  ipcMain.on('solat:quit', function () { quitApp() })
}

function quitApp() {
  isQuitting = true
  store.flush()
  if (tray) tray.destroy()
  app.quit()
}

/* ------------------------------------------------------------------ *
 * Lifecycle
 * ------------------------------------------------------------------ */

const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', showWindow)

  app.setAppUserModelId(APP_ID)

  app.whenReady().then(async function () {
    store.load()

    registerIpc()
    createWindow()
    createTray()

    if (!store.get('zone')) {
      // Cuba kesan lokasi sekali sahaja; kalau gagal guna zon lalai.
      state.loading = true
      broadcast()
      const detected = await resolveZoneFromLocation().catch(function () { return null })
      if (!detected) store.set('zone', DEFAULT_ZONE)
    }

    if (store.get('autoLaunch') && app.isPackaged) applyAutoLaunch(true)

    await loadData({ force: false, reason: 'startup' })

    // Jaring keselamatan: muat semula setiap 3 jam.
    setInterval(function () {
      loadData({ force: true, reason: 'interval' })
    }, 3 * 60 * 60 * 1000).unref()

    app.on('activate', showWindow)
  })

  app.on('window-all-closed', function () {
    // Widget kekal hidup dalam tray.
  })

  app.on('before-quit', function () {
    isQuitting = true
    store.flush()
  })
}
