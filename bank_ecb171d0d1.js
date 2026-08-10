const { sendWithTemplate } = require('../../sendWithTemplate')

module.exports = async (command, ctx) => {
  const {
    dino, m, chat, from, text, q, args, body, reply, quoted, qmsg, mime, isMedia,
    sender, senderNumber, botNumber, isOwner, isCreator, pushname,
    isGroup, isPrivate, groupMetadata, groupName, participants,
    groupAdmins, groupMembers, isGroupAdmins, isBotGroupAdmins, isAdmins, isBotAdmins,
    db, user, group, prefix, react
  } = ctx

  const namabot = dino.config?.namabot || global.namabot || 'Bot'
  const usedPrefix = prefix || '.'

  const decorate = content => `⬣─▣[ ${namabot} ]▣─⬣
│
${content}
▣──⬣`

  const usage = (problem, argHint, desc, examples = []) => {
    const contoh = examples.map(ex => `│ • ${usedPrefix + command} ${ex}`).join('\n')
    const teks = decorate(`*Ups! ${problem}*
│
│ _*Gunakan format:*_
│ ${usedPrefix + command} ${argHint}
│
│ \`\`\`${desc}\`\`\`
│
│ Contoh:
${contoh}`)
    return sendWithTemplate(dino, m, teks, { react: false, mentions: [m.sender] })
  }

  switch (command) {

    case 'my':
    case 'bank':
    case 'atm': 'menu'; {
      /* CONSTANTS */
      const DAY_NAMES = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
      const MONTH_NAMES = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

      /* HELPER */
      const fmt = n => (n || 0).toLocaleString('id-ID')

      function progressBar(current, max, len = 10) {
        if (!max || max <= 0) return '░'.repeat(len)
        const filled = Math.max(0, Math.min(Math.round((current / max) * len), len))
        return '█'.repeat(filled) + '░'.repeat(len - filled)
      }

      function pickRandom(list) {
        return list[Math.floor(Math.random() * list.length)]
      }

      /* HANDLER */

      // Tentukan target
      let target
      if (text) {
        const cleaned = text.replace(/[^0-9]/g, '')
        target = cleaned + '@s.whatsapp.net'
      } else if (m.quoted) {
        target = m.quoted.sender
      } else if (m.mentionedJid?.[0]) {
        target = m.mentionedJid[0]
      } else {
        target = m.sender
      }

      // Cek terdaftar
      if (!global.db.data.users[target]) {
        return sendWithTemplate(
          dino, m,
          decorate(`*❌ User Tidak Terdaftar!*\n│\n│ User ini belum terdaftar di database bot.`),
          { mentions: [m.sender] }
        )
      }

      const dbUser = global.db.data.users[target]
      const name = dino.getName ? dino.getName(target) : (target.split('@')[0])
      const isSelf = target === m.sender

      // Waktu sekarang
      const now = new Date()
      const formattedDate = `${DAY_NAMES[now.getDay()]}, ${now.getDate()} ${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`
      const formattedTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} WIB`

      // Progress bar health & stamina
      const barHealth = progressBar(dbUser.health || 0, 200)
      const barStamina = progressBar(dbUser.stamina || 0, 300)
      const pctHealth = Math.round(((dbUser.health || 0) / 200) * 100)
      const pctStamina = Math.round(((dbUser.stamina || 0) / 300) * 100)

      // Sapaan variatif
      const sapaan = isSelf
        ? pickRandom([
            `💳 Ini rekening kamu, ${name}!`,
            `🏦 Cek saldo, ${name}? Ini dia!`,
            `💰 Laporan keuangan ${name} hadir!`,
            `📊 Status akun ${name} siap ditampilkan!`,
            `🏧 Rekening ${name} berhasil dibuka!`
          ])
        : pickRandom([
            `👀 Intip rekening ${name} nih!`,
            `🔍 Info akun ${name} ditemukan!`,
            `📋 Laporan keuangan ${name}!`,
            `💳 Rekening ${name} berhasil dilihat!`,
            `🏦 Data akun ${name} siap!`
          ])

      const teks = decorate(`*🏦 BANK ACCOUNT*
│
│ ${sapaan}
│ 📅 ${formattedDate} | 🕐 ${formattedTime}
│
│ *👤 INFO AKUN*
│ ┌────────
│ │ 👤 Nama     : *${name}*
│ │ 🎖️ Role     : *${dbUser.role || '-'}*
│ └─────
│
│ *💰 KEUANGAN*
│ ┌────────
│ │ 💰 Money    : *${fmt(dbUser.money)}*
│ │ 🏦 ATM/Bank : *${fmt(dbUser.bank)}*
│ │ ✨ EXP      : *${fmt(dbUser.exp)}*
│ │ 🌟 Level    : *${dbUser.level || 0}*
│ └─────
│
│ *❤️ KONDISI*
│ ┌────────
│ │ ❤️ Health
│ │   [${barHealth}] ${pctHealth}%
│ │   *${dbUser.health || 0} / 200*
│ │
│ │ ⚡ Stamina
│ │   [${barStamina}] ${pctStamina}%
│ │   *${dbUser.stamina || 0} / 300*
│ └─────
│
│ ${isSelf
    ? `➤ *${usedPrefix}nabung <jumlah>* simpan money ke ATM\n│ ➤ *${usedPrefix}tarik <jumlah>* ambil dari ATM\n│ ➤ *${usedPrefix}inv* lihat inventory lengkap`
    : `➤ *${usedPrefix}atm* untuk cek rekeningmu sendiri`
  }`)

      return sendWithTemplate(dino, m, teks, { mentions: [m.sender] })
    }

  }
}