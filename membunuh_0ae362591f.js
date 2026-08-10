const { sendWithTemplate } = require('../../sendWithTemplate')
const { hitungReward, hitungDebuff, buildTimeInfo } = require('./rpg-time-system.js')
const { applyDurabilityLoss } = require('./rpg-durability-helper.js')

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

    case 'membunuh': 'menu'; {
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
          'Tag seseorang yang ingin kamu bunuh',
          ['@username']
        )
      }
      if (who === m.sender) {
        return sendWithTemplate(dino, m, decorate(`*❌ Tidak Bisa Membunuh Diri Sendiri!*`), { mentions: [m.sender] })
      }
      if (typeof global.db.data.users[who] === 'undefined') {
        return sendWithTemplate(dino, m, decorate(`*❌ Target Tidak Terdaftar!*`), { mentions: [m.sender] })
      }

      const target = global.db.data.users[who]
      const targetName = who.split('@')[0]

      if (target.health <= 10) {
        return sendWithTemplate(dino, m, decorate(`*❌ Target Sudah Sekarat!*
│
│ Health Target : *${target.health} HP*
│ ➤ Cari target lain!`), { mentions: [m.sender] })
      }
      if ((target.money || 0) < 100) {
        return sendWithTemplate(dino, m, decorate(`*❌ Target Miskin!*
│
│ Uang Target : *${fmt(target.money)}*`), { mentions: [m.sender] })
      }
      if (!dbUser.sword || dbUser.sword === 0) {
        return sendWithTemplate(dino, m, decorate(`*❌ Sword Tidak Ada!*
│
│ ➤ *${usedPrefix}craft sword*`), { mentions: [m.sender] })
      }
      if ((dbUser.stamina || 0) < 40) {
        return sendWithTemplate(dino, m, decorate(`*❌ Stamina Tidak Cukup!*
│
│ Stamina Dibutuhkan : *40*
│ Stamina Kamu       : *${dbUser.stamina || 0}*`), { mentions: [m.sender] })
      }
      if ((dbUser.health || 0) < 50) {
        return sendWithTemplate(dino, m, decorate(`*❌ Health Terlalu Rendah!*
│
│ Health Dibutuhkan : *50*
│ Health Kamu       : *${dbUser.health || 0}*
│
│ ➤ *${usedPrefix}heal*`), { mentions: [m.sender] })
      }

      const now = Date.now()
      if (now - (dbUser.membunuh || 0) < TIMEOUT) {
        const sisa = msToTime((dbUser.membunuh + TIMEOUT) - now)
        return sendWithTemplate(dino, m, decorate(`*⏳ Masih Bersembunyi!*
│
│ Tunggu: *${sisa}*`), { mentions: [m.sender] })
      }

      // Set cooldown di awal — cegah race condition
      dbUser.membunuh = now

      const swordMultiplier = [0, 1, 1.5, 2, 3, 4][dbUser.sword] || 1

      const debuff = hitungDebuff(
        ranNumb(30, 60),
        ranNumb(20, 80),
        ranNumb(20, 70),
        0.30
      )
      const timeInfo = buildTimeInfo('crime')

      let peringatan = ''
      if (debuff.jam.kategori === 'SIBUK' && debuff.jam.jam >= 6 && debuff.jam.jam <= 11) {
        debuff.finalChanceGagal = Math.min(0.95, debuff.finalChanceGagal + 0.15)
        peringatan = '⚠️ JAM RAMAI PAGI: SANGAT BERBAHAYA! Banyak saksi, chance ketahuan +15%!'
      } else if (debuff.jam.kategori === 'SEPI') {
        debuff.finalChanceGagal = Math.max(0.10, debuff.finalChanceGagal - 0.05)
        peringatan = '🌙 JAM SEPI: Target tidur, lebih mudah — tapi reward cuma ×0.70!'
      } else if (debuff.jam.kategori === 'SIBUK' && debuff.jam.jam >= 20) {
        peringatan = '🌃 JAM SIBUK MALAM: Kondisi ideal! Reward ×1.35 + gelap jadi cover.'
      }

      await sendWithTemplate(dino, m, decorate(`*⚔️ Memulai Serangan...*
│
│ Target : *${targetName}* (❤️ ${target.health} HP)
│
│ ${timeInfo}
│ ${peringatan}`),
        { react: true, reactDone: '⚔️', mentions: [m.sender] })

      await delay(3000)
      await sendWithTemplate(dino, m, decorate(`*🏃 Mengejar Target...*
│
│ Kamu menguntit ${targetName} menunggu momen yang tepat untuk menyerang...`),
        { mentions: [m.sender] })
      await delay(3000)

      const gagal = Math.random() < debuff.finalChanceGagal
      if (gagal) {
        const senderHealthLoss = debuff.finalHealthLoss + ranNumb(10, 30)
        const swordLoss = debuff.finalDurabilityLoss

        dbUser.stamina = (dbUser.stamina || 0) - debuff.finalStaminaLoss
        dbUser.health = Math.max(10, (dbUser.health || 100) - senderHealthLoss)
        const swordRes = applyDurabilityLoss(dbUser, 'sword', swordLoss)

        let gagalMsg = `${targetName} berhasil menghindari serangan dan balik menyerang kamu!\nKamu terluka parah dan terpaksa kabur.`
        if (debuff.jam.kategori === 'SIBUK' && debuff.jam.jam <= 11) {
          gagalMsg = `JAM RAMAI! ${targetName} teriak minta tolong dan orang-orang mengeroyokmu!\nKamu babak belur dan kabur pontang-panting.`
        }

        return sendWithTemplate(dino, m, decorate(`*❌ Serangan Gagal!*
│
│ ${gagalMsg}
│
│ 📊 *Status Kamu:*
│ ⚡ Stamina Berkurang : *-${debuff.finalStaminaLoss}* (Sisa: ${dbUser.stamina})
│ ❤️ Health Berkurang  : *-${senderHealthLoss}* (Sisa: ${dbUser.health})
│ ⚔️ Durability Sword  : *-${swordLoss}* (Sisa: ${dbUser.sworddurability})${swordRes.msg}
│ ⚠️ Chance Gagal      : ${Math.round(debuff.finalChanceGagal * 100)}%
│
│ ➤ *${usedPrefix}heal* untuk pulihkan health.`),
          { react: true, reactDone: '❌', mentions: [m.sender] })
      }

      await sendWithTemplate(dino, m, decorate(`*💀 SERANGAN MENGHANTAM!*
│
│ Kamu berhasil menyerang ${targetName} dan menguasai situasi!`),
        { mentions: [m.sender] })
      await delay(2000)

      const maxStealable = Math.min(target.money || 0, 5_000_000)
      let baseMoney = Math.floor(maxStealable * ranNumb(0.15, 0.35))
      const baseExp = ranNumb(5000, 25000)
      const reward = hitungReward('crime', Math.max(baseMoney, 1000), baseExp, 1, swordMultiplier)

      const capPerTier = [0, 150_000, 200_000, 250_000, 275_000, 300_000]
      const tierCap = capPerTier[dbUser.sword] || 150_000
      const hardCap = Math.floor(tierCap * ranNumb(0.90, 1.10))
      reward.finalMoney = Math.min(reward.finalMoney, hardCap)

      const targetMoneyLoss = Math.min((target.money || 0) - 50, reward.finalMoney)
      const targetHealthLoss = ranNumb(40, 90)
      target.money = (target.money || 0) - targetMoneyLoss
      target.health = Math.max(5, (target.health || 100) - targetHealthLoss)

      const swordLoss = debuff.finalDurabilityLoss
      dbUser.stamina = (dbUser.stamina || 0) - debuff.finalStaminaLoss
      dbUser.health = Math.max(10, (dbUser.health || 100) - debuff.finalHealthLoss)
      const swordRes = applyDurabilityLoss(dbUser, 'sword', swordLoss)
      dbUser.money = (dbUser.money || 0) + reward.finalMoney
      dbUser.exp = (dbUser.exp || 0) + reward.finalExp

      await sendWithTemplate(dino, m, decorate(`*💀 Serangan Berhasil!*
│
│ *${targetName}* dikalahkan dan dijarah!
│
│ 💰 Money Didapat     : *+${fmt(reward.finalMoney)}*
│ 💸 Target Kehilangan : *-${fmt(targetMoneyLoss)}*
│ ❤️ Health Target Sisa: *${target.health} HP*
│ ✨ EXP               : *+${fmt(reward.finalExp)}*
│
│ 📊 *Status Kamu:*
│ ⚡ Stamina Berkurang : *-${debuff.finalStaminaLoss}* (Sisa: ${dbUser.stamina})
│ ❤️ Health Berkurang  : *-${debuff.finalHealthLoss}* (Sisa: ${dbUser.health})
│ ⚔️ Durability Sword  : *-${swordLoss}* (Sisa: ${dbUser.sworddurability})${swordRes.msg}
│
│ ⏱️ *Efek Waktu & Musim:*
│ ${timeInfo}`),
        { react: true, reactDone: '💀', mentions: [m.sender] })

      setTimeout(() => {
        sendWithTemplate(dino, m, decorate(`*⏰ Siap Beraksi Lagi!*
│
│ ➤ *${usedPrefix}membunuh @target*`), { mentions: [m.sender] })
      }, TIMEOUT)
    }

  }
}