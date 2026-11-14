'use strict'

/**
 * 60 zon rasmi JAKIM e-Solat (diambil daripada senarai pilihan di e-solat.gov.my).
 * lat/lon ialah titik anggaran pusat zon, digunakan untuk memilih zon terdekat
 * apabila lokasi IP tidak sepadan dengan nama daerah dalam label zon.
 */

const STATES = {
  JHR: 'Johor',
  KDH: 'Kedah',
  KTN: 'Kelantan',
  MLK: 'Melaka',
  NGS: 'Negeri Sembilan',
  PHG: 'Pahang',
  PLS: 'Perlis',
  PNG: 'Pulau Pinang',
  PRK: 'Perak',
  SBH: 'Sabah',
  SGR: 'Selangor',
  SWK: 'Sarawak',
  TRG: 'Terengganu',
  WLY: 'Wilayah Persekutuan'
}

const ZONES = [
  { code: 'JHR01', label: 'Pulau Aur dan Pulau Pemanggil', lat: 2.45, lon: 104.52 },
  { code: 'JHR02', label: 'Johor Bahru, Kota Tinggi, Mersing, Kulai', lat: 1.55, lon: 103.76 },
  { code: 'JHR03', label: 'Kluang, Pontian', lat: 1.85, lon: 103.3 },
  { code: 'JHR04', label: 'Batu Pahat, Muar, Segamat, Gemas Johor, Tangkak', lat: 2.05, lon: 102.75 },
  { code: 'KDH01', label: 'Kota Setar, Kubang Pasu, Pokok Sena (Daerah Kecil)', lat: 6.2, lon: 100.4 },
  { code: 'KDH02', label: 'Kuala Muda, Yan, Pendang', lat: 5.7, lon: 100.4 },
  { code: 'KDH03', label: 'Padang Terap, Sik', lat: 6.1, lon: 100.75 },
  { code: 'KDH04', label: 'Baling', lat: 5.68, lon: 100.92 },
  { code: 'KDH05', label: 'Bandar Baharu, Kulim', lat: 5.4, lon: 100.55 },
  { code: 'KDH06', label: 'Langkawi', lat: 6.35, lon: 99.8 },
  { code: 'KDH07', label: 'Puncak Gunung Jerai', lat: 5.79, lon: 100.43 },
  { code: 'KTN01', label: 'Bachok, Kota Bharu, Machang, Pasir Mas, Pasir Puteh, Tanah Merah, Tumpat, Kuala Krai, Mukim Chiku', lat: 6.05, lon: 102.25 },
  { code: 'KTN02', label: 'Gua Musang (Daerah Galas Dan Bertam), Jeli, Jajahan Kecil Lojing', lat: 5.2, lon: 101.9 },
  { code: 'MLK01', label: 'Seluruh Negeri Melaka', lat: 2.2, lon: 102.25 },
  { code: 'NGS01', label: 'Tampin, Jempol', lat: 2.55, lon: 102.35 },
  { code: 'NGS02', label: 'Jelebu, Kuala Pilah, Rembau', lat: 2.75, lon: 102.1 },
  { code: 'NGS03', label: 'Port Dickson, Seremban', lat: 2.72, lon: 101.94 },
  { code: 'PHG01', label: 'Pulau Tioman', lat: 2.79, lon: 104.17 },
  { code: 'PHG02', label: 'Kuantan, Pekan, Muadzam Shah', lat: 3.8, lon: 103.33 },
  { code: 'PHG03', label: 'Jerantut, Temerloh, Maran, Bera, Chenor, Jengka', lat: 3.6, lon: 102.4 },
  { code: 'PHG04', label: 'Bentong, Lipis, Raub', lat: 3.75, lon: 101.8 },
  { code: 'PHG05', label: 'Genting Sempah, Janda Baik, Bukit Tinggi', lat: 3.4, lon: 101.8 },
  { code: 'PHG06', label: 'Cameron Highlands, Genting Highlands, Bukit Fraser', lat: 4.47, lon: 101.4 },
  { code: 'PHG07', label: 'Daerah Rompin (Mukim Rompin, Endau, Pontian)', lat: 2.85, lon: 103.3 },
  { code: 'PLS01', label: 'Kangar, Padang Besar, Arau', lat: 6.44, lon: 100.2 },
  { code: 'PNG01', label: 'Seluruh Negeri Pulau Pinang', lat: 5.4, lon: 100.3 },
  { code: 'PRK01', label: 'Tapah, Slim River, Tanjung Malim', lat: 4.0, lon: 101.35 },
  { code: 'PRK02', label: 'Kuala Kangsar, Sg. Siput, Ipoh, Batu Gajah, Kampar', lat: 4.6, lon: 101.08 },
  { code: 'PRK03', label: 'Lenggong, Pengkalan Hulu, Grik', lat: 5.1, lon: 101.1 },
  { code: 'PRK04', label: 'Temengor, Belum', lat: 5.5, lon: 101.5 },
  { code: 'PRK05', label: 'Kg Gajah, Teluk Intan, Bagan Datuk, Seri Iskandar, Beruas, Parit, Lumut, Sitiawan, Pulau Pangkor', lat: 4.2, lon: 100.85 },
  { code: 'PRK06', label: 'Selama, Taiping, Bagan Serai, Parit Buntar', lat: 4.85, lon: 100.65 },
  { code: 'PRK07', label: 'Bukit Larut', lat: 4.86, lon: 100.78 },
  { code: 'SBH01', label: 'Bahagian Sandakan (Timur), Bukit Garam, Semawang, Temanggong, Tambisan, Bandar Sandakan, Sukau', lat: 5.84, lon: 118.12 },
  { code: 'SBH02', label: 'Beluran, Telupid, Pinangah, Terusan, Kuamut, Bahagian Sandakan (Barat)', lat: 5.6, lon: 117.2 },
  { code: 'SBH03', label: 'Lahad Datu, Silabukan, Kunak, Sahabat, Semporna, Tungku, Bahagian Tawau (Timur)', lat: 4.8, lon: 118.2 },
  { code: 'SBH04', label: 'Bandar Tawau, Balong, Merotai, Kalabakan, Bahagian Tawau (Barat)', lat: 4.25, lon: 117.9 },
  { code: 'SBH05', label: 'Kudat, Kota Marudu, Pitas, Pulau Banggi, Bahagian Kudat', lat: 6.7, lon: 116.85 },
  { code: 'SBH06', label: 'Gunung Kinabalu', lat: 6.08, lon: 116.55 },
  { code: 'SBH07', label: 'Kota Kinabalu, Ranau, Kota Belud, Tuaran, Penampang, Papar, Putatan, Bahagian Pantai Barat', lat: 5.9, lon: 116.1 },
  { code: 'SBH08', label: 'Pensiangan, Keningau, Tambunan, Nabawan, Bahagian Pendalaman (Atas)', lat: 5.3, lon: 116.3 },
  { code: 'SBH09', label: 'Beaufort, Kuala Penyu, Sipitang, Tenom, Long Pasia, Membakut, Weston, Bahagian Pendalaman (Bawah)', lat: 5.1, lon: 115.6 },
  { code: 'SGR01', label: 'Gombak, Petaling, Sepang, Hulu Langat, Hulu Selangor, S.Alam', lat: 3.1, lon: 101.6 },
  { code: 'SGR02', label: 'Kuala Selangor, Sabak Bernam', lat: 3.4, lon: 101.2 },
  { code: 'SGR03', label: 'Klang, Kuala Langat', lat: 2.95, lon: 101.4 },
  { code: 'SWK01', label: 'Limbang, Lawas, Sundar, Trusan', lat: 4.5, lon: 115.2 },
  { code: 'SWK02', label: 'Miri, Niah, Bekenu, Sibuti, Marudi', lat: 4.2, lon: 114.0 },
  { code: 'SWK03', label: 'Pandan, Belaga, Suai, Tatau, Sebauh, Bintulu', lat: 3.0, lon: 113.3 },
  { code: 'SWK04', label: 'Sibu, Mukah, Dalat, Song, Igan, Oya, Balingian, Kanowit, Kapit', lat: 2.4, lon: 112.3 },
  { code: 'SWK05', label: 'Sarikei, Matu, Julau, Rajang, Daro, Bintangor, Belawai', lat: 1.9, lon: 111.4 },
  { code: 'SWK06', label: 'Lubok Antu, Sri Aman, Roban, Debak, Kabong, Lingga, Engkelili, Betong, Spaoh, Pusa, Saratok', lat: 1.4, lon: 111.3 },
  { code: 'SWK07', label: 'Serian, Simunjan, Samarahan, Sebuyau, Meludam', lat: 1.15, lon: 110.5 },
  { code: 'SWK08', label: 'Kuching, Bau, Lundu, Sematan', lat: 1.5, lon: 110.15 },
  { code: 'SWK09', label: 'Zon Khas (Kampung Patarikan)', lat: 4.6, lon: 115.0 },
  { code: 'TRG01', label: 'Kuala Terengganu, Marang, Kuala Nerus', lat: 5.33, lon: 103.13 },
  { code: 'TRG02', label: 'Besut, Setiu', lat: 5.6, lon: 102.6 },
  { code: 'TRG03', label: 'Hulu Terengganu', lat: 5.05, lon: 102.9 },
  { code: 'TRG04', label: 'Dungun, Kemaman', lat: 4.5, lon: 103.2 },
  { code: 'WLY01', label: 'Kuala Lumpur, Putrajaya', lat: 3.14, lon: 101.69 },
  { code: 'WLY02', label: 'Labuan', lat: 5.28, lon: 115.24 }
].map(function (z) {
  z.state = STATES[z.code.slice(0, 3)]
  z.stateCode = z.code.slice(0, 3)
  return z
})

const BY_CODE = Object.create(null)
ZONES.forEach(function (z) { BY_CODE[z.code] = z })

const STATE_ALIASES = {
  johor: 'JHR',
  kedah: 'KDH',
  kelantan: 'KTN',
  melaka: 'MLK',
  malacca: 'MLK',
  'negeri sembilan': 'NGS',
  'negeri sembilan darul khusus': 'NGS',
  pahang: 'PHG',
  perlis: 'PLS',
  'pulau pinang': 'PNG',
  penang: 'PNG',
  perak: 'PRK',
  sabah: 'SBH',
  selangor: 'SGR',
  sarawak: 'SWK',
  terengganu: 'TRG',
  'kuala lumpur': 'WLY',
  'wp kuala lumpur': 'WLY',
  'wilayah persekutuan kuala lumpur': 'WLY',
  putrajaya: 'WLY',
  labuan: 'WLY',
  'wp labuan': 'WLY',
  'wilayah persekutuan': 'WLY'
}

// Perkataan yang terlalu umum untuk dijadikan pemadan nama zon.
const STOPWORDS = {
  bandar: 1, baru: 1, jaya: 1, town: 1, city: 1, district: 1, area: 1,
  kampung: 1, kg: 1, taman: 1, seksyen: 1, mukim: 1, daerah: 1, jajahan: 1,
  bahagian: 1, kuala: 1, hulu: 1, hilir: 1, selatan: 1, utara: 1, timur: 1,
  barat: 1, tengah: 1, kecil: 1, seluruh: 1, negeri: 1, pulau: 1, 'new': 1
}

function normalizeText(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function stateFromName(name) {
  const n = normalizeText(name)
  if (!n) return null
  if (STATE_ALIASES[n]) return STATE_ALIASES[n]
  // Cuba padan perkataan demi perkataan ("Selangor Darul Ehsan").
  const words = n.split(' ')
  for (let len = Math.min(3, words.length); len >= 1; len--) {
    for (let i = 0; i + len <= words.length; i++) {
      const chunk = words.slice(i, i + len).join(' ')
      if (STATE_ALIASES[chunk]) return STATE_ALIASES[chunk]
    }
  }
  return null
}

function distanceKm(aLat, aLon, bLat, bLon) {
  const R = 6371
  const toRad = Math.PI / 180
  const dLat = (bLat - aLat) * toRad
  const dLon = (bLon - aLon) * toRad
  const h = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(aLat * toRad) * Math.cos(bLat * toRad) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)))
}

function labelTokens(zone) {
  return normalizeText(zone.label).split(' ').filter(function (w) {
    return w.length >= 4 && !STOPWORDS[w]
  })
}

/**
 * Pilih zon JAKIM yang paling munasabah untuk hasil geolokasi IP.
 * Strategi: (1) tapis mengikut negeri, (2) padan nama bandar dengan label zon,
 * (3) zon terdekat secara koordinat, (4) zon pertama negeri tersebut.
 */
function pickZone(geo) {
  if (!geo) return null
  const stateCode = stateFromName(geo.region) || stateFromName(geo.state)
  let pool = stateCode ? ZONES.filter(function (z) { return z.stateCode === stateCode }) : ZONES.slice()
  if (!pool.length) pool = ZONES.slice()

  const cityTokens = normalizeText(geo.city).split(' ').filter(function (w) {
    return w.length >= 4 && !STOPWORDS[w]
  })

  let best = null
  let bestScore = 0
  if (cityTokens.length) {
    for (let i = 0; i < pool.length; i++) {
      const tokens = labelTokens(pool[i])
      let score = 0
      for (let j = 0; j < cityTokens.length; j++) {
        if (tokens.indexOf(cityTokens[j]) !== -1) score += cityTokens[j].length
      }
      if (score > bestScore) {
        bestScore = score
        best = pool[i]
      }
    }
  }
  if (best) return { zone: best, via: 'name', stateCode: stateCode }

  const lat = Number(geo.lat)
  const lon = Number(geo.lon)
  if (Number.isFinite(lat) && Number.isFinite(lon)) {
    let nearest = null
    let nearestD = Infinity
    for (let i = 0; i < ZONES.length; i++) {
      const d = distanceKm(lat, lon, ZONES[i].lat, ZONES[i].lon)
      // Beri keutamaan sedikit kepada zon dalam negeri yang sama.
      const weight = stateCode && ZONES[i].stateCode === stateCode ? 0 : 80
      if (d + weight < nearestD) {
        nearestD = d + weight
        nearest = ZONES[i]
      }
    }
    if (nearest) return { zone: nearest, via: 'distance', stateCode: stateCode }
  }

  return { zone: pool[0], via: 'state', stateCode: stateCode }
}

function byCode(code) {
  return BY_CODE[String(code || '').toUpperCase()] || null
}

function search(query) {
  const q = normalizeText(query)
  if (!q) return ZONES.slice()
  return ZONES.filter(function (z) {
    return normalizeText(z.code + ' ' + z.state + ' ' + z.label).indexOf(q) !== -1
  })
}

function minimal() {
  return ZONES.map(function (z) {
    return { code: z.code, state: z.state, label: z.label }
  })
}

function displayName(code) {
  const z = byCode(code)
  if (!z) return code || ''
  return z.code + ' · ' + z.label
}

module.exports = {
  STATES: STATES,
  ZONES: ZONES,
  byCode: byCode,
  search: search,
  minimal: minimal,
  displayName: displayName,
  pickZone: pickZone,
  stateFromName: stateFromName,
  distanceKm: distanceKm,
  normalizeText: normalizeText
}
