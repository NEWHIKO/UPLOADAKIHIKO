const { sendWithTemplate } = require('../../sendWithTemplate')
const { hitungReward, hitungDebuff, buildTimeInfo } = require('./rpg-time-system.js')

const timeout = 1800000 // 30 menit

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

    case 'berdagang': 'menu'; {
      /* CONSTANTS */
      const MODAL_MIN = 2000
      const MAX_UNIQUE_PARTNERS = 3

      /* HELPER */
      function delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)) }
      function ranNumb(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min }

      function msToTime(duration) {
        const seconds = Math.floor((duration / 1000) % 60)
        const minutes = Math.floor((duration / (1000 * 60)) % 60)
        const hours   = Math.floor((duration / (1000 * 60 * 60)) % 24)
        return `${hours} jam ${minutes} menit ${seconds} detik`
      }

      /* HANDLER */
      const dbUser = global.db.data.users[m.sender]

      // Tentukan target
      let who
      if (isGroup) {
        const arg = args[0] ? args[0].replace(/[^0-9]/g, '') : null
        if (arg) who = arg + '@s.whatsapp.net'
        else if (m.mentionedJid?.[0]) who = m.mentionedJid[0]
      } else {
        who = from
      }

      if (!who) {
        return sendWithTemplate(
          dino, m,
          decorate(`*❌ Target Tidak Ditemukan!*\n│\n│ Kamu harus mention seseorang untuk diajak berdagang.\n│\n│ ➤ Contoh: *${usedPrefix}berdagang @username*`),
          { react: false, mentions: [m.sender] }
        )
      }

      if (who === m.sender) {
        return sendWithTemplate(
          dino, m,
          decorate(`*❌ Tidak Bisa Berdagang Sendiri!*`),
          { react: false, mentions: [m.sender] }
        )
      }

      if (typeof global.db.data.users[who] === 'undefined') {
        return sendWithTemplate(
          dino, m,
          decorate(`*❌ Target Tidak Terdaftar!*\n│\n│ User tersebut belum terdaftar di database bot.`),
          { react: false, mentions: [m.sender] }
        )
      }

      const target = global.db.data.users[who]
      const targetName = dino.getName ? dino.getName(who) : who.split('@')[0]
      const now = Date.now()

      // Cooldown global per sender
      const userSisa = timeout - (now - (dbUser.lastdagang || 0))
      if (userSisa > 0) {
        return sendWithTemplate(
          dino, m,
          decorate(`*⏳ Kamu Masih Lelah Berdagang!*\n│\n│ Tunggu: *${msToTime(userSisa)}*`),
          { react: false, mentions: [m.sender] }
        )
      }

      // Anti-loop mutual
      const targetCooldownKey = `lastdagang_with_${m.sender}`
      const senderCooldownKey = `lastdagang_with_${who}`
      const loopSisa = timeout - (now - (target[targetCooldownKey] || 0))
      if (loopSisa > 0) {
        return sendWithTemplate(
          dino, m,
          decorate(`*❌ Tidak Bisa Berdagang Mutual!*\n│\n│ *${targetName}* baru saja berdagang denganmu.\n│ Tunggu sebelum balik berdagang dengannya lagi.\n│\n│ ⏳ Sisa Cooldown: *${msToTime(loopSisa)}*\n│\n│ 💡 Cari partner dagang lain dulu!`),
          { react: false, mentions: [m.sender] }
        )
      }

      // Anti-exploit: max partner unik per 30 menit
      if (!dbUser.dagangPartners) dbUser.dagangPartners = []
      dbUser.dagangPartners = dbUser.dagangPartners.filter(p => (now - p.time) < timeout)
      const recentPartners = dbUser.dagangPartners.filter(p => p.jid !== who)
      if (recentPartners.length >= MAX_UNIQUE_PARTNERS) {
        const oldestExpiry = Math.min(...dbUser.dagangPartners.map(p => p.time)) + timeout
        return sendWithTemplate(
          dino, m,
          decorate(`*🚫 Terlalu Banyak Mitra Dagang!*\n│\n│ Kamu sudah berdagang dengan *${recentPartners.length} orang berbeda* dalam 30 menit terakhir.\n│\n│ Maksimal *${MAX_UNIQUE_PARTNERS} mitra unik* per 30 menit.\n│\n│ ⏳ Reset: *${msToTime(oldestExpiry - now)}*`),
          { react: false, mentions: [m.sender] }
        )
      }

      // Cek modal
      if ((dbUser.money || 0) < MODAL_MIN) {
        return sendWithTemplate(
          dino, m,
          decorate(`*❌ Tidak Ada Modal!*\n│\n│ Berdagang butuh modal minimal *${MODAL_MIN.toLocaleString('id-ID')} Money*.\n│\n│ 💰 Money Kamu: *${(dbUser.money || 0).toLocaleString('id-ID')}*`),
          { react: false, mentions: [m.sender] }
        )
      }

      // Potong modal
      const modalTerpakai = MODAL_MIN
      dbUser.money -= modalTerpakai

      // Time system
      const debuff   = hitungDebuff(ranNumb(10, 25), 0, 0, 0.20)
      const timeInfo = buildTimeInfo('dagang')

      // Loading
      await sendWithTemplate(
        dino, m,
        decorate(`*🤝 Memulai Perdagangan...*\n│\n│ Kamu mengajak *${targetName}* untuk berdagang!\n│\n│ ${timeInfo}`),
        { react: true, reactDone: '🤝', mentions: [m.sender] }
      )

      await delay(3000)

      // Cek gagal
      const gagal = Math.random() < debuff.finalChanceGagal
      if (gagal) {
        dbUser.stamina  = Math.max(0, (dbUser.stamina || 0) - debuff.finalStaminaLoss)
        dbUser.lastdagang = now

        let gagalMsg = 'Negosiasi gagal! Tidak ada kesepakatan yang tercapai.'
        if (debuff.jam.jam >= 0 && debuff.jam.jam <= 5) gagalMsg = 'Berdagang subuh-subuh, pasarnya tutup semua!\nTidak ada yang mau bertransaksi.'
        else if (debuff.musim.key === 'hujan') gagalMsg = 'Hujan deras bikin dagangan basah!\nPembeli lari dan transaksi gagal.'

        return sendWithTemplate(
          dino, m,
          decorate(`*❌ Perdagangan Gagal!*\n│\n│ ${gagalMsg}\n│\n│ ⚡ Stamina Berkurang: *-${debuff.finalStaminaLoss}* (Sisa: ${dbUser.stamina})\n│ ⚠️ Chance Gagal: ${Math.round(debuff.finalChanceGagal * 100)}% (${debuff.jam.nama})`),
          { react: true, reactDone: '❌', mentions: [m.sender] }
        )
      }

      // Hitung reward
      const baseMoney = ranNumb(8000, 45000)
      const baseExp   = ranNumb(2000, 12000)
      const reward    = hitungReward('dagang', baseMoney, baseExp, 1)

      // Transfer sebagian ke target
      const targetBonus = Math.floor(reward.finalMoney * 0.15)

      // Update sender
      dbUser.stamina  = Math.max(0, (dbUser.stamina || 0) - debuff.finalStaminaLoss)
      dbUser.money   += reward.finalMoney
      dbUser.exp      = (dbUser.exp || 0) + reward.finalExp
      dbUser.lastdagang = now
      dbUser[senderCooldownKey] = now
      target[targetCooldownKey] = now

      // Catat partner (anti multi-account exploit)
      if (!dbUser.dagangPartners) dbUser.dagangPartners = []
      dbUser.dagangPartners = dbUser.dagangPartners.filter(p => (now - p.time) < timeout)
      if (!dbUser.dagangPartners.some(p => p.jid === who)) {
        dbUser.dagangPartners.push({ jid: who, time: now })
      }

      // Update target
      target.money = (target.money || 0) + targetBonus
      if (!target.lastdagang) target.lastdagang = 0

      return sendWithTemplate(
        dino, m,
        decorate(`*✅ Perdagangan Sukses!*\n│\n│ Kamu dan *${targetName}* berhasil mencapai kesepakatan!\n│\n│ 💸 Modal Terpakai   : *-${modalTerpakai.toLocaleString('id-ID')}*\n│ 💰 Money Kamu       : *+${reward.finalMoney.toLocaleString('id-ID')}*\n│ 💰 Bonus Target     : *+${targetBonus.toLocaleString('id-ID')}*\n│ ✨ EXP              : *+${reward.finalExp.toLocaleString('id-ID')}*\n│ 📈 Profit Bersih    : *+${(reward.finalMoney - modalTerpakai).toLocaleString('id-ID')}*\n│\n│ 📊 *Status:*\n│ ⚡ Stamina Berkurang : *-${debuff.finalStaminaLoss}* (Sisa: ${dbUser.stamina})\n│\n│ ⏱️ *Efek Waktu & Musim:*\n│ ${timeInfo}\n│ 🔢 Total Multiplier: ×${reward.totalMult}\n│ ${reward.totalMult > 1.2 ? '🎉 Jam ramai/weekend/musim bagus = transaksi lebih menguntungkan!\n│' : ''}\n│ ⚠️ *${targetName}* tidak bisa balik berdagang denganmu selama *30 menit*.`),
        { react: true, reactDone: '✅', mentions: [m.sender] }
      )
    }

  }
}