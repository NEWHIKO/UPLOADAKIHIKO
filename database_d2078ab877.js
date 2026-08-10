/**
 * lib/database.js
 * Per-user database system
 *
 * Struktur: lib/database/databasevionyx/<username>.json
 *
 * Cara kerja:
 * - Lazy load: baca file hanya sekali, simpan di memory cache
 * - Flush otomatis: setiap message masuk panggil markDirty()
 *   → flush ke disk max 1x per 30 detik (debounce)
 * - Tidak pakai Proxy: nested mutation (db.users[x].exp += 1) langsung
 *   masuk ke memory karena db adalah reference ke object yang sama
 * - Atomic write: tulis ke .tmp dulu lalu rename
 * - Backup: simpan satu file backup sebelum overwrite
 */

const fs   = require('fs')
const path = require('path')

const DB_DIR          = path.join(__dirname, 'database', 'databasevionyx')
const FLUSH_DELAY_MS  = 30_000   // flush ke disk max 1x per 30 detik per user

// Cache: { [username]: { data: Object, dirty: boolean, timer: Timeout|null } }
const cache = {}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const dbPath       = u => path.join(DB_DIR, `${u}.json`)
const dbBackupPath = u => path.join(DB_DIR, `${u}.backup.json`)
const EMPTY_DB     = () => ({ users: {}, groups: {}, antilink: {}, sewa: {} })

function readFile(username) {
    const file   = dbPath(username)
    const backup = dbBackupPath(username)

    if (fs.existsSync(file)) {
        try {
            return JSON.parse(fs.readFileSync(file, 'utf-8'))
        } catch (e) {
            console.error(`[DB] ${username}.json corrupt — restore dari backup`)
            if (fs.existsSync(backup)) {
                try {
                    const data = JSON.parse(fs.readFileSync(backup, 'utf-8'))
                    fs.writeFileSync(file, JSON.stringify(data, null, 2))
                    console.warn(`[DB] ${username}: restored dari backup`)
                    return data
                } catch {}
            }
            try { fs.renameSync(file, `${file}.corrupt.${Date.now()}`) } catch {}
        }
    }

    // File tidak ada / corrupt → buat fresh
    const empty = EMPTY_DB()
    fs.mkdirSync(DB_DIR, { recursive: true })
    fs.writeFileSync(file, JSON.stringify(empty, null, 2))
    return empty
}

function flushToDisk(username) {
    const entry = cache[username]
    if (!entry || !entry.dirty) return

    try {
        const file = dbPath(username)
        const tmp  = `${file}.tmp`
        const replacer = (key, val) => key === 'data' ? undefined : val
        fs.writeFileSync(tmp, JSON.stringify(entry.data, replacer, 2))
        if (fs.existsSync(file)) fs.copyFileSync(file, dbBackupPath(username))
        fs.renameSync(tmp, file)
        entry.dirty = false
    } catch (e) {
        console.error(`[DB] Gagal flush ${username}:`, e.message)
    }
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Load database user dari cache (O(1)) atau disk (pertama kali).
 * Return reference ke object data — perubahan langsung masuk ke memory.
 */
function loadUserDB(username) {
    if (!username) username = 'default'
    if (!cache[username]) {
        const data = readFile(username)
        cache[username] = { data, dirty: false, timer: null }
        console.log(`[DB] Loaded: ${username}.json`)
    }
    return cache[username].data
}

/**
 * Tandai database dirty → akan flush ke disk dalam 30 detik.
 * Panggil ini setiap message masuk — cukup, karena flush di-debounce.
 */
function markDirty(username) {
    if (!username) username = 'default'
    const entry = cache[username]
    if (!entry) return

    entry.dirty = true
    if (entry.timer) clearTimeout(entry.timer)
    entry.timer = setTimeout(() => {
        flushToDisk(username)
        entry.timer = null
    }, FLUSH_DELAY_MS)
}

/**
 * Flush semua user yang dirty sekarang juga.
 * Untuk graceful shutdown.
 */
function flushAll() {
    for (const u of Object.keys(cache)) {
        if (cache[u]?.dirty) {
            if (cache[u].timer) { clearTimeout(cache[u].timer); cache[u].timer = null }
            flushToDisk(u)
        }
    }
    console.log('[DB] All databases flushed')
}

/**
 * Setup global.db dan global.saveDB untuk satu username.
 * global.db = reference langsung ke object data (BUKAN Proxy)
 * sehingga nested mutation db.users[x].y = z langsung masuk ke memory.
 * Flush ke disk dilakukan oleh markDirty() yang dipanggil tiap message.
 */
function setupGlobalDB(username) {
    if (!username) username = 'default'
    const data = loadUserDB(username)
    global.db              = data   // reference langsung
    global.db.data         = data   // alias: global.db.data.users === global.db.users
    global.saveDB          = () => { markDirty(username); flushToDisk(username) }
    global._currentDBUser  = username
}

// ─── Background flush & shutdown ─────────────────────────────────────────────

// Safety net: flush semua dirty tiap 30 detik
setInterval(() => {
    for (const u of Object.keys(cache)) {
        if (cache[u]?.dirty) flushToDisk(u)
    }
}, FLUSH_DELAY_MS)

process.on('SIGINT',  () => { flushAll(); process.exit(0) })
process.on('SIGTERM', () => { flushAll(); process.exit(0) })

// Buat folder kalau belum ada
fs.mkdirSync(DB_DIR, { recursive: true })

module.exports = { loadUserDB, markDirty, flushToDisk, flushAll, setupGlobalDB }