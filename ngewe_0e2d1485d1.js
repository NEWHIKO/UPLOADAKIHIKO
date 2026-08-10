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

    case 'ngewe': 'menu'; {
      /* CONSTANTS */
      const COOLDOWN = 1800000 // 30 menit

      /* HELPER */
      function clockString(ms) {
        let h = Math.floor(ms / 3600000)
        let mn = Math.floor(ms / 60000) % 60
        let s = Math.floor(ms / 1000) % 60
        return [h, mn, s].map(v => v.toString().padStart(2, '0')).join(':')
      }
      function delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)) }

      /* HANDLER */
      const dbUser = global.db.data.users[m.sender]
      const now = Date.now()
      const sisaCooldown = COOLDOWN - (now - (dbUser.ngewe || 0))
      const name = dino.getName ? dino.getName(m.sender) : (pushname || m.sender.split('@')[0])

      // Stamina check
      const staminaNeed = Math.floor(Math.random() * 21) + 30
      if ((dbUser.stamina || 0) < staminaNeed) {
        return sendWithTemplate(
          dino, m,
          decorate(`*❌ Stamina Tidak Cukup!*
│
│ Stamina Dibutuhkan : *${staminaNeed}*
│ Stamina Kamu       : *${dbUser.stamina || 0}*
│
│ ➤ *${usedPrefix}eat* untuk mengisi stamina`),
          { mentions: [m.sender] }
        )
      }

      if (sisaCooldown > 0) {
        return sendWithTemplate(
          dino, m,
          decorate(`*⏳ Masih Kelelahan!*
│
│ Sepertinya kamu sudah kecapekan.
│ Silahkan istirahat dulu selama *${clockString(sisaCooldown)}*`),
          { mentions: [m.sender] }
        )
      }

      // 🔒 Set cooldown di awal biar ga bisa di-spam selama proses berjalan (27 detik delay total!)
      dbUser.ngewe = now

      // TIME SYSTEM
      // Malam (×1.35) dan Semi/normal. Dini hari penalty.
      const debuff = hitungDebuff(staminaNeed, Math.floor(Math.random() * 16) + 5, 0, 0.12)
      const timeInfo = buildTimeInfo('ngelonte') // pakai multiplier ngelonte (semi ×1.2, dll)

      // REWARD — base money 8k–40k, exp 2k–12k
      const rewardCtx = hitungReward('ngelonte',
        Math.floor(Math.random() * 32001) + 8000,
        Math.floor(Math.random() * 10001) + 2000,
        1
      )

      const money = rewardCtx.finalMoney
      const exp = rewardCtx.finalExp
      const staminaLoss = debuff.finalStaminaLoss
      const healthLoss = debuff.finalHealthLoss

      // Rare bonus
      let bonusMsg = ''
      const rareRoll = Math.random()
      if (rareRoll < 0.04) {
        const potion = Math.floor(Math.random() * 2) + 1
        dbUser.potion = (dbUser.potion || 0) + potion
        bonusMsg = `│ 🧪 Bonus Potion: *+${potion}* (pelanggan kasih tip!)`
      } else if (rareRoll < 0.08) {
        dbUser.diamond = (dbUser.diamond || 0) + 1
        bonusMsg = `│ 💎 Bonus Diamond: *+1* (pelanggan royal banget!)`
      } else if (rareRoll < 0.25) {
        const trash = Math.floor(Math.random() * 6) + 3
        dbUser.trash = (dbUser.trash || 0) + trash
        bonusMsg = `│ 🗑️ Dapat Sampah: *+${trash}* (berantakan abis kegiatan...)`
      }

      // Kirim pesan bertahap
      await sendWithTemplate(
        dino, m,
        decorate(`*🔍 Mencari Pelanggan...*`),
        { react: true, reactDone: '🔍', mentions: [m.sender] }
      )
      await delay(10000)

      await sendWithTemplate(
        dino, m,
        decorate(`*👋 Mendapatkan Pelanggan....*`),
        { mentions: [m.sender] }
      )
      await delay(5000)

      await sendWithTemplate(
        dino, m,
        decorate(`*🏃 Mulai Berkegiatan.....*`),
        { mentions: [m.sender] }
      )
      await delay(5000)

      await sendWithTemplate(
        dino, m,
        decorate(`*😣 Ahhhh, Sakitttt!! >////<*
│
│ Crotttt.....`),
        { mentions: [m.sender] }
      )
      await delay(5000)

      await sendWithTemplate(
        dino, m,
        decorate(`*😮‍💨 Ahhhhhh....*`),
        { mentions: [m.sender] }
      )
      await delay(2000)

      // Apply stats
      dbUser.money = (dbUser.money || 0) + money
      dbUser.exp = (dbUser.exp || 0) + exp
      dbUser.stamina = Math.max(0, (dbUser.stamina || 0) - staminaLoss)
      dbUser.health = Math.max(5, (dbUser.health || 0) - healthLoss)

      return sendWithTemplate(
        dino, m,
        decorate(`*✅ Hasil Kegiatan ${name}*
│
${timeInfo.split('\n').map(l => `│ ${l}`).join('\n')}
│ 🔢 Multiplier: ×${rewardCtx.totalMult}
│
│ 💰 Money  : *+${money.toLocaleString('id-ID')}*
│ ✨ Exp    : *+${exp.toLocaleString('id-ID')}*
│ ❤️ Health : *-${healthLoss}* (Sisa: ${dbUser.health})
│ ⚡ Stamina: *-${staminaLoss}* (Sisa: ${dbUser.stamina})
${bonusMsg ? bonusMsg + '\n' : ''}│
│ ⏳ Cooldown: *30 menit*`),
        { react: true, reactDone: '✅', mentions: [m.sender] }
      )
    }

  }
}