const { sendWithTemplate } = require('../../sendWithTemplate')
const { hitungReward, hitungDebuff, buildTimeInfo, getDropBonus } = require('./rpg-time-system.js')

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

    case 'mulung': 'menu'; {
      /* CONSTANTS */
      const TIMEOUT = 1800000 // 30 menit

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
      if ((dbUser.stamina || 0) < 20) {
        return sendWithTemplate(dino, m, decorate(`*❌ Stamina Tidak Cukup!*
│
│ Stamina kamu terlalu lemah untuk mulung.
│
│ Stamina Dibutuhkan : *20*
│ Stamina Kamu       : *${dbUser.stamina || 0}*
│
│ ➤ *${usedPrefix}eat* untuk mengisi stamina.`), { mentions: [m.sender] })
      }

      const now = Date.now()
      if (now - (dbUser.mulung || 0) < TIMEOUT) {
        const sisa = msToTime((dbUser.mulung + TIMEOUT) - now)
        return sendWithTemplate(dino, m, decorate(`*⏳ Masih Cape Bang!*
│
│ Kamu sudah mulung sebelumnya.
│
│ Tunggu: *${sisa}*`), { mentions: [m.sender] })
      }

      // 🔒 Set cooldown di awal biar ga bisa di-spam selama proses berjalan
      dbUser.mulung = now

      const debuff = hitungDebuff(Math.floor(Math.random() * 16) + 12, 0, 0, 0.10)
      const timeInfo = buildTimeInfo('mulung')

      await sendWithTemplate(dino, m, decorate(`*🗑️ Memulai Mulung...*
│
│ Kamu mengambil karung dan mulai berjalan menyusuri
│ jalanan mencari sampah...
│
│ ${timeInfo}`),
        { react: true, reactDone: '🗑️', mentions: [m.sender] })

      await delay(3000)
      await sendWithTemplate(dino, m, decorate(`*👀 Memilah Sampah...*
│
│ Kamu mulai memilah tumpukan sampah, mencari botol,
│ kaleng, dan kardus yang masih bisa dijual...`),
        { mentions: [m.sender] })
      await delay(3000)

      const gagal = Math.random() < debuff.finalChanceGagal
      if (gagal) {
        const staminaGagal = debuff.finalStaminaLoss + Math.floor(Math.random() * 10) + 12
        dbUser.stamina = (dbUser.stamina || 0) - staminaGagal

        let gagalMsg = '🐕 Dikejar Anjing!\n│\n│ Saat asik mulung, tiba-tiba anjing liar mengejarmu!\n│ Kamu lari pontang-panting sampai karungmu ketinggalan.'
        if (debuff.jam.jam >= 0 && debuff.jam.jam <= 5) {
          gagalMsg = '👮 Dicurigai Satpam!\n│\n│ Mulung subuh-subuh dikira maling! Satpam kejar sambil teriak-teriak!\n│ Kamu kabur tapi karungmu tertinggal.'
        } else if (debuff.musim.key === 'hujan') {
          gagalMsg = '🌧️ Banjir Datang Tiba-tiba!\n│\n│ Air meluap dan seluruh barang mulunganmu hanyut terbawa arus!\n│ Kamu selamat tapi tangan kosong.'
        }

        return sendWithTemplate(dino, m, decorate(`*❌ Gagal Mulung!*
│
│ ${gagalMsg}
│
│ ⚡ Stamina Berkurang : *-${staminaGagal}* (Sisa: ${dbUser.stamina})
│ ⚠️ Chance Gagal      : ${Math.round(debuff.finalChanceGagal * 100)}% (Jam: ${debuff.jam.nama})
│
│ ➤ *${usedPrefix}mulung* untuk mencoba lagi nanti.`),
          { react: true, reactDone: '❌', mentions: [m.sender] })
      }

      await sendWithTemplate(dino, m, decorate(`*💰 Menemukan Tumpukan Harta...*
│
│ Kamu menemukan tumpukan sampah yang banyak banget!
│ Karungmu mulai penuh terisi...`),
        { mentions: [m.sender] })
      await delay(3000)

      const baseMoney = Math.floor(Math.random() * 8000) + 2000
      const baseExp = Math.floor(Math.random() * 4000) + 1000
      const reward = hitungReward('mulung', baseMoney, baseExp, 1)
      const dropBonus = getDropBonus()

      const botolPoin = Math.floor((Math.floor(Math.random() * 1200) + 100) * reward.seasonMult)
      const kalengPoin = Math.floor((Math.floor(Math.random() * 1000) + 80) * reward.seasonMult)
      const kardusPoin = Math.floor((Math.floor(Math.random() * 1100) + 90) * reward.seasonMult)
      const staminaLoss = debuff.finalStaminaLoss

      const trashChance = 0.40 + (dropBonus / 200)
      const trashBonus = Math.random() < trashChance ? Math.floor(Math.random() * 30) + 5 : 0
      if (trashBonus > 0) dbUser.trash = (dbUser.trash || 0) + trashBonus

      dbUser.botol = (dbUser.botol || 0) + botolPoin
      dbUser.kaleng = (dbUser.kaleng || 0) + kalengPoin
      dbUser.kardus = (dbUser.kardus || 0) + kardusPoin
      dbUser.exp = (dbUser.exp || 0) + reward.finalExp
      dbUser.money = (dbUser.money || 0) + reward.finalMoney
      dbUser.stamina = (dbUser.stamina || 0) - staminaLoss

      // Rare drop
      let rareFindMsg = ''
      const rareBase = 0.005 + (dropBonus / 5000)
      const rareRoll = Math.random()
      if (rareRoll < rareBase) {
        const diamondFound = Math.floor(Math.random() * 3) + 1
        dbUser.diamond = (dbUser.diamond || 0) + diamondFound
        rareFindMsg = `│\n│ 💎 *LUCKY! Kamu menemukan ${diamondFound} Diamond tersembunyi!*`
      } else if (rareRoll < rareBase * 3) {
        const goldFound = Math.floor(Math.random() * 5) + 1
        dbUser.gold = (dbUser.gold || 0) + goldFound
        rareFindMsg = `│\n│ 🥇 *LUCKY! Kamu menemukan ${goldFound} Gold tersembunyi!*`
      }

      await sendWithTemplate(dino, m, decorate(`*✅ Mulung Sukses!*
│
│ Kamu mendapatkan hasil mulung:
│
│ 🍶 *+${fmt(botolPoin)} Botol*
│ 🥫 *+${fmt(kalengPoin)} Kaleng*
│ 📦 *+${fmt(kardusPoin)} Kardus*
${trashBonus > 0 ? `│ 🗑️ *+${trashBonus} Trash*` : ''}${rareFindMsg}
│
│ 💰 Money : *+${fmt(reward.finalMoney)}*
│ ✨ EXP   : *+${fmt(reward.finalExp)}*
│
│ 📊 *Status:*
│ ⚡ Stamina Berkurang : *-${staminaLoss}* (Sisa: ${dbUser.stamina})
│
│ ⏱️ *Efek Waktu & Musim:*
│ ${timeInfo}
│ 🔢 Total Multiplier: ×${reward.totalMult}
│
│ ➤ *${usedPrefix}pasar* untuk menjual hasil mulung.
│ ➤ *${usedPrefix}inv* untuk cek semua item.`),
        { react: true, reactDone: '✅', mentions: [m.sender] })

      setTimeout(() => {
        sendWithTemplate(dino, m, decorate(`*⏰ Waktunya Mulung Lagi!*
│
│ ➤ *${usedPrefix}mulung*`), { mentions: [m.sender] })
      }, TIMEOUT)
    }

  }
}