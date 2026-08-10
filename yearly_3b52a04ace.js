const { sendWithTemplate } = require('../../../sendWithTemplate')
const { getYearlyBonus } = require('../rpg-time-system.js')

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

    case 'yearly': 'menu'; {
      /* CONSTANTS */
      const timeout = 31536000000 // 1 tahun

      /* HELPER */
      const u = global.db.data.users[m.sender]
      function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min }
      function pickRandom(list) { return list[Math.floor(Math.random() * list.length)] }
      function msToTime(duration) {
        let seconds = Math.floor(duration / 1000)
        let minutes = Math.floor(seconds / 60)
        let hours = Math.floor(minutes / 60)
        let days = Math.floor(hours / 24)
        let years = Math.floor(days / 365)
        days %= 365
        let months = Math.floor(days / 30)
        days %= 30
        hours %= 24
        minutes %= 60
        seconds %= 60
        return `${years > 0 ? years + ' tahun ' : ''}${months} bulan ${days} hari ${hours} jam ${minutes} menit ${seconds} detik`
      }

      /* HANDLER */
      let time = (u.rpgyearly || 0) + timeout
      if (new Date() - (u.rpgyearly || 0) < timeout) {
        return sendWithTemplate(
          dino, m,
          decorate(`*⏳ Sudah Klaim!*
│
│ Kamu sudah klaim hadiah yearly tahun ini.
│
│ Tunggu: *${msToTime(time - new Date())}*`),
          { react: false, mentions: [m.sender] }
        )
      }

      // Generate reward dengan yearly bonus dari time system
      const yearBonus = getYearlyBonus()
      // CAP multiplier yearly ×1.05 (tahun kabisat sudah max)
      const yearMult = Math.min(yearBonus.yearMult, 1.05)

      let exp = rand(150000, 500000)
      let money = rand(250000, 1500000)

      // CAP BASE REWARD sebelum multiplier
      const moneyCap = 1500000
      const expCap   = 500000
      money = Math.min(money, moneyCap)
      exp   = Math.min(exp, expCap)

      // Terapkan yearly multiplier (bonus tahun kabisat, sudah di-cap ×1.05)
      money = Math.floor(money * yearMult)
      exp   = Math.floor(exp   * yearMult)

      // CAP FINAL reward setelah multiplier
      money = Math.min(money, 1575000)
      exp   = Math.min(exp,   525000)

      u.money = (u.money || 0) + money
      u.exp   = (u.exp   || 0) + exp

      // Bonus tahunan eksklusif
      let bonusMsg = ''
      let yBonus = Math.random()
      if (yBonus < 0.12) {
        u.legendary = (u.legendary || 0) + 1
        bonusMsg = `│ 🟡 Bonus  : *+1 Legendary Crate*`
      } else if (yBonus < 0.30) {
        u.mythic = (u.mythic || 0) + 2
        bonusMsg = `│ 🟣 Bonus  : *+2 Mythic Crate*`
      } else if (yBonus < 0.50) {
        let diamond = rand(3, 5)
        u.diamond = (u.diamond || 0) + diamond
        bonusMsg = `│ 💎 Bonus  : *+${diamond} Diamond*`
      } else if (yBonus < 0.68) {
        let gold = rand(1, 3)
        u.gold = (u.gold || 0) + gold
        bonusMsg = `│ 🥇 Bonus  : *+${gold} Gold*`
      } else {
        let iron = rand(40, 80)
        u.iron = (u.iron || 0) + iron
        bonusMsg = `│ 🔩 Bonus  : *+${iron} Iron*`
      }

      let sapaan = pickRandom([
        '🎊 Setahun berlalu, reward terbesar menantimu!',
        '🏆 Satu tahun penuh, luar biasa!',
        '🌟 365 hari bersama, terima kasih!',
        '🎉 Anniversary reward, yang paling spesial!',
        '👑 Setahun setia, pantas dapat yang terbaik!'
      ])

      let statusTag = '🆓 *FREE*'

      u.rpgyearly = new Date() * 1

      return sendWithTemplate(
        dino, m,
        decorate(`*🎊 Hadiah Yearly!*
│
│ ${sapaan}
│ Status: ${statusTag}
│
│ 🗓️ *Tahun ${yearBonus.tahun}* — ×${yearBonus.yearMult}
│ 💡 ${yearBonus.bonusMsg}
│
│ 🎁 *Reward:*
│ ✨ EXP    : *+${exp.toLocaleString('id-ID')}*
│ 💰 Money  : *+${money.toLocaleString('id-ID')}*
${bonusMsg}
│
│ ➤ Sampai jumpa tahun depan!`),
        { react: true, reactDone: '🎊', mentions: [m.sender] }
      )
    }

  }
}