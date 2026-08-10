const fs   = require('fs')
const path = require('path')
const pino = require('pino')

const loadBaileys      = require('./baileys')
const Connection       = require('./connection')
const { attachHelpers } = require('./socketHelpers')
const { smsg }         = require('./myfunction')
const caseHandler      = require('../case')
const loadCustomConfig = require('./loadCustomConfig')
const { loadUserDB } = require('./database.js')

const BACKEND_URL         = (process.env.BACKEND_URL || 'http://92.113.124.178:4000').replace(/\/$/, '')
const HEARTBEAT_NORMAL_MS = 4 * 60 * 1000   // 4 menit
const HEARTBEAT_FAST_MS   = 3 * 1000        // 3 detik — polling sampai session ready
const MAX_RECONNECT       = 10              // Maks reconnect berturut-turut
const BASE_RECONNECT_MS   = 5000           // 5 detik base delay
const MAX_RECONNECT_MS    = 60000          // 1 menit max delay

function analyzeDisconnect(reason, pairingCompleted) {
    const code = typeof reason === 'string' ? (parseInt(reason) || 0) : (reason || 0)
    if (code === 515) {
        return {
            reconnect: true,
            deleteSession: false,
            immediate: true,
            reason: `restart_required (code=515)`
        }
    }

    if (code === 440) {
        return {
            reconnect: false,
            deleteSession: false,
            reason: `session_replaced (code=440)`
        }
    }

    if (!pairingCompleted) {
        return {
            reconnect: false,
            deleteSession: true,
            reason: `pairing_not_completed (code=${code})`
        }
    }

    if ([401, 403, 411, 500].includes(code)) {
        return {
            reconnect: false,
            deleteSession: true,
            reason: `invalid_session (code=${code})`
        }
    }

    return {
        reconnect: true,
        deleteSession: false,
        immediate: false,
        reason: `network_disconnect (code=${code})`
    }
}

function isSessionReady(sessionDir) {
    try {
        if (!fs.existsSync(sessionDir)) return false
        const files = fs.readdirSync(sessionDir).filter(f => {
            try { return fs.statSync(path.join(sessionDir, f)).isFile() } catch { return false }
        })
        // Butuh lebih dari 1 file DAN ada file bukan creds.json (pre-keys store)
        return files.length > 1 && files.some(f => f !== 'creds.json')
    } catch {
        return false
    }
}


function safeDeleteSession(sessionDir, label) {
    try {
        if (fs.existsSync(sessionDir)) {
            fs.rmSync(sessionDir, { recursive: true, force: true })
            console.log(`[jadibot] 🗑️  Session dihapus: ${label}`)
        }
    } catch (e) {
        console.warn(`[jadibot] Gagal hapus session ${label}:`, e.message)
    }
}

/**
 * Kirim heartbeat status ke backend.
 */
async function sendHeartbeat(phone, username, status) {
    if (status === 'online') {
        const sessionDir = Connection.getSessionPath(username, phone)
        if (!isSessionReady(sessionDir)) {
            console.log(`[heartbeat] ${username}/${phone} skip — session belum lengkap`)
            return
        }
    }
    try {
        const fetch = require('node-fetch')
        await fetch(`${BACKEND_URL}/bot/report-status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                number: phone, username, status,
                date: new Date().toISOString(),
            }),
            timeout: 10000,
        })
        console.log(`[heartbeat] ${username}/${phone} status=${status} ✓`)
    } catch (e) {
        console.warn(`[heartbeat] ${username}/${phone} gagal: ${e.message}`)
    }
}

/**
 * Mulai heartbeat loop.
 * - Fast mode (3 detik) sampai session ready
 * - Normal mode (4 menit) setelah session siap
 */
function startHeartbeat(phone, username, sessionDir) {
    let fastTimer   = null
    let normalTimer = null
    let stopped     = false

    function stop() {
        stopped = true
        if (fastTimer)   { clearInterval(fastTimer);   fastTimer   = null }
        if (normalTimer) { clearInterval(normalTimer); normalTimer = null }
    }

    function startNormalMode() {
        if (stopped || normalTimer) return
        console.log(`[heartbeat] ${username}/${phone} → normal mode (${HEARTBEAT_NORMAL_MS / 60000} mnt)`)
        sendHeartbeat(phone, username, 'online')
        normalTimer = setInterval(() => {
            if (!stopped) sendHeartbeat(phone, username, 'online')
        }, HEARTBEAT_NORMAL_MS)
    }

    if (isSessionReady(sessionDir)) {
        startNormalMode()
    } else {
        console.log(`[heartbeat] ${username}/${phone} → fast mode (${HEARTBEAT_FAST_MS / 1000}s)`)
        fastTimer = setInterval(() => {
            if (stopped) { clearInterval(fastTimer); return }
            if (isSessionReady(sessionDir)) {
                clearInterval(fastTimer)
                fastTimer = null
                startNormalMode()
            }
        }, HEARTBEAT_FAST_MS)
    }

    return { stop }
}

/**
 * Hitung delay reconnect dengan exponential backoff.
 * @param {number} attempt - attempt ke berapa (mulai 0)
 */
function reconnectDelay(attempt) {
    // 5s, 10s, 20s, 40s, 60s (capped)
    const delay = Math.min(BASE_RECONNECT_MS * Math.pow(2, attempt), MAX_RECONNECT_MS)
    // Tambah jitter ±20% supaya tidak semua bot reconnect bersamaan
    const jitter = delay * 0.2 * (Math.random() - 0.5)
    return Math.floor(delay + jitter)
}

// ─── Main: jadibot ────────────────────────────────────────────────────────────

/**
 * @param {string}  jid              - phone@s.whatsapp.net
 * @param {any}     _baseConn        - unused (legacy)
 * @param {any}     _ws              - unused (legacy)
 * @param {boolean} usePairingCode   - true = minta pairing code baru
 * @param {string}  username         - username pemilik bot
 * @param {number}  [reconnectAttempt=0] - berapa kali sudah reconnect
 */
async function jadibot(jid, _baseConn, _ws, usePairingCode, username, reconnectAttempt = 0) {
    const {
        default: makeWASocket,
        useMultiFileAuthState,
        DisconnectReason,
        makeCacheableSignalKeyStore,
        fetchLatestBaileysVersion,
        makeInMemoryStore,
        jidDecode,
        generateWAMessageFromContent,
        generateWAMessage,
        prepareWAMessageMedia,
        proto,
        delay,
        downloadContentFromMessage,
        Browsers,
        generateForwardMessageContent,
    } = await loadBaileys()

    const phone      = jid.split('@')[0]
    const sessionDir = Connection.getSessionPath(username, phone)
    fs.mkdirSync(sessionDir, { recursive: true })

    // Expose Baileys ke global (untuk case.js, gc.js, dll)
    if (!global._baileysFns) global._baileysFns = {}
    Object.assign(global._baileysFns, {
        makeWASocket, useMultiFileAuthState, DisconnectReason,
        makeInMemoryStore, jidDecode, generateWAMessageFromContent,
        generateWAMessage, proto, delay, downloadContentFromMessage,
        makeCacheableSignalKeyStore, Browsers, generateForwardMessageContent,
    })

    // ── Cek & reset session yang setengah jadi ─────────────────────────────
    // Hanya reset kalau: creds ada tapi registered=false DAN session belum ready
    // (belum punya pre-key files) — ini kondisi session korup / pairing terpotong
    const checkState = await useMultiFileAuthState(sessionDir)
    const creds      = checkState.state.creds
    const sessionHasFiles = isSessionReady(sessionDir)

    if (!creds.registered && !creds.me && sessionHasFiles) {
        // Creds belum registered DAN belum ada info 'me' → session korup
        console.log(`[jadibot] ${username}/${phone} session korup (tidak ada creds.me), reset`)
        safeDeleteSession(sessionDir, `${username}/${phone}`)
        fs.mkdirSync(sessionDir, { recursive: true })
    }

    const { state, saveCreds } = await useMultiFileAuthState(sessionDir)

    // Fetch versi WA terbaru
    const version = [2, 3000, 1037641644];

    const store = makeInMemoryStore({
        logger: pino().child({ level: 'silent', stream: 'store' })
    })

    const sock = makeWASocket({
        version,
        logger: pino({ level: 'fatal' }),
        printQRInTerminal: false,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(
                state.keys,
                pino().child({ level: 'silent', stream: 'store' })
            )
        },
        browser: ['Ubuntu', 'Chrome', '20.0.04'],
        generateHighQualityLinkPreview: false,
        syncFullHistory: false,
        markOnlineOnConnect: true,
        connectTimeoutMs: 60000,
        defaultQueryTimeoutMs: 0,
        keepAliveIntervalMs: 10000,
    })

    store.bind(sock.ev)
    sock.username = username
    sock.folder   = sessionDir
    sock.public   = true

    // Daftarkan ke global registries
    global.client                       = global.client || {}
    global.client[jid]                  = sock
    global._botConns                    = global._botConns || {}
    if (!global._botConns[username]) global._botConns[username] = {}
    global._botConns[username][jid]     = sock

    const connIndex = Connection.addConnection(sock)

    attachHelpers(sock, store, {
        jidDecode, generateWAMessageFromContent, generateWAMessage,
        prepareWAMessageMedia, proto, delay, downloadContentFromMessage,
    })

    sock.ev.on('creds.update', saveCreds)

    let heartbeat        = null
    let pairingRequested = false
    let pairingCode      = null
    let qr               = null

    // ── KEY FLAG ──────────────────────────────────────────────────────────────
    // pairingCompleted = true  → bot sudah pernah 'open', boleh reconnect
    // pairingCompleted = false → pairing belum selesai, JANGAN reconnect
    //
    // Untuk session lama (reconnect setelah disconnect), state.creds.registered
    // sudah true → langsung set pairingCompleted = true
    let pairingCompleted = state.creds.registered === true

    // Resolve untuk memberi tahu HTTP route bahwa pairing code sudah siap
    let pairingResolve = null
    const pairingPromise = (usePairingCode && !state.creds.registered)
        ? new Promise(resolve => { pairingResolve = resolve })
        : Promise.resolve()

    // ── Request pairing code ──────────────────────────────────────────────────
    if (usePairingCode && !state.creds.registered && !pairingRequested) {
        pairingRequested = true
        setTimeout(async () => {
            try {
                const code = await sock.requestPairingCode(phone, 'VIONYXID')
                pairingCode = code
                console.log(`[jadibot] ${username}/${phone} pairing code: ${pairingCode}`)
            } catch (e) {
                console.error(`[jadibot] ${username}/${phone} gagal pairing code: ${e.message}`)
                pairingCode = null
            } finally {
                // Selalu resolve supaya HTTP route tidak hang
                if (pairingResolve) { pairingResolve(); pairingResolve = null }
            }
        }, 3000)
    }

    // ── Connection event ──────────────────────────────────────────────────────
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr: newQr } = update
        if (newQr) qr = newQr

        if (connection === 'open') {
            // ✅ Bot berhasil tersambung → set flag, reset reconnect counter
            reconnectAttempt = 0
            pairingCompleted = true
            console.log(`[jadibot] ${username}/${phone} ✅ tersambung (attempt reset)`)

            // Setup database
            try {
                const { setupGlobalDB } = require('./database.js')
                setupGlobalDB(username)
            } catch (e) {
                console.error(`[jadibot] DB setup error: ${e.message}`)
            }

            // Sewa watcher
            try {
                const { startSewaWatcher } = require('./sewa')
                startSewaWatcher(sock)
            } catch (e) {
                console.error(`[jadibot] Sewa watcher error: ${e.message}`)
            }

            // Load custom config
            try {
                const { getConfigSchema } = require('../config')
                const { syncIdchForSock } = require('./configHelper')
                const schema       = getConfigSchema()
                const customConfig = await loadCustomConfig(username)
                sock.config        = {}
                for (const [key, entry] of Object.entries(schema)) {
                    sock.config[key] = entry.value
                }
                if (customConfig && Object.keys(customConfig).length > 0) {
                    Object.assign(sock.config, customConfig)
                    console.log(`[jadibot] ✅ Custom config: ${Object.keys(customConfig).length} overrides`)
                }

                // ✅ SYNC idch (tanpa update backend).
                // Kalau config.idch sudah tersimpan valid → dipakai langsung (tidak
                // resolve → hemat, anti rate-limit). Kalau belum ada → resolve sekali
                // via newsletterMetadata lalu simpan ke config.idch di MongoDB.
                const idch = await syncIdchForSock(sock, username)
                if (idch) console.log(`[jadibot] ✅ idch: ${idch}`)
            } catch (e) {
                console.error(`[jadibot] Config error: ${e.message}`)
            }

            // Resolve pairing kalau bot sudah registered sebelumnya
            if (state.creds.registered && pairingResolve) {
                pairingCode = 'ALREADY_REGISTERED'
                pairingResolve()
                pairingResolve = null
            }

            // Start heartbeat
            if (heartbeat) heartbeat.stop()
            heartbeat       = startHeartbeat(phone, username, sessionDir)
            sock._heartbeat = heartbeat
        }

        if (connection === 'close') {
            // Ekstrak status code dari error Baileys
            const rawReason = lastDisconnect?.error?.output?.statusCode
                           || lastDisconnect?.error?.output?.payload?.statusCode
                           || lastDisconnect?.error?.message
                           || lastDisconnect?.error?.code

            const reason = typeof rawReason === 'string'
                ? (parseInt(rawReason) || rawReason)
                : (rawReason || 0)

            console.log(`[jadibot] ${username}/${phone} disconnect (${reason}) pairingCompleted=${pairingCompleted} attempt=${reconnectAttempt}`)

            // Resolve pairing agar HTTP route tidak hang
            if (pairingResolve) { pairingResolve(); pairingResolve = null }

            // Stop heartbeat
            if (heartbeat) { heartbeat.stop(); heartbeat = null }
            if (sock._sewaWatcher) {
                try { sock._sewaWatcher.stop() } catch {}
            }

            // ── JANGAN heartbeat kalau bot dalam proses delete ───────────────
            // Flag _isDeleting diset oleh deleteJadibotSession()
            if (!sock._isDeleting) {
                sendHeartbeat(phone, username, 'offline').catch(() => {})
            } else {
                console.log(`[jadibot] ${username}/${phone} skip heartbeat — sedang dihapus`)
            }

            // Cleanup dari registries
            Connection.removeConnection(connIndex)
            delete global.client?.[jid]
            if (global._botConns?.[username]) {
                delete global._botConns[username][jid]
            }

            // ── Analisis disconnect ──────────────────────────────────────────
            const analysis = analyzeDisconnect(reason, pairingCompleted)
            console.log(`[jadibot] ${username}/${phone} action: ${analysis.reason}`)

            // Hapus session jika perlu
            if (analysis.deleteSession) {
                safeDeleteSession(sessionDir, `${username}/${phone}`)
            }

            // Tidak reconnect
            if (!analysis.reconnect) {
                console.log(`[jadibot] ${username}/${phone} stop — tidak reconnect`)
                return
            }

            // ── Cek max reconnect ────────────────────────────────────────────
            if (reconnectAttempt >= MAX_RECONNECT) {
                console.error(`[jadibot] ${username}/${phone} ❌ Maks reconnect (${MAX_RECONNECT}x) tercapai, stop`)
                if (!sock._isDeleting) {
                    sendHeartbeat(phone, username, 'offline').catch(() => {})
                }
                return
            }

            // ── Reconnect dengan delay ───────────────────────────────────────
            const nextAttempt = reconnectAttempt + 1

            if (analysis.immediate) {
                // restartRequired → segera tanpa delay
                console.log(`[jadibot] ${username}/${phone} reconnect segera (attempt ${nextAttempt}/${MAX_RECONNECT})`)
                jadibot(jid, null, null, false, username, nextAttempt)
            } else {
                const ms = reconnectDelay(reconnectAttempt)
                console.log(`[jadibot] ${username}/${phone} reconnect dalam ${ms}ms (attempt ${nextAttempt}/${MAX_RECONNECT})`)
                setTimeout(() => jadibot(jid, null, null, false, username, nextAttempt), ms)
            }
        }
    })

   sock.ev.on('messages.upsert', (chatUpdate) => {
    try {
        const msg = chatUpdate.messages?.[0]
        if (!msg?.message) return
        if (msg.message?.ephemeralMessage) msg.message = msg.message.ephemeralMessage.message
        if (msg.key?.remoteJid === 'status@broadcast') return
        if (msg.key?.id?.startsWith('BAE5') && msg.key.id.length === 16) return
        if (msg.key.fromMe) return

        const m = smsg(sock, msg, store)

        // ✅ tambahan: counting stats chat per grup
        if (m.isGroup) {
            const id  = m.chat
            const sid = m.sender

            setImmediate(() => {
                const sessionDb = loadUserDB(username || 'default')
                if (!sessionDb.groups) sessionDb.groups = {}
                if (!sessionDb.groups[id]) sessionDb.groups[id] = { stats: { daily: {}, weekly: {} } }
                if (!sessionDb.groups[id].stats) sessionDb.groups[id].stats = { daily: {}, weekly: {} }

                const stats = sessionDb.groups[id].stats
                stats.daily[sid]  = (stats.daily[sid]  || 0) + 1
                stats.weekly[sid] = (stats.weekly[sid] || 0) + 1
            })
        }

        caseHandler(sock, m, chatUpdate, store)
    } catch (e) {
        console.error('[jadibot] messages.upsert error:', e.message)
    }
})

    // ── Contacts handler ──────────────────────────────────────────────────────
    sock.ev.on('contacts.update', update => {
        for (const contact of update) {
            const id = sock.decodeJid?.(contact.id) || contact.id
            if (store?.contacts) store.contacts[id] = { id, name: contact.notify }
        }
    })

    // ── Group participants handler (welcome / goodbye) ─────────────────────────
    const GroupParticipants = require('../gc')
    sock.ev.on('group-participants.update', async (event) => {
        try {
            // Refresh group cache supaya getGroupMetaSafe dapat metadata terbaru
            if (global.groupCache) {
                const metadata = await sock.groupMetadata(event.id).catch(() => null)
                if (metadata) global.groupCache.set(event.id, metadata)
            }
            await GroupParticipants(sock, event)
        } catch (e) {
            console.error('[jadibot] group-participants.update error:', e.message)
        }
    })

    // ── Tunggu pairing code (timeout 25 detik) ────────────────────────────────
    // 25 detik lebih panjang dari 15 detik sebelumnya untuk mengakomodasi
    // WA server yang lambat / koneksi tinggi latency
    await Promise.race([
        pairingPromise,
        new Promise(r => setTimeout(r, 25000))
    ])

    return { pairingCode, qr, user: sock.user, sock }
}

// ─── deleteJadibotSession ─────────────────────────────────────────────────────

/**
 * Hapus sesi bot: logout, tutup WS, hapus session folder.
 * TIDAK heartbeat saat delete — backend web yang handle hapus dari database.
 * @param {string} jid
 * @param {string} username
 * @returns {boolean} true jika berhasil
 */
async function deleteJadibotSession(jid, username) {
    const phone      = jid.split('@')[0]
    const sessionDir = Connection.getSessionPath(username, phone)

    const found = Connection.findByJid(jid)
    if (found) {
        // Set flag agar connection.close event TIDAK heartbeat
        found.sock._isDeleting = true
        console.log(`[jadibot] ${username}/${phone} 🗑️  deleting (skip heartbeat)...`)

        try { if (found.sock?._heartbeat) found.sock._heartbeat.stop() } catch {}
        try { if (found.sock?._sewaWatcher) found.sock._sewaWatcher.stop() } catch {}
        try { await found.sock.logout() }   catch {}
        try { found.sock.ws?.close() }      catch {}
        Connection.removeConnection(found.id)
    }

    delete global.client?.[jid]
    if (global._botConns?.[username]) {
        delete global._botConns[username][jid]
    }

    // JANGAN heartbeat — backend web sudah handle delete dari DB
    // Kalau heartbeat 'offline', entry malah ke-create lagi

    if (fs.existsSync(sessionDir)) {
        safeDeleteSession(sessionDir, `${username}/${phone} (delete)`)
        return true
    }
    return !!found
}

module.exports = { jadibot, deleteJadibotSession }