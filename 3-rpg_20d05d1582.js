const fs   = require('fs')
const path = require('path')

// ==== LOAD SEMUA FITUR RPG ====
// Scan: file langsung di rpg/ DAN semua subfolder (PET, ABSEN, dll)
// Setiap file .js = 1 handler, module.exports = async (command, ctx) => { ... }
// File helper (bukan handler) diskip jika exports bukan function
const rpgHandlers = {}
const SKIP_FILES  = new Set(['rpg-durability-helper.js', 'rpg-time-system.js', 'rpg-db-default.js'])

function scanDir(dirPath) {
  if (!fs.existsSync(dirPath)) return
  const entries = fs.readdirSync(dirPath, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name)
    if (entry.isDirectory()) {
      scanDir(fullPath)
    } else if (entry.isFile() && entry.name.endsWith('.js') && !SKIP_FILES.has(entry.name)) {
      try {
        const mod = require(fullPath)
        if (typeof mod !== 'function') continue

        const content = fs.readFileSync(fullPath, 'utf8')

        // Daftarkan case yang punya 'menu' marker (muncul di menu)
        const menuRegex = /case\s+['\"`]([^'\"`]+)['\"`]\s*:\s*['\"`]menu['\"`]/g
        let match
        while ((match = menuRegex.exec(content)) !== null) {
          rpgHandlers[match[1]] = mod
        }

        // Daftarkan SEMUA case yang ada di file (termasuk alias tanpa 'menu')
        // Ini memastikan alias seperti 'inv' di samping 'inventory' tetap bisa dipanggil
        const caseRegex = /case\s+['\"`]([^'\"`]+)['\"`]\s*:/g
        while ((match = caseRegex.exec(content)) !== null) {
          if (!rpgHandlers[match[1]]) {
            rpgHandlers[match[1]] = mod
          }
        }

      } catch (e) {
        console.error(`[RPG Loader] Gagal load: ${fullPath}`, e.message)
      }
    }
  }
}

scanDir(path.join(__dirname, 'rpg'))

// Debug: log semua command yang berhasil di-load
console.log('[RPG] Commands loaded:', Object.keys(rpgHandlers).sort().join(', ') || '(kosong)')

// ==== HELPER ====
const { sendWithTemplate } = require('../sendWithTemplate')

function decorate(namabot, content) {
  return `⬣─▣[ ${namabot} ]▣─⬣\n│\n${content}\n▣──⬣`
}

// ==== TARGET USER VALIDATOR ====
// Cek apakah JID target (dari mention/reply) ada di db dan sudah registrasi.
// Return: null kalau valid, atau string pesan error kalau tidak valid.
function validateTarget(targetJid, usedPrefix) {
  const dbUsers = global.db?.users
  if (!dbUsers) return null // db belum siap, biarkan handler yang handle

  if (!dbUsers[targetJid]) {
    return `*❌ User Tidak Ada di Database!*\n│\n│ User yang kamu tag/reply belum pernah\n│ mengirim pesan ke bot ini.\n│\n│ Minta mereka chat bot dulu agar\n│ bisa terdaftar di sistem.`
  }

  if (!dbUsers[targetJid].registered) {
    const num = targetJid.split('@')[0]
    return `*❌ User Belum Terdaftar!*\n│\n│ @${num} belum melakukan pendaftaran.\n│\n│ Minta mereka ketik:\n│ ${usedPrefix}daftar Nama Mereka`
  }

  return null // lolos semua validasi
}

// ==== MAIN DISPATCHER ====
module.exports = async (command, ctx) => {
  const handler = rpgHandlers[command]
  if (!handler) return // bukan command RPG, lewat

  const { dino, m, user, prefix } = ctx
  const namabot    = dino.config?.namabot    || global.namabot    || 'Bot'
  const usedPrefix = prefix || '.'

  // ── Guard 1: sender wajib terdaftar ──────────────────────────────────────
  if (!user?.registered) {
    const messDaftar = dino.config?.mess_daftar || global.mess_daftar
      || `❌ Belum terdaftar!\nKetik: ${usedPrefix}daftar Nama Kamu`

    const teks = decorate(namabot,
      `*Ups! Kamu belum terdaftar!*\n│\n│ _*Gunakan format:*_\n│ ${usedPrefix}daftar nama\n│\n│ \`\`\`${messDaftar}\`\`\`\n│\n│ Contoh:\n│ • ${usedPrefix}daftar Ahyan`
    )
    return sendWithTemplate(dino, m, teks, { mentions: [m.sender] })
  }

  // ── Guard 2: validasi target dari mention/reply (kalau ada) ──────────────
  // Deteksi target: mention @tag diprioritaskan, fallback ke reply
  let mentionedJid = m.mentionedJid?.[0] || null
  const quotedJid  = m.quoted?.sender     || null

  // Konversi LID → JID kalau perlu (WA terbaru kadang kirim format @lid)
  if (mentionedJid?.endsWith('@lid')) {
    const converted = typeof lidToJid === 'function' ? lidToJid(mentionedJid) : null
    mentionedJid = converted || mentionedJid
  }

  const targetJid = mentionedJid || quotedJid

  // Hanya validasi jika targetnya bukan diri sendiri dan bukan LID yang gagal convert
  // Kalau tidak ketemu di db, skip — biarkan handler masing-masing yang handle
  if (targetJid && targetJid !== m.sender && !targetJid.endsWith('@lid')) {
    const dbUsers = global.db?.users
    if (dbUsers && dbUsers[targetJid] !== undefined) {
      const errMsg = validateTarget(targetJid, usedPrefix)
      if (errMsg) {
        const mentions = targetJid.includes('@') ? [targetJid] : []
        return sendWithTemplate(dino, m, decorate(namabot, errMsg), { mentions })
      }
    }
  }

  try {
    await handler(command, ctx)
  } catch (e) {
    console.error(`[RPG] Error di handler '${command}':`, e)
  }
}