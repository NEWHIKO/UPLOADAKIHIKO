const { sendWithTemplate } = require('../../sendWithTemplate')
const { hitungReward, hitungDebuff, buildTimeInfo, getDropBonus } = require('./rpg-time-system.js')
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

  switch (command) {

    case 'berburu': 'menu'; {
      /* CONSTANTS */
      const TIMEOUT     = 3600000 // 60 menit
      const TOTAL_CAP   = 60
      const CAP_HEWAN   = 10
      const SWORD_MULT  = [0, 1, 1.5, 2, 3, 4]

      /* HELPER */
      const dbUser = global.db.data.users[m.sender]

      function ranNumb(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min }
      function msToTime(ms) {
        const h = Math.floor(ms / 3600000)
        const m = Math.floor(ms / 60000) % 60
        const s = Math.floor(ms / 1000) % 60
        return `${h} jam ${m} menit ${s} detik`
      }
      function delay(ms) { return new Promise(r => setTimeout(r, ms)) }

      /* HANDLER — Validasi */
      if (!dbUser.sword || dbUser.sword === 0) {
        return sendWithTemplate(
          dino, m,
          decorate(`*❌ Sword Tidak Ada!*\n│\n│ Kamu butuh Sword sebelum berburu.\n│\n│ ➤ *${usedPrefix}craft sword*`),
          { mentions: [m.sender] }
        )
      }

      if (!dbUser.armor || dbUser.armor === 0) {
        return sendWithTemplate(
          dino, m,
          decorate(`*❌ Armor Tidak Ada!*\n│\n│ Kamu butuh Armor sebelum berburu.\n│\n│ ➤ *${usedPrefix}craft armor*`),
          { mentions: [m.sender] }
        )
      }

      if ((dbUser.stamina || 0) < 25) {
        return sendWithTemplate(
          dino, m,
          decorate(`*❌ Stamina Tidak Cukup!*\n│\n│ Dibutuhkan : *25*\n│ Kamu       : *${dbUser.stamina || 0}*\n│\n│ ➤ *${usedPrefix}eat* untuk isi stamina`),
          { mentions: [m.sender] }
        )
      }

      if ((dbUser.health || 0) < 30) {
        return sendWithTemplate(
          dino, m,
          decorate(`*❌ Health Tidak Cukup!*\n│\n│ Dibutuhkan : *30*\n│ Kamu       : *${dbUser.health || 0}*\n│\n│ ➤ *${usedPrefix}heal* untuk pulihkan health`),
          { mentions: [m.sender] }
        )
      }

      const elapsed = new Date() - (dbUser.lastberburu || 0)
      if (elapsed < TIMEOUT) {
        const remain = TIMEOUT - elapsed
        return sendWithTemplate(
          dino, m,
          decorate(`*⏳ Masih Cooldown!*\n│\n│ Tunggu : *${msToTime(remain)}*`),
          { mentions: [m.sender] }
        )
      }

      // Set cooldown di awal (anti race condition)
      dbUser.lastberburu = new Date() * 1

      const swordMult = SWORD_MULT[dbUser.sword] || 1
      const armorBonus = 1 + ((dbUser.armor || 0) * 0.15)
      const gearBonus  = Math.min(swordMult * armorBonus, 4.0)

      // TIME SYSTEM
      const debuff   = hitungDebuff(ranNumb(15, 35), ranNumb(5, 50), ranNumb(15, 60), 0.15)
      const timeInfo = buildTimeInfo('hunting')

      await sendWithTemplate(
        dino, m,
        decorate(`*🏹 Memulai Berburu...*
│
│ Memeriksa gear dan bersiap memasuki hutan...
│
│ ⚔️  Sword Tier  : *${dbUser.sword}* (×${swordMult})
│ 🥼 Armor Tier  : *${dbUser.armor}* (+${((dbUser.armor * 0.15) * 100).toFixed(0)}% bonus)
│
│ ${timeInfo}`),
        { react: true, reactDone: '🏹', mentions: [m.sender] }
      )

      await delay(3000)

      await sendWithTemplate(
        dino, m,
        decorate(`*🌲 Menyusuri Hutan...*\n│\n│ Menelusuri semak belukar, mencari jejak hewan...`),
        { react: false, mentions: [m.sender] }
      )

      await delay(3000)

      // Cek gagal
      const gagal = Math.random() < debuff.finalChanceGagal
      if (gagal) {
        const healthLoss  = debuff.finalHealthLoss
        const staminaLoss = debuff.finalStaminaLoss
        const armorLoss   = ranNumb(8, 30)
        const swordLoss   = ranNumb(8, 30)

        dbUser.health  = Math.max(10, (dbUser.health || 0) - healthLoss)
        dbUser.stamina = Math.max(0, (dbUser.stamina || 0) - staminaLoss)
        const armorRes = applyDurabilityLoss(dbUser, 'armor', armorLoss)
        const swordRes = applyDurabilityLoss(dbUser, 'sword', swordLoss)

        let gagalMsg = 'Hewan buruan kabur dan menyerang balik!\nKamu terpaksa mundur dengan kondisi babak belur.'
        if (debuff.musim?.key === 'kemarau') gagalMsg = 'Hewan bersembunyi di musim kemarau!\nKelelahan di bawah terik matahari, kamu menyerah.'
        else if (debuff.jam?.jam >= 0 && debuff.jam?.jam <= 5) gagalMsg = 'Berburu di subuh gelap gulita!\nKamu tersandung akar, hewan kabur memanfaatkan kegelapan.'

        return sendWithTemplate(
          dino, m,
          decorate(`*❌ Gagal Berburu!*
│
│ ${gagalMsg}
│
│ *Status Setelah Gagal:*
│   ❤️  Health     : *-${healthLoss}* (sisa ${dbUser.health})
│   ⚡ Stamina    : *-${staminaLoss}* (sisa ${dbUser.stamina})
│   🥼 Armor Dur  : *-${armorLoss}* (sisa ${dbUser.armordurability})${armorRes.msg}
│   ⚔️  Sword Dur  : *-${swordLoss}* (sisa ${dbUser.sworddurability})${swordRes.msg}
│   ⚠️  Chance Gagal: ${Math.round(debuff.finalChanceGagal * 100)}%
│   (${debuff.jam?.nama || '-'} | ${debuff.musim?.nama || '-'})
│
│ ➤ *${usedPrefix}heal* pulihkan health
│ ➤ *${usedPrefix}eat* isi stamina`),
          { react: true, reactDone: '❌', mentions: [m.sender] }
        )
      }

      await sendWithTemplate(
        dino, m,
        decorate(`*🎯 Target Terlihat!*\n│\n│ Sekumpulan hewan buruan ditemukan! Membidik...`),
        { react: false, mentions: [m.sender] }
      )

      await delay(3000)

      // Hitung reward
      const reward     = hitungReward('hunting', Math.floor(Math.random() * 60000 + 10000), Math.floor(Math.random() * 15000 + 3000), 1, gearBonus)
      const seasonMult = reward.seasonMult
      const dropBonus  = getDropBonus()

      const genRandom = () => Math.min(CAP_HEWAN, Math.max(0,
        Math.round(Math.floor(Math.random() * 6) * gearBonus * seasonMult * (1 + dropBonus / 100))
      ))

      let hasil = {
        banteng: genRandom(), harimau: genRandom(), gajah:    genRandom(),
        kambing: genRandom(), panda:   genRandom(), buaya:    genRandom(),
        kerbau:  genRandom(), sapi:    genRandom(), monyet:   genRandom(),
        babihutan: genRandom(), babi:  genRandom(), ayam:     genRandom(),
      }

      // Cap total
      const totalHewan = Object.values(hasil).reduce((a, b) => a + b, 0)
      if (totalHewan > TOTAL_CAP) {
        const scale = TOTAL_CAP / totalHewan
        Object.keys(hasil).forEach(k => { hasil[k] = Math.floor(hasil[k] * scale) })
      }

      const healthLoss  = debuff.finalHealthLoss
      const staminaLoss = debuff.finalStaminaLoss
      const armorLoss   = ranNumb(15, 60)
      const swordLoss   = ranNumb(10, 55)

      Object.keys(hasil).forEach(k => { dbUser[k] = (dbUser[k] || 0) + hasil[k] })
      dbUser.exp     = (dbUser.exp || 0) + reward.finalExp
      dbUser.money   = (dbUser.money || 0) + reward.finalMoney
      dbUser.health  = Math.max(10, (dbUser.health || 0) - healthLoss)
      dbUser.stamina = Math.max(0, (dbUser.stamina || 0) - staminaLoss)
      const armorRes = applyDurabilityLoss(dbUser, 'armor', armorLoss)
      const swordRes = applyDurabilityLoss(dbUser, 'sword', swordLoss)

      return sendWithTemplate(
        dino, m,
        decorate(`*✅ Berburu Sukses!*
│
│ Banyak hasil buruan berhasil dibawa pulang!
│
│ ⚙️ Gear Bonus: ×${gearBonus.toFixed(2)}
│
│ *🎯 Hasil Buruan:*
│   🐂 Banteng    : *+${hasil.banteng}*
│   🐅 Harimau    : *+${hasil.harimau}*
│   🐘 Gajah      : *+${hasil.gajah}*
│   🐐 Kambing    : *+${hasil.kambing}*
│   🐼 Panda      : *+${hasil.panda}*
│   🐊 Buaya      : *+${hasil.buaya}*
│   🐃 Kerbau     : *+${hasil.kerbau}*
│   🐄 Sapi       : *+${hasil.sapi}*
│   🐒 Monyet     : *+${hasil.monyet}*
│   🐗 Babi Hutan : *+${hasil.babihutan}*
│   🐖 Babi       : *+${hasil.babi}*
│   🐔 Ayam       : *+${hasil.ayam}*
│
│   💰 Money : *+${reward.finalMoney.toLocaleString('id-ID')}*
│   ✨ EXP   : *+${reward.finalExp.toLocaleString('id-ID')}*
│
│ *Status Setelah Berburu:*
│   ❤️  Health     : *-${healthLoss}* (sisa ${dbUser.health})
│   ⚡ Stamina    : *-${staminaLoss}* (sisa ${dbUser.stamina})
│   🥼 Armor Dur  : *-${armorLoss}* (sisa ${dbUser.armordurability})${armorRes.msg}
│   ⚔️  Sword Dur  : *-${swordLoss}* (sisa ${dbUser.sworddurability})${swordRes.msg}
│
│ *⏱️ Efek Waktu & Musim:*
│   ${timeInfo}
│   🔢 Season Mult: ×${seasonMult} | Total: ×${reward.totalMult}
│
│ ➤ *${usedPrefix}pasar* untuk jual hasil buruan
│ ➤ *${usedPrefix}cook* untuk masak`),
        { react: true, reactDone: '✅', mentions: [m.sender] }
      )
    }

  }
}
