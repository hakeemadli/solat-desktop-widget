'use strict'

const { net } = require('electron')
const zones = require('./zones')

const TIMEOUT_MS = 10000

/**
 * Tiga pembekal geolokasi IP percuma (tanpa kunci API), dicuba satu demi satu.
 * Tiada satu pun yang memberi koordinat tepat, jadi hasil ini hanya untuk
 * memilih zon JAKIM lalai — pengguna sentiasa boleh tukar secara manual.
 */
const PROVIDERS = [
  {
    name: 'ipwho.is',
    url: 'https://ipwho.is/',
    parse: function (j) {
      if (!j || j.success === false) return null
      return { country: j.country_code, region: j.region, city: j.city, lat: j.latitude, lon: j.longitude }
    }
  },
  {
    name: 'ipapi.co',
    url: 'https://ipapi.co/json/',
    parse: function (j) {
      if (!j || j.error) return null
      return { country: j.country_code, region: j.region, city: j.city, lat: j.latitude, lon: j.longitude }
    }
  },
  {
    name: 'ip-api.com',
    url: 'http://ip-api.com/json/?fields=status,countryCode,regionName,city,lat,lon',
    parse: function (j) {
      if (!j || j.status !== 'success') return null
      return { country: j.countryCode, region: j.regionName, city: j.city, lat: j.lat, lon: j.lon }
    }
  }
]

async function lookup() {
  for (const provider of PROVIDERS) {
    try {
      const res = await net.fetch(provider.url, {
        headers: { 'User-Agent': 'SolatWidget/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(TIMEOUT_MS)
      })
      if (!res.ok) throw new Error('HTTP ' + res.status)
      const json = await res.json()
      const geo = provider.parse(json)
      if (geo && geo.country) {
        return Object.assign(geo, { provider: provider.name })
      }
    } catch (err) {
      console.warn('[geo] ' + provider.name + ' gagal: ' + err.message)
    }
  }
  return null
}

/**
 * Kesan lokasi dan cadangkan zon JAKIM.
 * @returns {{geo: object|null, zone: object|null, reason: string}}
 */
async function detect() {
  const geo = await lookup()
  if (!geo) return { geo: null, zone: null, reason: 'offline' }
  if (String(geo.country).toUpperCase() !== 'MY') {
    return { geo: geo, zone: null, reason: 'outside-malaysia' }
  }
  const picked = zones.pickZone(geo)
  if (!picked || !picked.zone) return { geo: geo, zone: null, reason: 'no-match' }
  return {
    geo: geo,
    zone: picked.zone,
    via: picked.via,
    reason: 'ok'
  }
}

module.exports = { lookup: lookup, detect: detect }
