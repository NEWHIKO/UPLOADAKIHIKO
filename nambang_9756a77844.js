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

    case 'nambang': 'menu'; {
      /* CONSTANTS */
      const TIMEOUT = 1800000 // 30 menit

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
      const time = (dbUser.nambang || 0) + TIMEOUT

      // Wajib punya pickaxe
      if (!dbUser.pickaxe || dbUser.pickaxe === 0) {
        return sendWithTemplate(
          dino, m,
          decorate(`*❌ Pickaxe Tidak Ada!*
│
│ Kamu butuh Pickaxe untuk menambang.
│
│ ➤ *${usedPrefix}craft pickaxe*`),
          { mentions: [m.sender] }
        )
      }

      if ((dbUser.stamina || 0) < 40) {
        return sendWithTemplate(
          dino, m,
          decorate(`*❌ Stamina Tidak Cukup!*
│
│ Stamina kamu terlalu lemah untuk menambang.
│
│ Stamina Dibutuhkan : *40*
│ Stamina Kamu       : *${dbUser.stamina || 0}*
│
│ ➤ *${usedPrefix}eat* untuk mengisi stamina`),
          { mentions: [m.sender] }
        )
      }

      if (Date.now() - (dbUser.nambang || 0) < TIMEOUT) {
        return sendWithTemplate(
          dino, m,
          decorate(`*⏳ Masih Cape Bang!*
│
│ Kamu sudah menambang sebelumnya.
│
│ Tunggu: *${msToTime(time - Date.now())}*`),
          { mentions: [m.sender] }
        )
      }

      // 🔒 Set cooldown di awal biar ga bisa di-spam selama proses berjalan
      dbUser.nambang = Date.now()

      // TIME SYSTEM
      const debuff = hitungDebuff(
        Math.floor(Math.random() * 21) + 30,
        0, 0,
        0.15
      )
      const timeInfo = buildTimeInfo('mining')

      await sendWithTemplate(
        dino, m,
        decorate(`*⛏️ Memulai Menambang...*
│
│ Kamu mulai masuk ke dalam gua dan menyiapkan peralatan...
│
│ ⛏️ *Pickaxe Tier:* ${dbUser.pickaxe} (Durability: ${dbUser.pickaxedurability})
│
${timeInfo.split('\n').map(l => `│ ${l}`).join('\n')}`),
        { react: true, reactDone: '⛏️', mentions: [m.sender] }
      )

      await delay(3000)

      await sendWithTemplate(
        dino, m,
        decorate(`*🪨 Menggali Bebatuan...*
│
│ Kamu mulai menghantam dinding gua dengan Pickaxe, debu dan batu beterbangan!`),
        { mentions: [m.sender] }
      )

      await delay(3000)

      const gagal = Math.random() < debuff.finalChanceGagal
      if (gagal) {
        const staminaGagal = debuff.finalStaminaLoss + Math.floor(Math.random() * 15)
        dbUser.stamina -= staminaGagal

        // Durability pickaxe tetap aus meski gagal
        const pickaxeLossGagal = Math.floor(Math.random() * 20) + 10
        const pickResGagal = applyDurabilityLoss(dbUser, 'pickaxe', pickaxeLossGagal)

        setTimeout(() => {
          dino.sendMessage(from, {
            text: decorate(`*⏰ Waktunya Menambang Lagi!*
│
│ ➤ *${usedPrefix}nambang*`)
          }, { quoted: m })
        }, TIMEOUT)

        return sendWithTemplate(
          dino, m,
          decorate(`*💥 Gua Runtuh!*
│
│ Dinding gua tiba-tiba runtuh saat kamu menggali!
│ Kamu berhasil kabur tapi tidak membawa apapun.
│
│ ⚡ Stamina Berkurang        : *-${staminaGagal}* (Sisa: ${dbUser.stamina})
│ ⛏️ Durability Pickaxe       : *-${pickaxeLossGagal}* (Sisa: ${dbUser.pickaxedurability})${pickResGagal.msg}
│ ⚠️ Chance Gagal: ${Math.round(debuff.finalChanceGagal * 100)}% (Jam: ${debuff.jam.nama} | Musim: ${debuff.musim.nama})
│
│ ➤ *${usedPrefix}nambang* untuk mencoba lagi nanti`),
          { react: true, reactDone: '❌', mentions: [m.sender] }
        )
      }

      await sendWithTemplate(
        dino, m,
        decorate(`*🔦 Menemukan Vena Mineral...*
│
│ Kamu menemukan lapisan mineral yang kaya! Segera kamu gali sebanyak mungkin...`),
        { mentions: [m.sender] }
      )

      await delay(3000)

      const baseMoney = Math.floor(Math.random() * 15000) + 3000
      const baseExp = Math.floor(Math.random() * 8000) + 2000

      // Pickaxe tier bonus: ×1.1 per tier, cap ×2.0 (tier1=×1.1, tier5=×2.0)
      const pickaxeTierBonus = Math.min(1.0 + (dbUser.pickaxe * 0.1), 2.0)
      const reward = hitungReward('mining', baseMoney, baseExp, 1)
      const dropBonus = getDropBonus()

      const rockPoin    = Math.floor((Math.floor(Math.random() * 200) + 10) * reward.seasonMult * pickaxeTierBonus)
      const coalPoin    = Math.floor((Math.floor(Math.random() * 20) + 1) * reward.seasonMult * pickaxeTierBonus)
      const ironPoin    = Math.floor((Math.floor(Math.random() * 30) + 5) * reward.seasonMult * pickaxeTierBonus)
      const goldPoin    = Math.random() < (0.35 + dropBonus / 200) ? Math.floor((Math.floor(Math.random() * 4) + 1) * pickaxeTierBonus) : 0
      const diamondPoin = Math.random() < (0.20 + dropBonus / 300) ? Math.floor((Math.floor(Math.random() * 3) + 1) * pickaxeTierBonus) : 0
      const staminaLoss = debuff.finalStaminaLoss

      dbUser.rock    = (dbUser.rock || 0) + rockPoin
      dbUser.coal    = (dbUser.coal || 0) + coalPoin
      dbUser.iron    = (dbUser.iron || 0) + ironPoin
      dbUser.gold    = (dbUser.gold || 0) + goldPoin
      dbUser.diamond = (dbUser.diamond || 0) + diamondPoin
      dbUser.exp     = (dbUser.exp || 0) + reward.finalExp
      dbUser.money   = (dbUser.money || 0) + reward.finalMoney

      const pickaxeLoss = Math.floor(Math.random() * 30) + 15
      const pickResOk = applyDurabilityLoss(dbUser, 'pickaxe', pickaxeLoss)
      dbUser.stamina -= staminaLoss

      setTimeout(() => {
        dino.sendMessage(from, {
          text: decorate(`*⏰ Waktunya Menambang Lagi!*
│
│ ➤ *${usedPrefix}nambang*`)
        }, { quoted: m })
      }, TIMEOUT)

      return sendWithTemplate(
        dino, m,
        decorate(`*✅ Menambang Sukses!*
│
│ Kamu mendapatkan hasil tambang:
│
│ 🪨 *+${rockPoin} Rock*
│ 🖤 *+${coalPoin} Coal*
│ 🔩 *+${ironPoin} Iron*
│ 🥇 *+${goldPoin} Gold*
│ 💎 *+${diamondPoin} Diamond*
│
│ 💰 Money : *+${reward.finalMoney.toLocaleString('id-ID')}*
│ ✨ EXP   : *+${reward.finalExp.toLocaleString('id-ID')}*
│
│ 📊 *Status:*
│ ⚡ Stamina Berkurang      : *-${staminaLoss}* (Sisa: ${dbUser.stamina})
│ ⛏️ Durability Pickaxe     : *-${pickaxeLoss}* (Sisa: ${dbUser.pickaxedurability})${pickResOk.msg}
│ 🔨 Pickaxe Tier Bonus     : *×${pickaxeTierBonus.toFixed(1)}*
│
│ ⏱️ *Efek Waktu & Musim:*
${timeInfo.split('\n').map(l => `│ ${l}`).join('\n')}
│ 🔢 Total Multiplier: ×${reward.totalMult}
│
│ ➤ *${usedPrefix}jual* untuk menjual hasil tambangmu.
│ ➤ *${usedPrefix}inventory* untuk cek semua item.`),
        { react: true, reactDone: '✅', mentions: [m.sender] }
      )
    }

  }
}