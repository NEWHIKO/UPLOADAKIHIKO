/**
 * Helper untuk apply config dan auto-sync idch
 */

const { applyConfigToGlobal } = require('../config')
const { getDatabase } = require('../db')
const { findUserDocLocation } = require('./loadCustomConfig')

/**
 * Apply user config dan auto-update idch jika ch berubah
 * @param {Object} customConfig - Custom config dari database
 * @param {Object} targetConfig - Target config object (sock.config atau global)
 */
function applyUserConfig(customConfig, targetConfig = null) {
  const { getConfigSchema } = require('../config')
  const schema = getConfigSchema()
  
  // Target config (default ke global jika tidak disediakan)
  const config = targetConfig || global
  
  // Apply default values dari schema
  for (const [key, entry] of Object.entries(schema)) {
    config[key] = entry.value
  }
  
  // Apply custom config
  if (customConfig && Object.keys(customConfig).length > 0) {
    Object.assign(config, customConfig)
  }
  
  // ✅ AUTO-UPDATE idch jika ch SUDAH dalam format @newsletter.
  // Kalau ch masih berupa link, idch TIDAK bisa di-resolve tanpa koneksi WA
  // (newsletterMetadata). Resolve link dilakukan di jadibot.js saat sock 'open'.
  if (config.ch && config.ch.includes('@newsletter')) {
    config.idch = config.ch
    if (!targetConfig && global.configSchema && global.configSchema.idch) {
      global.configSchema.idch.value = config.ch
    }
    console.log(`[ConfigHelper] Set idch dari ch (@newsletter): ${config.ch}`)
  }
  
  return config
}

/**
 * Ambil invite code dari link channel WhatsApp.
 * @param {string} ch
 * @returns {string|null}
 */
function extractInviteCode(ch) {
  if (!ch || typeof ch !== 'string') return null
  let code = ch.split('/channel/')[1]
  if (!code) {
    const match = ch.match(/whatsapp\.com\/channel\/([A-Za-z0-9_-]+)/i)
    code = match && match[1] ? match[1] : null
  }
  if (code) {
    code = code.split('/')[0].split('?')[0].split('#')[0].trim()
  }
  return code || null
}

/**
 * Resolve idch dari ch link via newsletterMetadata.
 * Mengembalikan ID hasil resolve, atau `null` kalau GAGAL (biar caller yang
 * menentukan fallback). ch yang sudah @newsletter dikembalikan apa adanya.
 *
 * @param {string} ch - Channel link atau ID @newsletter
 * @param {Object} [sock] - Koneksi WA (punya newsletterMetadata)
 * @returns {Promise<string|null>} - ID hasil resolve, atau null jika gagal
 */
async function extractIdchFromCh(ch, sock = null) {
  if (!ch || typeof ch !== 'string') return null

  // Sudah format @newsletter → pakai langsung
  if (ch.includes('@newsletter')) return ch

  const inviteCode = extractInviteCode(ch)
  if (!inviteCode) return null

  // Resolve akurat via newsletterMetadata
  if (sock && typeof sock.newsletterMetadata === 'function') {
    try {
      const metadata = await sock.newsletterMetadata('invite', inviteCode)
      if (metadata && metadata.id) return metadata.id
    } catch (e) {
      console.warn('[extractIdchFromCh] newsletterMetadata gagal:', e.message)
    }
  } else {
    console.warn('[extractIdchFromCh] sock.newsletterMetadata tidak tersedia')
  }

  // Gagal resolve
  return null
}

/** Ambil idch default dari config schema (fallback). */
function getDefaultIdch() {
  try {
    const { getConfigSchema } = require('../config')
    return getConfigSchema()?.idch?.value || global.idch || null
  } catch {
    return global.idch || null
  }
}

/**
 * Simpan idch (+ ch asalnya) ke config user di MongoDB, ke dokumen & collection
 * yang sama persis tempat user ditemukan. TIDAK menyentuh backend, hanya
 * nambah/ubah field di dokumen yang sudah ada (upsert:false).
 *
 * `config.idchFrom` = link ch yang menghasilkan idch → dipakai untuk deteksi
 * perubahan ch di reconnect berikutnya.
 *
 * @param {string} username
 * @param {string} idch
 * @param {string} [fromCh] - link ch sumber idch
 */
async function persistIdch(username, idch, fromCh = null) {
  if (!username || !idch) return
  try {
    const loc = await findUserDocLocation(username)
    if (!loc || !loc.collectionName || !loc.filter) {
      console.warn('[persistIdch] lokasi dokumen user tidak ditemukan')
      return
    }
    const database = await getDatabase()
    const set = { 'config.idch': idch }
    if (fromCh) set['config.idchFrom'] = fromCh
    await database.collection(loc.collectionName).updateOne(
      loc.filter,
      { $set: set },
      { upsert: false }
    )
    console.log(`[persistIdch] 💾 config.idch tersimpan untuk ${username}: ${idch}`)
  } catch (e) {
    console.warn('[persistIdch] error:', e.message)
  }
}

/**
 * Sync idch untuk sebuah sock saat bot online.
 *
 * Alur SEDERHANA (idch disimpan langsung di config, + config.idchFrom untuk
 * deteksi perubahan ch — tanpa cache terpisah):
 *   - ch berupa @newsletter                    → idch = ch
 *   - idch valid & idchFrom === ch (ch tak berubah) → PAKAI (tidak resolve, anti rate-limit)
 *   - ch berubah / belum ada idch              → resolve via metadata → simpan idch + idchFrom
 *   - resolve gagal                            → pakai default sementara (tidak disimpan)
 *
 * @param {Object} sock - Koneksi WA (punya .config, .newsletterMetadata)
 * @param {string} username
 * @returns {Promise<string|null>} idch final
 */
async function syncIdchForSock(sock, username) {
  if (!sock || !sock.config) return null
  const ch = sock.config.ch

  // ch sudah @newsletter → langsung pakai
  if (ch && ch.includes('@newsletter')) {
    sock.config.idch = ch
    return ch
  }

  // idch tersimpan valid DAN ch TIDAK berubah (idchFrom === ch) → pakai lama.
  // Ini yang mencegah spam newsletterMetadata (anti rate-limit).
  if (
    sock.config.idch &&
    String(sock.config.idch).includes('@newsletter') &&
    sock.config.idchFrom === ch
  ) {
    return sock.config.idch
  }

  // ch berubah / belum pernah resolve → resolve sekali lalu simpan ke Mongo
  if (ch) {
    const resolved = await extractIdchFromCh(ch, sock)
    if (resolved) {
      // Resolve SUKSES → set + simpan permanen (idch + idchFrom=ch),
      // supaya reconnect berikutnya tidak resolve ulang selama ch sama.
      sock.config.idch = resolved
      sock.config.idchFrom = ch
      persistIdch(username, resolved, ch).catch(() => {})
      return resolved
    }
    // Resolve GAGAL → pakai idch lama kalau ada, kalau tidak default config.
    // JANGAN simpan → supaya reconnect berikutnya mencoba resolve lagi.
    const fallback = (sock.config.idch && String(sock.config.idch).includes('@newsletter'))
      ? sock.config.idch
      : getDefaultIdch()
    if (fallback) sock.config.idch = fallback
    return sock.config.idch || null
  }
  return sock.config.idch || null
}

/**
 * Save config dan auto-update idch ke database
 * Gunakan ini setelah user update config via API
 * @param {string} username - Username
 * @param {Object} newConfig - New config to save
 * @param {Object} [sock] - Koneksi WA (opsional, untuk resolve idch langsung)
 * @returns {Promise<Object>} - Updated config dengan idch
 */
async function saveConfigWithAutoSync(username, newConfig, sock = null) {
  // Kalau ch berubah, kosongkan idch supaya di-resolve ulang saat bot online.
  // Kalau sock tersedia, resolve langsung.
  if (newConfig.ch) {
    if (sock) {
      const newIdch = await extractIdchFromCh(newConfig.ch, sock)
      if (newIdch) {
        newConfig.idch = newIdch
        newConfig.idchFrom = newConfig.ch
        console.log(`[SaveConfig] Auto-synced idch for ${username}: ${newIdch}`)
      }
    } else {
      // Tidak ada koneksi WA di sini → kosongkan idch & idchFrom supaya di-resolve
      // ulang saat bot online (jadibot open).
      newConfig.idch = null
      newConfig.idchFrom = null
    }
  }
  
  return newConfig
}

// Set ke global
global.applyUserConfig = applyUserConfig
global.extractIdchFromCh = extractIdchFromCh
global.saveConfigWithAutoSync = saveConfigWithAutoSync
global.syncIdchForSock = syncIdchForSock

module.exports = {
  applyUserConfig,
  extractIdchFromCh,
  extractInviteCode,
  persistIdch,
  syncIdchForSock,
  saveConfigWithAutoSync
}
