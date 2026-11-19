/**
 * Teks antara muka dalam dua bahasa. Dimuatkan sebagai CommonJS di main,
 * dan sebagai <script> biasa di renderer.
 */
;(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory()
  else root.SolatI18n = factory()
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict'

  const LANGS = [
    { code: 'en', label: 'English' },
    { code: 'ms', label: 'Bahasa Melayu' }
  ]

  const STRINGS = {
    en: {
      'card.next': 'Next',
      'card.tomorrow': 'Tomorrow',
      'card.cache': 'Cache',
      'card.loading': 'Loading',
      'card.noData': 'No data',
      'card.fetching': 'Fetching JAKIM data…',
      'card.refresh': 'Refresh',
      'card.locationUnknown': 'Location not set',
      'card.locationPending': 'Detecting location…',
      'card.zoneTitle': 'Change zone',
      'card.statusData': 'Data {time}',
      'card.statusCache': 'cache',
      'card.statusOffline': 'offline',
      'card.statusMyt': 'MYT time',

      'tip.pinOn': 'Always on top: on',
      'tip.pinOff': 'Always on top: off',
      'tip.settings': 'Settings',
      'tip.hide': 'Hide to tray',
      'tip.close': 'Quit',
      'tip.sizeNormal': 'Normal size',
      'tip.sizeCompact': 'Compact size',

      'settings.title': 'Settings',
      'settings.close': 'Close settings',
      'settings.zone': 'JAKIM zone',
      'settings.detectHint': 'Zone is picked automatically from your network location.',
      'settings.detected': 'Detected: {where}',
      'settings.detectOutside': 'Your network location is outside Malaysia. Pick a zone manually.',
      'settings.detectFailed': 'Could not detect your location. Pick a zone manually.',
      'settings.detect': 'Detect my location',
      'settings.detecting': 'Detecting…',
      'settings.searchPlaceholder': 'Search zone, state or district…',
      'settings.noZone': 'No matching zone.',
      'settings.notifications': 'Notifications',
      'settings.notifyBefore': 'Reminder before adhan',
      'settings.lead': 'Lead time',
      'settings.onTime': 'At adhan',
      'settings.minutes': '{n} min',
      'settings.display': 'Display',
      'settings.alwaysOnTop': 'Always on top',
      'settings.showImsak': 'Show Imsak',
      'settings.showSyuruk': 'Show Sunrise',
      'settings.hour12': '12-hour format (AM/PM)',
      'settings.compact': 'Compact card',
      'settings.language': 'Language',
      'settings.system': 'System',
      'settings.autoLaunch': 'Start with Windows',
      'settings.autoHintPackaged': 'The widget starts hidden in the tray when Windows starts.',
      'settings.autoHintDev': 'Only available in the packaged (.exe) build.',
      'settings.toTray': 'To tray',
      'settings.quit': 'Quit',

      'tray.show': 'Show Widget',
      'tray.refresh': 'Refresh Data',
      'tray.alwaysOnTop': 'Always on Top',
      'tray.autoLaunch': 'Start with Windows',
      'tray.notifications': 'Adhan Notifications',
      'tray.compact': 'Compact Size',
      'tray.quit': 'Quit',
      'tray.zone': 'Zone: {code} · {state}',
      'tray.zoneUnset': 'Zone: not set',
      'tray.loading': 'Loading…',
      'tray.noData': 'No data',

      'notify.titleNow': 'Entering {prayer}',
      'notify.titleLead': '{prayer} in {n} min',

      'error.fetch': 'Could not fetch JAKIM data',
      'error.cache': 'Using cached data ({msg})',
      'error.zone': 'Invalid zone: {code}',
      'error.boot': 'Could not start the widget'
    },
    ms: {
      'card.next': 'Seterusnya',
      'card.tomorrow': 'Esok',
      'card.cache': 'Cache',
      'card.loading': 'Memuatkan',
      'card.noData': 'Tiada data',
      'card.fetching': 'Mengambil data JAKIM…',
      'card.refresh': 'Muat semula',
      'card.locationUnknown': 'Lokasi belum ditetapkan',
      'card.locationPending': 'Mengesan lokasi…',
      'card.zoneTitle': 'Tukar zon',
      'card.statusData': 'Data {time}',
      'card.statusCache': 'cache',
      'card.statusOffline': 'offline',
      'card.statusMyt': 'waktu MYT',

      'tip.pinOn': 'Sentiasa di atas: aktif',
      'tip.pinOff': 'Sentiasa di atas: mati',
      'tip.settings': 'Tetapan',
      'tip.hide': 'Sembunyi ke tray',
      'tip.close': 'Tutup',
      'tip.sizeNormal': 'Saiz biasa',
      'tip.sizeCompact': 'Saiz padat',

      'settings.title': 'Tetapan',
      'settings.close': 'Tutup tetapan',
      'settings.zone': 'Zon JAKIM',
      'settings.detectHint': 'Zon dipilih secara automatik daripada lokasi rangkaian.',
      'settings.detected': 'Dikesan: {where}',
      'settings.detectOutside': 'Lokasi rangkaian bukan di Malaysia. Pilih zon secara manual.',
      'settings.detectFailed': 'Gagal mengesan lokasi. Pilih zon secara manual.',
      'settings.detect': 'Kesan lokasi saya',
      'settings.detecting': 'Mengesan…',
      'settings.searchPlaceholder': 'Cari zon, negeri atau daerah…',
      'settings.noZone': 'Tiada zon sepadan.',
      'settings.notifications': 'Notifikasi',
      'settings.notifyBefore': 'Notifikasi sebelum azan',
      'settings.lead': 'Masa awal',
      'settings.onTime': 'Tepat waktu',
      'settings.minutes': '{n} minit',
      'settings.display': 'Paparan',
      'settings.alwaysOnTop': 'Sentiasa di atas',
      'settings.showImsak': 'Tunjuk Imsak',
      'settings.showSyuruk': 'Tunjuk Syuruk',
      'settings.hour12': 'Format 12 jam (PG/PTG)',
      'settings.compact': 'Kad padat',
      'settings.language': 'Bahasa',
      'settings.system': 'Sistem',
      'settings.autoLaunch': 'Mula bersama Windows',
      'settings.autoHintPackaged': 'Widget akan mula tersembunyi di tray apabila Windows dihidupkan.',
      'settings.autoHintDev': 'Pilihan ini hanya aktif pada versi yang dibina (.exe).',
      'settings.toTray': 'Ke tray',
      'settings.quit': 'Keluar',

      'tray.show': 'Tunjuk Widget',
      'tray.refresh': 'Muat Semula Data',
      'tray.alwaysOnTop': 'Sentiasa di Atas',
      'tray.autoLaunch': 'Mula Bersama Windows',
      'tray.notifications': 'Notifikasi Azan',
      'tray.compact': 'Saiz Padat',
      'tray.quit': 'Keluar',
      'tray.zone': 'Zon: {code} · {state}',
      'tray.zoneUnset': 'Zon: belum dipilih',
      'tray.loading': 'Memuatkan…',
      'tray.noData': 'Tiada data',

      'notify.titleNow': 'Masuk waktu {prayer}',
      'notify.titleLead': '{prayer} {n} minit lagi',

      'error.fetch': 'Gagal mendapatkan data JAKIM',
      'error.cache': 'Data cache digunakan ({msg})',
      'error.zone': 'Zon tidak sah: {code}',
      'error.boot': 'Gagal memulakan widget'
    }
  }

  function norm(lang) {
    return lang === 'ms' ? 'ms' : 'en'
  }

  function t(key, lang, vars) {
    const table = STRINGS[norm(lang)]
    let text = table[key]
    if (text === undefined) text = STRINGS.en[key]
    if (text === undefined) return key
    if (vars) {
      Object.keys(vars).forEach(function (name) {
        text = text.split('{' + name + '}').join(String(vars[name]))
      })
    }
    return text
  }

  return { LANGS: LANGS, STRINGS: STRINGS, t: t }
})
