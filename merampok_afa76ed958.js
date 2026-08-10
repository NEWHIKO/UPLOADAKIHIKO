const { sendWithTemplate } = require('../../sendWithTemplate')
const { hitungReward, hitungDebuff, buildTimeInfo } = require('./rpg-time-system.js')

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

    case 'merampok': 'menu'; {
      /* CONSTANTS */
      const TIMEOUT = 3600000 // 60 menit

      /* HELPER */
      function ranNumb(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min }
      const dbUser = global.db.data.users[m.sender]
      const fmt = (n) => (n || 0).toLocaleString('id-ID')

      function delay(ms) { return new Promise(r => setTimeout(r, ms)) }
      function msToTime(duration) {
        let s = Math.floor((duration / 1000) % 60)
        let mi = Math.floor((duration / 60000) % 60)
        let h = Math.floor(duration / 3600000)
        return `${h} jam ${mi} menit ${s} detik`
      }

      /* HANDLER */
      let who = m.isGroup ? m.mentionedJid?.[0] : m.chat
      if (!who) {
        return usage(
          'Target Tidak Ditemukan!',
          '@target',
          'Tag seseorang yang ingin kamu rampok',
          ['@username']
        )
      }
      if (who === m.sender) {
        return sendWithTemplate(dino, m, decorate(`*❌ Tidak Bisa Merampok Diri Sendiri!*`), { mentions: [m.sender] })
      }
      if (typeof global.db.data.users[who] === 'undefined') {
        return sendWithTemplate(dino, m, decorate(`*❌ Target Tidak Terdaftar!*`), { mentions: [m.sender] })
      }

      const target = global.db.data.users[who]
      const targetName = who.split('@')[0]

      if (target.money < 10000) {
        return sendWithTemplate(dino, m, decorate(`*❌ Target Miskin!*
│
│ Uang Target : *Rp ${fmt(target.money)}*
│ Minimal     : *Rp 10.000*`), { mentions: [m.sender] })
      }

      const now = Date.now()
      if (now - (dbUser.merampok || 0) < TIMEOUT) {
        const sisa = msToTime((dbUser.merampok + TIMEOUT) - now)
        return sendWithTemplate(dino, m, decorate(`*⏳ Masih Kabur!*
│
│ Tunggu: *${sisa}*`), { mentions: [m.sender] })
      }

      // Set cooldown di awal — cegah race condition
      dbUser.merampok = now

      const debuff = hitungDebuff(ranNumb(25, 70), ranNumb(10, 50), 0, 0.35)
      const timeInfo = buildTimeInfo('crime')

      let chanceNote = ''
      if (debuff.jam.kategori === 'SIBUK' && debuff.jam.jam >= 6 && debuff.jam.jam <= 11) {
        debuff.finalChanceGagal = Math.min(0.95, debuff.finalChanceGagal + 0.10)
        chanceNote = '⚠️ JAM RAMAI PAGI: Sangat berisiko ketahuan!'
      } else if (debuff.jam.kategori === 'SEPI') {
        debuff.finalChanceGagal = Math.max(0.10, debuff.finalChanceGagal - 0.08)
        chanceNote = '✅ JAM SEPI: Target tidur pulas, lebih mudah - tapi reward kecil (×0.70)!'
      } else if (debuff.jam.kategori === 'SIBUK' && debuff.jam.jam >= 20) {
        chanceNote = '🌃 JAM SIBUK MALAM: Reward maksimal tapi gelap = sedikit lebih berisiko.'
      }

      await sendWithTemplate(dino, m, decorate(`*🔪 Memulai Perampokan...*
│
│ Target     : *${targetName}*
│ Uang Target: *Rp ${fmt(target.money)}*
│
│ ${timeInfo}
│ ${chanceNote}`),
        { react: true, reactDone: '🔪', mentions: [m.sender] })

      await delay(3000)
      await sendWithTemplate(dino, m, decorate(`*🏃 Mendekati Target...*
│
│ Kamu mengikuti ${targetName} dari belakang sambil menunggu kesempatan...`),
        { mentions: [m.sender] })
      await delay(3000)

      const gagal = Math.random() < debuff.finalChanceGagal
      if (gagal) {
        dbUser.stamina -= debuff.finalStaminaLoss
        dbUser.health = Math.max(10, (dbUser.health || 100) - debuff.finalHealthLoss)

        let gagalMsg = `${targetName} berhasil melawan dan memanggil orang sekitar!\nKamu digebuki ramai-ramai sebelum kabur.`
        if (debuff.jam.kategori === 'SIBUK' && debuff.jam.jam <= 11) {
          gagalMsg = `Jam ramai! Ada banyak saksi yang langsung teriak dan mengejar kamu!\n${targetName} selamat.`
        }

        return sendWithTemplate(dino, m, decorate(`*❌ Perampokan Gagal!*
│
│ ${gagalMsg}
│
│ 📊 *Status Kamu:*
│ ⚡ Stamina Berkurang : *-${debuff.finalStaminaLoss}* (Sisa: ${dbUser.stamina})
│ ❤️ Health Berkurang  : *-${debuff.finalHealthLoss}* (Sisa: ${dbUser.health})
│ ⚠️ Chance Gagal      : ${Math.round(debuff.finalChanceGagal * 100)}%
│
│ ➤ *${usedPrefix}heal* untuk pulihkan health.`),
          { react: true, reactDone: '❌', mentions: [m.sender] })
      }

      await sendWithTemplate(dino, m, decorate(`*💰 HARTA DIRAMPAS!*
│
│ Kamu berhasil mengancam ${targetName} dan merampas uangnya!`),
        { mentions: [m.sender] })
      await delay(2000)

      const MAX_RAMPOK = 100000
      const baseRampok = Math.min(MAX_RAMPOK, Math.floor(target.money * (ranNumb(0.1, 0.4))))
      const baseExp = ranNumb(3000, 15000)
      const reward = hitungReward('crime', baseRampok, baseExp, 1)

      const targetLoss = Math.min(target.money - 1000, Math.floor(baseRampok * 1.0))
      target.money -= targetLoss
      target.health = Math.max(10, (target.health || 100) - ranNumb(20, 60))

      dbUser.stamina -= debuff.finalStaminaLoss
      dbUser.health = Math.max(10, (dbUser.health || 100) - debuff.finalHealthLoss)
      dbUser.money = (dbUser.money || 0) + reward.finalMoney
      dbUser.exp = (dbUser.exp || 0) + reward.finalExp

      await sendWithTemplate(dino, m, decorate(`*✅ Perampokan Berhasil!*
│
│ *${targetName}* dirampok habis-habisan!
│
│ 💰 Money Didapat       : *+${fmt(reward.finalMoney)}*
│ 💸 Target Kehilangan   : *-${fmt(targetLoss)}*
│ ✨ EXP                 : *+${fmt(reward.finalExp)}*
│
│ 📊 *Status Kamu:*
│ ⚡ Stamina Berkurang : *-${debuff.finalStaminaLoss}* (Sisa: ${dbUser.stamina})
│ ❤️ Health Berkurang  : *-${debuff.finalHealthLoss}* (Sisa: ${dbUser.health})
│
│ ⏱️ *Efek Waktu & Musim:*
│ ${timeInfo}
│ 🔢 Total Multiplier: ×${reward.totalMult}
${debuff.jam.kategori === 'SEPI' ? '│ ⚠️ JAM SEPI ×0.70 — Jarah sedikit tapi aman.' : ''}`),
        { react: true, reactDone: '✅', mentions: [m.sender] })

      setTimeout(() => {
        sendWithTemplate(dino, m, decorate(`*⏰ Siap Beraksi Lagi!*
│
│ ➤ *${usedPrefix}merampok @target*`), { mentions: [m.sender] })
      }, TIMEOUT)
    }

  }
}