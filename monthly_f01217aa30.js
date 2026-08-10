const { sendWithTemplate } = require('../../../sendWithTemplate')
const { getMonthlyBonus } = require('../rpg-time-system.js')

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

    case 'monthly': 'menu'; {
      /* CONSTANTS */
      const timeout = 2592000000 // 30 hari

      /* HELPER */
      const u = global.db.data.users[m.sender]
      function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min }
      function pickRandom(list) { return list[Math.floor(Math.random() * list.length)] }
      function msToTime(duration) {
        let months = Math.floor(duration / (1000 * 60 * 60 * 24 * 30))
        let days = Math.floor((duration / (1000 * 60 * 60 * 24)) % 30)
        let hours = Math.floor((duration / (1000 * 60 * 60)) % 24)
        let minutes = Math.floor((duration / (1000 * 60)) % 60)
        let seconds = Math.floor((duration / 1000) % 60)
        return `${months} bulan ${days} hari ${hours} jam ${minutes} menit ${seconds} detik`
      }

      /* HANDLER */
      let time = (u.rpgmonthly || 0) + timeout
      if (new Date() - (u.rpgmonthly || 0) < timeout) {
        return sendWithTemplate(
          dino, m,
          decorate(`*⏳ Sudah Klaim!*
│
│ Kamu sudah klaim hadiah monthly bulan ini.
│
│ Tunggu: *${msToTime(time - new Date())}*`),
          { react: false, mentions: [m.sender] }
        )
      }

      // Generate reward dengan monthly bonus dari time system
      const monthBonus = getMonthlyBonus()
      // CAP multiplier monthly ×1.20 untuk mencegah inflasi reward bulan tertentu
      const monthMult = Math.min(monthBonus.mult, 1.20)

      let exp = rand(40000, 150000)
      let money = rand(100000, 500000)

      // CAP BASE REWARD sebelum multiplier (anti-inflasi)
      const moneyCap = 500000
      const expCap   = 150000
      money = Math.min(money, moneyCap)
      exp   = Math.min(exp, expCap)

      // Terapkan monthly multiplier (sudah di-cap ×1.20)
      money = Math.floor(money * monthMult)
      exp   = Math.floor(exp   * monthMult)

      // CAP FINAL reward setelah multiplier
      money = Math.min(money, 600000)
      exp   = Math.min(exp,   180000)

      u.money = (u.money || 0) + money
      u.exp   = (u.exp   || 0) + exp

      // Bonus bulanan
      let bonusMsg = ''
      let mBonus = Math.random()
      if (mBonus < 0.15) {
        u.mythic = (u.mythic || 0) + 1
        bonusMsg = `│ 🟣 Bonus  : *+1 Mythic Crate*`
      } else if (mBonus < 0.35) {
        u.uncommon = (u.uncommon || 0) + 2
        bonusMsg = `│ 🟢 Bonus  : *+2 Uncommon Crate*`
      } else if (mBonus < 0.55) {
        let diamond = rand(1, 3)
        u.diamond = (u.diamond || 0) + diamond
        bonusMsg = `│ 💎 Bonus  : *+${diamond} Diamond*`
      } else if (mBonus < 0.72) {
        let iron = rand(20, 40)
        u.iron = (u.iron || 0) + iron
        bonusMsg = `│ 🔩 Bonus  : *+${iron} Iron*`
      } else {
        let potion = rand(2, 4)
        u.potion = (u.potion || 0) + potion
        bonusMsg = `│ 🧪 Bonus  : *+${potion} Potion*`
      }

      let sapaan = pickRandom([
        '📅 Sebulan penuh menunggu, akhirnya tiba!',
        '🏅 Sabar sebulan, reward melimpah!',
        '🌙 Bulan baru, rezeki baru!',
        '💫 Sebulan berlalu, reward menantimu!',
        '🎊 Akhir bulan selalu yang paling ditunggu!'
      ])

      let statusTag = '🆓 *FREE*'

      u.rpgmonthly = new Date() * 1

      return sendWithTemplate(
        dino, m,
        decorate(`*🎁 Hadiah Monthly!*
│
│ ${sapaan}
│ Status: ${statusTag}
│
│ 🗓️ *${monthBonus.nama}* — ×${monthBonus.mult}
│ ${monthBonus.bonusMsg ? `💡 ${monthBonus.bonusMsg}` : ''}
│
│ 🎁 *Reward:*
│ ✨ EXP    : *+${exp.toLocaleString('id-ID')}*
│ 💰 Money  : *+${money.toLocaleString('id-ID')}*
${bonusMsg}
│
│ ➤ Klaim lagi bulan depan!`),
        { react: true, reactDone: '🎁', mentions: [m.sender] }
      )
    }

  }
}