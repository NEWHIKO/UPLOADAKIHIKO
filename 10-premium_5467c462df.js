const fs = require('fs')
const path = require('path')
const { sendWithTemplate } = require('../sendWithTemplate')

/**
 * Format sisa waktu premium ke string yang mudah dibaca
 * @param {number} expired - timestamp ms atau -1 (permanent)
 * @returns {string}
 */
function formatSisaPremium(expired) {
  if (expired === -1) return '∞ Permanent'
  const sisa = expired - Date.now()
  if (sisa <= 0) return 'Sudah expired'

  const hari  = Math.floor(sisa / 86_400_000)
  const jam   = Math.floor((sisa % 86_400_000) / 3_600_000)
  const menit = Math.floor((sisa % 3_600_000) / 60_000)

  const parts = []
  if (hari)  parts.push(`${hari} hari`)
  if (jam)   parts.push(`${jam} jam`)
  if (menit) parts.push(`${menit} menit`)
  return parts.join(' ') || 'Kurang dari 1 menit'
}

// 𝗙𝗨𝗡𝗚𝗧𝗜𝗢𝗡 𝗥𝗔𝗡𝗗𝗢𝗠
function getRandomItem(arr) {
  if (!arr || arr.length === 0) return null
  return arr[Math.floor(Math.random() * arr.length)]
}

function loadDB(filename) {
  try {
    return JSON.parse(fs.readFileSync(path.join(__dirname, '../database/tiktok/' + filename), 'utf-8'))
  } catch (e) {
    console.error(`Error loading ${filename}:`, e.message)
    return []
  }
}

// ====================== \\
module.exports = async (command, ctx) => {
  const {
    dino, m, text, q, args, reply,
    sender, pushname, isOwner,
    db, user, prefix, react
  } = ctx

  // Resolusi nilai config: dino.config (per-bot) > global (fallback)
  const namabot    = dino.config?.namabot   || global.namabot   || 'Bot'
  const messOwner  = dino.config?.mess_owner || global.mess?.owner || '<!> Fitur Khusus Owner'
  const usedPrefix = prefix || '.'

  // Pola decorate sama persis dengan 1-main.js
  const decorate = content => `⬣─▣[ ${namabot} ]▣─⬣\n│\n${content}\n▣──⬣`

  // Helper usage untuk pesan error format — sama seperti 1-main.js
  const usage = (problem, argHint, desc, examples = []) => {
    const contoh = examples.map(ex => `│ • ${usedPrefix + command} ${ex}`).join('\n')
    const teks = decorate(`*Ups! ${problem}*\n│\n│ _*Gunakan format:*_\n│ ${usedPrefix + command} ${argHint}\n│\n│ \`\`\`${desc}\`\`\`\n│\n│ Contoh:\n${contoh}`)
    return sendWithTemplate(dino, m, teks, { react: false, mentions: [m.sender] })
  }

  // Cek status premium realtime
  const userIsPremium = global.isPremium
    ? global.isPremium(sender)
    : (user?.premium && (user.premiumExpired === -1 || user.premiumExpired > Date.now()))

  // Helper kirim video tiktok — di dalam module.exports biar bisa akses ctx
  async function kirimVideoTiktok(filename) {
    if (!isOwner && !userIsPremium) {
      return sendWithTemplate(dino, m, decorate(messOwner), { react: false, mentions: [sender] })
    }

    await react('⏱️')

    const list = loadDB(filename)
    const hasil = getRandomItem(list)

    if (!hasil?.url) {
      await react('❌')
      return sendWithTemplate(dino, m, decorate(`❌ Data video tidak ditemukan atau kosong.`), { react: false, mentions: [sender] })
    }

    await dino.sendMessage(m.chat, {
      video: { url: hasil.url },
      caption: decorate(global.foother || '')
    }, { quoted: m })

    await react('✅')
  }

  switch (command) {

    // ── .cekprem / .statusprem ───────────────────────────────────
    case 'cekprem':
    case 'statusprem': 'menu'; {
      if (!userIsPremium) {
        return usage(
          'Kamu belum premium!',
          '',
          'Cek status premium kamu — hubungi owner untuk beli akses',
          [`${usedPrefix}cekprem`]
        )
      }

      const sisa = formatSisaPremium(user.premiumExpired)
      const tipe = user.premiumType || '-'

      return sendWithTemplate(dino, m,
        decorate(
          `👑 *Status Premium*\n│\n` +
          `│ 👤 Nama    : ${user.name || pushname}\n` +
          `│ 🏷️ Tipe    : ${tipe}\n` +
          `│ ⏳ Sisa    : ${sisa}\n` +
          `│ 📅 Expired : ${user.premiumExpired === -1 ? '∞ Tidak pernah' : new Date(user.premiumExpired).toLocaleString('id-ID')}`
        ),
        { react: false, mentions: [sender] }
      )
    }
break

    // ── .listprem ─────────────────────────────────────────────────
    case 'listprem': 'menu'; {
      if (!isOwner) return usage(
        'Fitur ini khusus owner!',
        '',
        'Cek daftar user premium aktif — hanya owner yang bisa mengakses',
        ['— perintah ini hanya untuk owner bot']
      )

      const users = db?.users || global.db?.users || {}
      const now   = Date.now()

      const premList = Object.values(users).filter(u =>
        u.premium && (u.premiumExpired === -1 || u.premiumExpired > now)
      )

      if (!premList.length) {
        return sendWithTemplate(dino, m,
          decorate(`│ 📋 Belum ada user premium aktif.`),
          { react: false, mentions: [sender] }
        )
      }

      const list = premList.map((u, i) => {
        const no   = String(i + 1).padStart(2, ' ')
        const num  = u.jid.replace('@s.whatsapp.net', '')
        const sisa = formatSisaPremium(u.premiumExpired)
        return `│ ${no}. @${num}\n│     Sisa: ${sisa}`
      }).join('\n│\n')

      const mentions = premList.map(u => u.jid)

      return sendWithTemplate(dino, m,
        decorate(`👑 *Daftar User Premium* (${premList.length})\n│\n${list}`),
        { react: false, mentions }
      )
    }
break

    // ── .preminfo ─────────────────────────────────────────────────
    case 'preminfo': 'menu'; {
      if (!userIsPremium) {
        return usage(
          'Fitur ini khusus pengguna premium',
          '',
          'Hubungi owner untuk mendapatkan akses premium',
          [`— lalu cek status dengan ${usedPrefix}cekprem`]
        )
      }

      const sisa = formatSisaPremium(user.premiumExpired)

      return sendWithTemplate(dino, m,
        decorate(
          `👑 *Info Akun Premium*\n│\n` +
          `│ 👤 Nama      : ${user.name || pushname}\n` +
          `│ ⭐ Level     : ${user.level || 1}\n` +
          `│ 💰 Saldo     : ${(user.money || 0).toLocaleString('id-ID')} koin\n` +
          `│ 📊 EXP       : ${user.exp || 0}\n` +
          `│ 🏷️ Tipe Prem : ${user.premiumType || '-'}\n` +
          `│ ⏳ Sisa Prem : ${sisa}\n│\n` +
          `│ Terima kasih sudah menjadi member premium! 🙏`
        ),
        { react: false, mentions: [sender] }
      )
    }
break

  
  }
}