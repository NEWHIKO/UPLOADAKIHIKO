const fs   = require('fs')
const path = require('path')
const toMs = require('ms')

// ─────────────────────────────────────────
// Per-bot sewa storage: ./lib/database/sewa/<username>.json
// ─────────────────────────────────────────
const SEWA_DIR = path.join(__dirname, 'database', 'sewa')
fs.mkdirSync(SEWA_DIR, { recursive: true })

const sewaPath = (username) => path.join(SEWA_DIR, `${username || 'default'}.json`)

// Cache in-memory per username biar ga baca file tiap panggil
const _cache = {}

function readSewa(username) {
  username = username || 'default'
  if (_cache[username]) return _cache[username]

  const file = sewaPath(username)
  if (!fs.existsSync(file)) {
    _cache[username] = {}
    return _cache[username]
  }
  try {
    _cache[username] = JSON.parse(fs.readFileSync(file, 'utf-8'))
  } catch {
    _cache[username] = {}
  }
  return _cache[username]
}

function saveSewa(username, data) {
  username = username || 'default'
  _cache[username] = data
  const file = sewaPath(username)
  const tmp  = `${file}.tmp`
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2))
  fs.renameSync(tmp, file)
}

function reloadSewa(username) {
  delete _cache[username || 'default']
  return readSewa(username)
}

// ─────────────────────────────────────────
// Parse durasi
// ─────────────────────────────────────────
function parseSewaDuration(text) {
  if (!text) return null
  text = text.toLowerCase().trim()

  if (text === 'permanent' || text === 'permanen') return 'PERMANENT'

  const match = text.match(/^(\d+)\s*(hari|jam|menit|detik)$/)
  if (!match) return null

  const value = parseInt(match[1])
  if (value <= 0) return null

  const convert = { hari: 'd', jam: 'h', menit: 'm', detik: 's' }
  return value + convert[match[2]]
}

// ─────────────────────────────────────────
// CRUD sewa (semua per-username / per-bot)
// ─────────────────────────────────────────
function addSewa(username, groupId, durationStr) {
  const data = readSewa(username)
  const now  = Date.now()

  const expired = durationStr === 'PERMANENT'
    ? 'PERMANENT'
    : now + toMs(durationStr)

  data[groupId] = { start: now, expired, addedAt: new Date().toISOString() }
  saveSewa(username, data)
  return data[groupId]
}

function removeSewa(username, groupId) {
  const data = readSewa(username)
  if (!data[groupId]) return false
  delete data[groupId]
  saveSewa(username, data)
  return true
}

function isSewa(username, groupId) {
  return !!readSewa(username)[groupId]
}

function getSewa(username, groupId) {
  return readSewa(username)[groupId] || null
}

function tambahSewa(username, groupId, durationStr) {
  const data = readSewa(username)
  const now  = Date.now()
  const item = data[groupId]

  if (!item) return { success: false, reason: 'not_found' }
  if (item.expired === 'PERMANENT') return { success: false, reason: 'permanent' }

  const tambahan = toMs(durationStr)
  const baseTime = item.expired > now ? item.expired : now
  item.expired   = baseTime + tambahan

  saveSewa(username, data)
  return { success: true, newExpired: item.expired }
}

// ─────────────────────────────────────────
// Resolve target grup: JID aktif / raw JID / link invite
// ─────────────────────────────────────────
async function resolveGroupTarget(dino, m, args) {
  const first = args[0] || ''

  // .addsewa https://chat.whatsapp.com/xxxx 30 hari
  if (first.includes('chat.whatsapp.com')) {
    const match = first.match(/chat\.whatsapp\.com\/([A-Za-z0-9]+)/)
    if (!match) return { error: 'Link grup tidak valid' }
    try {
      const info = await dino.groupGetInviteInfo(match[1])
      if (!info?.id) return { error: 'Gagal mengambil info grup dari link' }
      return { groupId: info.id, groupName: info.subject, rest: args.slice(1) }
    } catch {
      return { error: 'Link invalid / expired / bot tidak bisa akses' }
    }
  }

  // .addsewa 120363xxxxxxxxxx@g.us 30 hari
  if (/^\d+(-\d+)?@g\.us$/.test(first)) {
    return { groupId: first, rest: args.slice(1) }
  }

  // .addsewa 30 hari  → pakai grup aktif
  if (m?.isGroup && m?.chat) {
    return { groupId: m.chat, rest: args }
  }

  return { error: 'Bukan di dalam grup. Sertakan link/JID grup atau jalankan di dalam grup.' }
}

// ─────────────────────────────────────────
// Format
// ─────────────────────────────────────────
function formatTanggalWIB(timestamp) {
  return new Date(timestamp).toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta', dateStyle: 'full', timeStyle: 'short'
  })
}

function formatSisaWaktu(ms) {
  if (!ms || ms <= 0) return 'Expired'
  const hari  = Math.floor(ms / 86400000)
  const jam   = Math.floor((ms % 86400000) / 3600000)
  const menit = Math.floor((ms % 3600000) / 60000)
  if (hari > 0)  return `${hari} Hari ${jam} Jam ${menit} Menit`
  if (jam > 0)   return `${jam} Jam ${menit} Menit`
  return `${menit} Menit`
}

function formatDurasi(ms) {
  return formatSisaWaktu(ms)
}

// ─────────────────────────────────────────
// Auto-check & auto-leave PER BOT (dipanggil oleh watcher di jadibot.js)
// ─────────────────────────────────────────
async function checkExpiredSewaForBot(dino) {
  const username = dino.username
  const data = readSewa(username)
  const now  = Date.now()
  let changed = false

  for (const groupId of Object.keys(data)) {
    const s = data[groupId]
    if (s.expired === 'PERMANENT' || now < s.expired) continue

    try {
      await dino.sendMessage(groupId, {
        text: `⚠️ 𝗠𝗮𝘀𝗮 𝘀𝗲𝘄𝗮 𝗯𝗼𝘁 𝘁𝗲𝗹𝗮𝗵 𝗵𝗮𝗯𝗶𝘀!\n\n𝗝𝗶𝗸𝗮 𝗶𝗻𝗴𝗶𝗻 𝗺𝗲𝗺𝗽𝗲𝗿𝗽𝗮𝗻𝗷𝗮𝗻𝗴, 𝘀𝗶𝗹𝗮𝗸𝗮𝗻 𝗵𝘂𝗯𝘂𝗻𝗴𝗶 𝗼𝘄𝗻𝗲𝗿.\n\n𝗕𝗼𝘁 𝗮𝗸𝗮𝗻 𝗸𝗲𝗹𝘂𝗮𝗿 𝗱𝗮𝗿𝗶 𝗴𝗿𝘂𝗽 𝗶𝗻𝗶.`
      })
      await new Promise(r => setTimeout(r, 2000))
      await dino.groupLeave(groupId)
      console.log(`[sewa][${username}] keluar dari grup expired: ${groupId}`)
      delete data[groupId]
      changed = true
    } catch (e) {
      const code = e?.output?.statusCode
      if (code === 403 || code === 404 || /not.*participant/i.test(e?.message || '')) {
        // Bot memang sudah bukan member → langsung hapus record, ga usah retry
        delete data[groupId]
        changed = true
      }
      // Error lain (network dll) → biarkan, retry tick berikutnya
    }
  }

  if (changed) saveSewa(username, data)
}

/**
 * Start interval auto-check per bot. Idempotent — aman dipanggil ulang saat reconnect.
 * Return { stop() }
 */
function startSewaWatcher(dino, intervalMs = 60_000) {
  if (dino._sewaWatcher) return dino._sewaWatcher // sudah jalan, jangan duplikat

  const timer = setInterval(() => {
    checkExpiredSewaForBot(dino).catch(e => console.error('[sewa] watcher error:', e.message))
  }, intervalMs)

  // jalankan sekali di awal juga
  checkExpiredSewaForBot(dino).catch(() => {})

  dino._sewaWatcher = {
    stop() {
      clearInterval(timer)
      dino._sewaWatcher = null
    }
  }
  return dino._sewaWatcher
}

module.exports = {
  readSewa,
  saveSewa,
  reloadSewa,
  addSewa,
  removeSewa,
  tambahSewa,
  isSewa,
  getSewa,
  parseSewaDuration,
  resolveGroupTarget,
  formatTanggalWIB,
  formatSisaWaktu,
  formatDurasi,
  checkExpiredSewaForBot,
  startSewaWatcher,
}