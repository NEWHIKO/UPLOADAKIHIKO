/**
 * lib/autostart.js
 *
 * Auto-start semua bot yang sudah punya session valid saat server restart.
 *
 * CHANGELOG v2:
 * - Fix: scan + cleanup session tidak valid sebelum start
 * - Fix: skip session yang creds.registered=false (pairing tidak selesai)
 * - Fix: delay antar bot dinaikkan ke 4 detik
 * - Fix: tidak crash kalau ada folder yang rusak
 */

const fs   = require('fs')
const path = require('path')

const SESSIONS_DIR  = path.join(__dirname, '..', 'sessions')
const START_DELAY_MS = 4000   // 4 detik antar bot

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Session "ready" = punya lebih dari 1 file DAN ada file selain creds.json
 * (pre-key store sudah ada → pairing pernah selesai).
 */
function isSessionReady(sessionDir) {
    try {
        if (!fs.existsSync(sessionDir)) return false
        const files = fs.readdirSync(sessionDir).filter(f => {
            try { return fs.statSync(path.join(sessionDir, f)).isFile() } catch { return false }
        })
        return files.length > 1 && files.some(f => f !== 'creds.json')
    } catch {
        return false
    }
}

/**
 * Cek apakah session folder punya creds yang sudah registered.
 * Ini validasi tambahan — session bisa punya banyak file tapi creds belum registered
 * kalau proses pairing pernah sebagian berjalan lalu gagal.
 *
 * @returns {'valid' | 'incomplete' | 'missing'}
 */
function checkSessionValidity(sessionDir) {
    const credsPath = path.join(sessionDir, 'creds.json')

    if (!fs.existsSync(credsPath)) return 'missing'

    try {
        const raw   = fs.readFileSync(credsPath, 'utf-8')
        const creds = JSON.parse(raw)

        // Creds valid = sudah registered DAN punya info 'me' (phone number)
        if (creds.registered === true && creds.me?.id) return 'valid'

        // Creds ada tapi belum registered → pairing tidak selesai
        return 'incomplete'
    } catch {
        // File rusak / tidak valid JSON
        return 'missing'
    }
}

/**
 * Hapus session folder dengan aman.
 */
function safeDeleteSession(sessionDir, label) {
    try {
        fs.rmSync(sessionDir, { recursive: true, force: true })
        console.log(`[autostart] 🗑️  Session dihapus (tidak valid): ${label}`)
    } catch (e) {
        console.warn(`[autostart] Gagal hapus ${label}:`, e.message)
    }
}

// ─── scanSessions ─────────────────────────────────────────────────────────────

/**
 * Scan semua session dan kembalikan list yang siap di-start.
 * Session tidak valid (incomplete/missing) akan DIHAPUS otomatis
 * supaya tidak menumpuk dan tidak muncul di autostart selanjutnya.
 *
 * @returns {{ username: string, phoneNumber: string }[]}
 */
function scanSessions() {
    const result = []

    if (!fs.existsSync(SESSIONS_DIR)) {
        console.log('[autostart] Sessions folder tidak ada:', SESSIONS_DIR)
        return result
    }

    let totalScanned   = 0
    let totalValid     = 0
    let totalCleaned   = 0
    let totalSkipped   = 0

    try {
        const usernames = fs.readdirSync(SESSIONS_DIR)

        for (const username of usernames) {
            const userDir = path.join(SESSIONS_DIR, username)
            try {
                if (!fs.statSync(userDir).isDirectory()) continue
            } catch { continue }

            try {
                const phones = fs.readdirSync(userDir)

                for (const phone of phones) {
                    const sessionDir = path.join(userDir, phone)
                    totalScanned++

                    try {
                        if (!fs.statSync(sessionDir).isDirectory()) continue
                    } catch { continue }

                    // ── Cek 1: apakah session punya file yang cukup ─────────
                    if (!isSessionReady(sessionDir)) {
                        console.log(`[autostart] ⚠️  ${username}/${phone} — tidak ada file session, skip`)
                        totalSkipped++
                        continue
                    }

                    // ── Cek 2: apakah creds sudah registered ────────────────
                    const validity = checkSessionValidity(sessionDir)

                    if (validity === 'valid') {
                        result.push({ username, phoneNumber: phone })
                        totalValid++
                        console.log(`[autostart] ✅ ${username}/${phone} — valid, akan di-start`)
                    } else if (validity === 'incomplete') {
                        // Pairing tidak pernah selesai → hapus
                        safeDeleteSession(sessionDir, `${username}/${phone}`)
                        totalCleaned++
                    } else {
                        // creds.json missing / rusak → hapus
                        safeDeleteSession(sessionDir, `${username}/${phone} (invalid creds)`)
                        totalCleaned++
                    }
                }
            } catch (e) {
                console.warn(`[autostart] Error scanning ${userDir}:`, e.message)
            }
        }
    } catch (e) {
        console.warn('[autostart] Error scanning sessions:', e.message)
    }

    console.log(`[autostart] Scan selesai — total: ${totalScanned}, valid: ${totalValid}, dibersihkan: ${totalCleaned}, dilewati: ${totalSkipped}`)
    return result
}

// ─── autoStartBots ────────────────────────────────────────────────────────────

/**
 * Auto-start semua bot yang session-nya valid.
 * Dipanggil sekali saat server.js start.
 */
async function autoStartBots() {
    const { jadibot } = require('./jadibot')

    const bots = scanSessions()

    if (bots.length === 0) {
        console.log('[autostart] Tidak ada session valid yang perlu di-start')
        return
    }

    console.log(`[autostart] Mulai auto-start ${bots.length} bot...`)

    for (let i = 0; i < bots.length; i++) {
        const { username, phoneNumber } = bots[i]
        const jid = `${phoneNumber}@s.whatsapp.net`

        // Delay antar bot supaya tidak flood WA server
        if (i > 0) {
            await new Promise(r => setTimeout(r, START_DELAY_MS))
        }

        console.log(`[autostart] Starting ${i + 1}/${bots.length}: ${username}/${phoneNumber}`)

        // reconnectAttempt = 0, usePairingCode = false (session sudah ada)
        jadibot(jid, null, null, false, username, 0)
            .then(result => {
                if (result?.user) {
                    console.log(`[autostart] ✅ ${username}/${phoneNumber} tersambung`)
                } else {
                    console.log(`[autostart] ⏳ ${username}/${phoneNumber} connecting...`)
                }
            })
            .catch(err => {
                console.error(`[autostart] ❌ ${username}/${phoneNumber} error:`, err.message)
            })
    }

    console.log(`[autostart] ${bots.length} bot sudah di-queue untuk start`)
}

module.exports = { autoStartBots, scanSessions }
