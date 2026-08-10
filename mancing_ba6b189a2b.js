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

    case 'mancing': 'menu'; {
      /* CONSTANTS */
      const TIMEOUT = 2700000 // 45 menit

      /* HELPER */
      function ranNumb(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min }
      const dbUser = global.db.data.users[m.sender]
      const fmt = (n) => (n || 0).toLocaleString('id-ID')

      function delay(ms) { return new Promise(r => setTimeout(r, ms)) }
      function msToTime(duration) {
        let seconds = Math.floor((duration / 1000) % 60)
        let minutes = Math.floor((duration / (1000 * 60)) % 60)
        let hours = Math.floor((duration / (1000 * 60 * 60)) % 24)
        return `${hours} jam ${minutes} menit ${seconds} detik`
      }

      /* HANDLER */
      if (!dbUser.fishingrod || dbUser.fishingrod === 0) {
        return sendWithTemplate(dino, m, decorate(`*❌ Fishing Rod Tidak Ada!*
│
│ Kamu butuh Fishing Rod sebelum bisa mancing.
│
│ ➤ *${usedPrefix}craft fishingrod*`), { mentions: [m.sender] })
      }

      if ((dbUser.stamina || 0) < 20) {
        return sendWithTemplate(dino, m, decorate(`*❌ Stamina Tidak Cukup!*
│
│ Stamina Dibutuhkan : *20*
│ Stamina Kamu       : *${dbUser.stamina || 0}*
│
│ ➤ *${usedPrefix}eat* untuk mengisi stamina.`), { mentions: [m.sender] })
      }

      const now = Date.now()
      if (now - (dbUser.lastfishing || 0) < TIMEOUT) {
        const sisa = msToTime((dbUser.lastfishing + TIMEOUT) - now)
        return sendWithTemplate(dino, m, decorate(`*⏳ Masih Cape Bang!*
│
│ Kamu sudah mancing sebelumnya.
│
│ Tunggu: *${sisa}*`), { mentions: [m.sender] })
      }

      // 🔒 Set cooldown di awal biar ga bisa di-spam selama proses berjalan
      dbUser.lastfishing = now

      const rodMultiplier = [0, 1, 1.5, 2, 3, 4][dbUser.fishingrod] || 1

      const debuff = hitungDebuff(ranNumb(12, 28), 0, ranNumb(15, 90), 0.10)
      const timeInfo = buildTimeInfo('fishing')

      await sendWithTemplate(dino, m, decorate(`*🎣 Memulai Mancing...*
│
│ Kamu menuju ke tepi sungai dan menyiapkan Fishing Rod...
│
│ 🎣 Fishing Rod Tier : *${dbUser.fishingrod}* (×${rodMultiplier} multiplier)
│
│ ${timeInfo}`),
        { react: true, reactDone: '🎣', mentions: [m.sender] })

      await delay(3000)
      await sendWithTemplate(dino, m, decorate(`*🌊 Melempar Kail...*
│
│ Kamu melempar kail ke dalam air dan mulai menunggu dengan sabar...`),
        { mentions: [m.sender] })
      await delay(3000)

      const gagal = Math.random() < debuff.finalChanceGagal
      if (gagal) {
        const staminaLoss = debuff.finalStaminaLoss
        const rodLoss = debuff.finalDurabilityLoss

        dbUser.stamina = (dbUser.stamina || 0) - staminaLoss
        const rodRes = applyDurabilityLoss(dbUser, 'fishingrod', rodLoss)

        let gagalMsg = 'Senar pancingmu putus ditarik ikan besar!\nTidak berhasil mendapatkan ikan apapun.'
        if (debuff.musim.key === 'kemarau') gagalMsg = 'Air sungai surut karena kemarau!\nIkan-ikan sembunyi di dasar dan kailmu tidak sampai.'
        else if (debuff.jam.jam >= 0 && debuff.jam.jam <= 5) gagalMsg = 'Mancing subuh-subuh, ngantuk dan kail kesesretan!\nTidak ada ikan yang kena.'

        return sendWithTemplate(dino, m, decorate(`*❌ Gagal Mancing!*
│
│ ${gagalMsg}
│
│ 📊 *Status Setelah Gagal:*
│ ⚡ Stamina Berkurang        : *-${staminaLoss}* (Sisa: ${dbUser.stamina})
│ 🎣 Durability Fishing Rod   : *-${rodLoss}* (Sisa: ${dbUser.fishingroddurability})${rodRes.msg}
│ ⚠️ Chance Gagal             : ${Math.round(debuff.finalChanceGagal * 100)}% (${debuff.jam.nama} | ${debuff.musim.nama})
${dbUser.fishingrod === 0 ? `│\n│ ❌ Fishing Rod rusak! ➤ *${usedPrefix}craft fishingrod*` : ''}
│
│ ➤ *${usedPrefix}eat* untuk mengisi stamina.`),
          { react: true, reactDone: '❌', mentions: [m.sender] })
      }

      await sendWithTemplate(dino, m, decorate(`*🐟 Ada yang Menarik Kail!*
│
│ Pelampung bergerak! Kamu segera menarik kail dengan sekuat tenaga...`),
        { mentions: [m.sender] })
      await delay(3000)

      const reward = hitungReward('fishing', 0, 0, 1)
      const seasonMult = reward.seasonMult

      // CAP per item tergantung rod tier
      const ROD_ITEM_CAP = dbUser.fishingrod * 8
      const capItem = (val) => Math.min(val, ROD_ITEM_CAP)

      // u.ikan (generic) dihapus — hanya seafood spesifik yang dipertahankan
      const hasil = {
        paus:     Math.min(12, capItem(Math.max(0, Math.round(ranNumb(0, 4)  * rodMultiplier * seasonMult)))),
        bawal:    Math.min(12, capItem(Math.max(0, Math.round(ranNumb(0, 6)  * rodMultiplier * seasonMult)))),
        lele:     Math.min(12, capItem(Math.max(0, Math.round(ranNumb(1, 10) * rodMultiplier * seasonMult)))),
        nila:     Math.min(12, capItem(Math.max(0, Math.round(ranNumb(0, 7)  * rodMultiplier * seasonMult)))),
        kepiting: Math.min(12, capItem(Math.max(0, Math.round(ranNumb(0, 4)  * rodMultiplier * seasonMult)))),
        udang:    Math.min(12, capItem(Math.max(0, Math.round(ranNumb(0, 5)  * rodMultiplier * seasonMult))))
      }

      // CAP total item per run: maks 80 ekor semua jenis gabungan
      const TOTAL_FISH_CAP = 80
      const totalIkan = Object.values(hasil).reduce((a, b) => a + b, 0)
      if (totalIkan > TOTAL_FISH_CAP) {
        const scale = TOTAL_FISH_CAP / totalIkan
        Object.keys(hasil).forEach(k => { hasil[k] = Math.floor(hasil[k] * scale) })
      }

      const baseMoney = Object.values(hasil).reduce((a, b) => a + b, 0) * 500
      const baseExp = Object.values(hasil).reduce((a, b) => a + b, 0) * 200
      const rewardFull = hitungReward('fishing', Math.max(baseMoney, 1000), Math.max(baseExp, 500), 1)

      const staminaLoss = debuff.finalStaminaLoss
      const rodLoss = debuff.finalDurabilityLoss

      Object.keys(hasil).forEach(key => {
        dbUser[key] = (dbUser[key] || 0) + hasil[key]
      })
      dbUser.stamina = (dbUser.stamina || 0) - staminaLoss
      const rodRes = applyDurabilityLoss(dbUser, 'fishingrod', rodLoss)

      return sendWithTemplate(dino, m, decorate(`*✅ Mancing Sukses!*
│
│ Kamu berhasil mendapatkan banyak hasil tangkapan!
│
│ ⚙️ Gear Bonus: ×${rodMultiplier} (Fishing Rod Tier ${dbUser.fishingrod === 0 ? 'Rusak' : dbUser.fishingrod})
│
│ 🐟 *Hasil Tangkapan:*
│ 🐳 Ikan Paus : *+${hasil.paus} ekor*
│ 🐡 Ikan Bawal: *+${hasil.bawal} ekor*
│ 🐠 Ikan Lele : *+${hasil.lele} ekor*
│ 🐠 Ikan Nila : *+${hasil.nila} ekor*
│ 🦀 Kepiting  : *+${hasil.kepiting} ekor*
│ 🦐 Udang     : *+${hasil.udang} ekor*
│
│ 📊 *Status Setelah Mancing:*
│ ⚡ Stamina Berkurang        : *-${staminaLoss}* (Sisa: ${dbUser.stamina})
│ 🎣 Durability Fishing Rod   : *-${rodLoss}* (Sisa: ${dbUser.fishingroddurability})${rodRes.msg}
│
│ ⏱️ *Efek Waktu & Musim:*
│ ${timeInfo}
│ 🔢 Season Mult: ×${seasonMult} | Total: ×${rewardFull.totalMult}
${dbUser.fishingrod === 0 ? `│\n│ ❌ Fishing Rod rusak! ➤ *${usedPrefix}craft fishingrod*` : ''}
│
│ ➤ *${usedPrefix}kolam* untuk melihat hasil tangkapan.
│ ➤ *${usedPrefix}pasar* untuk menjual hasil mancing.`),
        { react: true, reactDone: '✅', mentions: [m.sender] })

      setTimeout(() => {
        sendWithTemplate(dino, m, decorate(`*⏰ Waktunya Mancing Lagi!*
│
│ ➤ *${usedPrefix}mancing*`), { mentions: [m.sender] })
      }, TIMEOUT)
    }

  }
}