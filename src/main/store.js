'use strict'

const fs = require('fs')
const path = require('path')
const { app } = require('electron')

const DEFAULTS = {
  zone: null,
  detected: null, // { city, region, country, lat, lon, via }
  alwaysOnTop: true,
  showImsak: true,
  showSyuruk: true,
  hour12: false,
  notifyEnabled: true,
  notifyLead: 10, // minit sebelum azan
  autoLaunch: false,
  bounds: null, // { x, y }
  lastNotified: null
}

let filePath = null
let data = null
let saveTimer = null

function getFilePath() {
  if (!filePath) filePath = path.join(app.getPath('userData'), 'config.json')
  return filePath
}

function load() {
  try {
    const raw = fs.readFileSync(getFilePath(), 'utf8')
    const parsed = JSON.parse(raw)
    data = Object.assign({}, DEFAULTS, parsed && typeof parsed === 'object' ? parsed : {})
  } catch (e) {
    data = Object.assign({}, DEFAULTS)
  }
  return data
}

function all() {
  if (!data) load()
  return data
}

function get(key) {
  return all()[key]
}

function set(key, value) {
  all()
  data[key] = value
  scheduleSave()
  return value
}

function patch(obj) {
  all()
  Object.keys(obj || {}).forEach(function (k) {
    if (Object.prototype.hasOwnProperty.call(DEFAULTS, k) || k === 'zone') data[k] = obj[k]
  })
  scheduleSave()
  return data
}

function flush() {
  if (saveTimer) {
    clearTimeout(saveTimer)
    saveTimer = null
  }
  try {
    const target = getFilePath()
    fs.mkdirSync(path.dirname(target), { recursive: true })
    const tmp = target + '.tmp'
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8')
    fs.renameSync(tmp, target)
  } catch (e) {
    console.error('[store] gagal menyimpan config:', e.message)
  }
}

function scheduleSave() {
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(flush, 250)
  if (saveTimer.unref) saveTimer.unref()
}

module.exports = { DEFAULTS: DEFAULTS, load: load, all: all, get: get, set: set, patch: patch, flush: flush }
