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

    case 'nebang': 'menu'; {
      /* CONSTANTS */
      const TIMEOUT = 3600000 // 60 menit
      const AXE_BONUS = { 0: 1.0, 1: 1.10, 2: 1.25, 3: 1.45, 4: 1.70, 5: 2.0 }
      const axeTierName = [
        '❌ Tidak punya',
        '🪵 Wooden Axe',
        '🪨 Stone Axe',
        '⚪ Iron Axe',
        '💎 Diamond Axe',
        '🔥 Netherite Axe'
      ]

      /* HELPER */
      function delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)) }
      function msToTime(duration) {
        let seconds = Math.floor((duration / 1000) % 60)
        let minutes = Math.floor((duration / (1000 * 60)) % 60)
        let hours = Math.floor((duration / (1000 * 60 * 60)) % 24)
        return `${hours} jam ${minutes} menit ${seconds} detik`
      }

      /* HANDLER */
      const dbUser = global.db.data.users[m.sender]
      const time = (dbUser.nebang || 0) + TIMEOUT

      // Inisialisasi axe
      dbUser.axe           = dbUser.axe           || 0
      dbUser.axedurability = dbUser.axedurability  || 0

      const axeBonus = AXE_BONUS[dbUser.axe] || 1.0
      const hasAxe = dbUser.axe > 0

      if (!hasAxe) {
        return sendWithTemplate(
          dino, m,
          decorate(`*🪓 Kapak Dibutuhkan!*
│
│ Kamu tidak bisa menebang pohon tanpa kapak!
│ Sama seperti berkebon butuh cangkul, berburu butuh senjata — menebang wajib punya kapak.
│
│ 🪓 *Kapak Kamu:* ❌ Tidak punya
│
│ ➤ *${usedPrefix}craft axe* untuk membuat kapak kayu.
│    Bahan: 15 Wood + 10 Iron`),
          { mentions: [m.sender] }
        )
      }

      if ((dbUser.stamina || 0) < 15) {
        return sendWithTemplate(
          dino, m,
          decorate(`*❌ Stamina Tidak Cukup!*
│
│ Stamina kamu terlalu lemah untuk menebang pohon.
│
│ Stamina Dibutuhkan : *15*
│ Stamina Kamu       : *${dbUser.stamina || 0}*
│
│ ➤ *${usedPrefix}eat* untuk mengisi stamina`),
          { mentions: [m.sender] }
        )
      }

      if (Date.now() - (dbUser.nebang || 0) < TIMEOUT) {
        return sendWithTemplate(
          dino, m,
          decorate(`*⏳ Masih Cape Bang!*
│
│ Kamu sudah menebang pohon sebelumnya.
│
│ Tunggu: *${msToTime(time - Date.now())}*`),
          { mentions: [m.sender] }
        )
      }

      // 🔒 Set cooldown di awal biar ga bisa di-spam selama proses berjalan
      dbUser.nebang = Date.now()

      // TIME SYSTEM
      const debuff = hitungDebuff(
        Math.floor(Math.random() * 16) + 8,
        0, 0,
        0.20
      )
      const timeInfo = buildTimeInfo('wood')

      await sendWithTemplate(
        dino, m,
        decorate(`*🪓 Memulai Menebang Pohon...*
│
│ Kamu berjalan masuk ke dalam hutan dan mencari pohon yang tepat...
│
│ 🪓 *Kapak:* ${axeTierName[dbUser.axe]} (Bonus ×${axeBonus})
│
${timeInfo.split('\n').map(l => `│ ${l}`).join('\n')}`),
        { react: true, reactDone: '🪓', mentions: [m.sender] }
      )

      await delay(3000)

      await sendWithTemplate(
        dino, m,
        decorate(`*🌳 Menghantam Batang Pohon...*
│
│ Kapak kamu mulai menghantam batang pohon besar, suara dentuman bergema di hutan!`),
        { mentions: [m.sender] }
      )

      await delay(3000)

      const gagal = Math.random() < debuff.finalChanceGagal
      if (gagal) {
        const staminaGagal = debuff.finalStaminaLoss + Math.floor(Math.random() * 8) + 6
        dbUser.stamina -= staminaGagal

        setTimeout(() => {
          dino.sendMessage(from, {
            text: decorate(`*⏰ Waktunya Menebang Pohon Lagi!*
│
│ ➤ *${usedPrefix}nebang*`)
          }, { quoted: m })
        }, TIMEOUT)

        return sendWithTemplate(
          dino, m,
          decorate(`*🐝 Diserang Lebah!*
│
│ Saat menebang, sarang lebah jatuh dari pohon dan menyerangmu!
│ Kamu lari terbirit-birit tanpa membawa kayu apapun.
│
│ ⚡ Stamina Berkurang: *-${staminaGagal}* (Sisa: ${dbUser.stamina})
│ ⚠️ Chance Gagal: ${Math.round(debuff.finalChanceGagal * 100)}% (Jam: ${debuff.jam.nama})
${debuff.musim.staminaDrainBonus > 0 ? `│ 🌡️ Kondisi ${debuff.musim.nama} memperburuk keadaan!\n` : ''}│
│ ➤ *${usedPrefix}nebang* untuk mencoba lagi nanti`),
          { react: true, reactDone: '❌', mentions: [m.sender] }
        )
      }

      await sendWithTemplate(
        dino, m,
        decorate(`*🪵 Pohon Mulai Roboh...*
│
│ Pohon besar itu mulai miring dan roboh dengan keras! Kamu segera memotong dahan dan mengumpulkan kayu...`),
        { mentions: [m.sender] }
      )

      await delay(3000)

      const baseMoney = Math.floor(Math.random() * 15000) + 3000
      const baseExp = Math.floor(Math.random() * 8000) + 2000
      const reward = hitungReward('wood', baseMoney, baseExp, 1)
      const dropBonus = getDropBonus()

      // Items dipengaruhi season (Hujan ×1.3, Kemarau ×0.9, Gugur ×1.2) + axe bonus
      const woodPoin   = Math.floor((Math.floor(Math.random() * 2300) + 200) * reward.seasonMult * axeBonus)
      const stringPoin = Math.floor(Math.random() * 80) + 5
      const staminaLoss = debuff.finalStaminaLoss

      // Bonus rock — chance lebih besar waktu pagi/weekend
      const bonusRockChance = 0.30 + (dropBonus / 200)
      let bonusRock = Math.random() < bonusRockChance ? Math.floor(Math.random() * 20) + 5 : 0
      if (bonusRock > 0) dbUser.rock = (dbUser.rock || 0) + bonusRock

      // Kurangi durability axe saat nebang
      let axeRes = { msg: '' }
      if (dbUser.axe > 0) {
        const axeLoss = 3 + Math.floor(Math.random() * 3)
        axeRes = applyDurabilityLoss(dbUser, 'axe', axeLoss)
      }

      dbUser.wood   = (dbUser.wood || 0) + woodPoin
      dbUser.string = (dbUser.string || 0) + stringPoin
      dbUser.exp    = (dbUser.exp || 0) + reward.finalExp
      dbUser.money  = (dbUser.money || 0) + reward.finalMoney
      dbUser.stamina -= staminaLoss

      setTimeout(() => {
        dino.sendMessage(from, {
          text: decorate(`*⏰ Waktunya Menebang Pohon Lagi!*
│
│ ➤ *${usedPrefix}nebang*`)
        }, { quoted: m })
      }, TIMEOUT)

      return sendWithTemplate(
        dino, m,
        decorate(`*✅ Menebang Pohon Sukses!*
│
│ Kamu mendapatkan hasil tebangan:
│
│ 🪵 *+${woodPoin} Wood*
│ 🕸️ *+${stringPoin} String*
${bonusRock > 0 ? `│ 🪨 *+${bonusRock} Rock* (dari akar pohon!)\n` : ''}│
│ 💰 Money : *+${reward.finalMoney.toLocaleString('id-ID')}*
│ ✨ EXP   : *+${reward.finalExp.toLocaleString('id-ID')}*
│
│ 📊 *Status:*
│ ⚡ Stamina Berkurang : *-${staminaLoss}* (Sisa: ${dbUser.stamina})
│ 🪓 Kapak: ${axeTierName[dbUser.axe]} (×${axeBonus} bonus kayu) — Dur: ${dbUser.axedurability}${axeRes.msg}
│
│ ⏱️ *Efek Waktu & Musim:*
${timeInfo.split('\n').map(l => `│ ${l}`).join('\n')}
│ 🔢 Total Multiplier: ×${reward.totalMult}
│
│ ➤ *${usedPrefix}jual* untuk menjual hasil tebanganmu.
│ ➤ *${usedPrefix}inventory* untuk cek semua item.`),
        { react: true, reactDone: '✅', mentions: [m.sender] }
      )
    }

  }
}