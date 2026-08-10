const { sendWithTemplate } = require('../../../sendWithTemplate')
const { hitungReward, buildTimeInfo, getDropBonus } = require('../rpg-time-system.js')

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

    case 'weekly': 'menu'; {
      /* CONSTANTS */
      const timeout = 604800000 // 7 hari

      /* HELPER */
      const u = global.db.data.users[m.sender]
      function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min }
      function msToTime(duration) {
        let s = Math.floor((duration / 1000) % 60)
        let mn = Math.floor((duration / 60000) % 60)
        let h = Math.floor(duration / 3600000)
        return `${h} jam ${mn} menit ${s} detik`
      }

      /* HANDLER */
      let time = (u.rpgweekly || 0) + timeout
      if (new Date() - (u.rpgweekly || 0) < timeout) {
        return sendWithTemplate(
          dino, m,
          decorate(`*⏳ Sudah Klaim!*
│
│ Kamu sudah klaim hadiah weekly minggu ini.
│
│ Tunggu: *${msToTime(time - new Date())}*`),
          { react: false, mentions: [m.sender] }
        )
      }

      // Weekly: dayMult berlaku (weekend = lebih untung klaim weekly juga!)
      const reward = hitungReward('mulung',
        rand(40000, 180000),
        rand(20000, 60000),
        1
      )
      const dropBonus = getDropBonus()
      const timeInfo = buildTimeInfo('mulung')


      u.exp = (u.exp || 0) + reward.finalExp
      u.money = (u.money || 0) + reward.finalMoney

      // Bonus mingguan — dipengaruhi musim dan weekend
      let bonusMsg = ''
      let wBonus = Math.random() - (dropBonus / 300)
      if (wBonus < 0.20) {
        u.uncommon = (u.uncommon || 0) + 1
        bonusMsg = `│ 🟢 Bonus  : *+1 Uncommon Crate*`
      } else if (wBonus < 0.35) {
        let iron = rand(10, 20)
        u.iron = (u.iron || 0) + iron
        bonusMsg = `│ 🔩 Bonus  : *+${iron} Iron*`
      } else if (wBonus < 0.45) {
        let potion = rand(1, 3)
        u.potion = (u.potion || 0) + potion
        bonusMsg = `│ 🧪 Bonus  : *+${potion} Potion*`
      } else if (wBonus < 0.55) {
        let diamond = rand(1, 2)
        u.diamond = (u.diamond || 0) + diamond
        bonusMsg = `│ 💎 Bonus  : *+${diamond} Diamond*`
      } else {
        let trash = rand(20, 50)
        u.trash = (u.trash || 0) + trash
        bonusMsg = `│ 🗑️ Bonus  : *+${trash} Trash*`
      }

      // Musim bonus khusus weekly
      let musimBonusMsg = ''
      if (reward.musim.key === 'semi') {
        u.uncommon = (u.uncommon || 0) + 1
        musimBonusMsg = `│ 🌸 Musim Semi Bonus: *+1 Uncommon Crate ekstra!*`
      } else if (reward.musim.key === 'kemarau') {
        let expPenalty = Math.floor(reward.finalExp * 0.10)
        u.exp = (u.exp || 0) - expPenalty
        musimBonusMsg = `│ ☀️ Kemarau: EXP *-${expPenalty}* (cuaca panas bikin males belajar)`
      } else if (reward.musim.key === 'gugur') {
        let gold = rand(2, 5)
        u.gold = (u.gold || 0) + gold
        musimBonusMsg = `│ 🍂 Musim Gugur Bonus: *+${gold} Gold*`
      }

      u.rpgweekly = new Date() * 1

      return sendWithTemplate(
        dino, m,
        decorate(`*📅 Hadiah Weekly!*
│
│ Hadiah mingguan berhasil diklaim!
│
│ 🎁 *Reward:*
│ ✨ EXP    : *+${reward.finalExp.toLocaleString('id-ID')}*
│ 💰 Money  : *+${reward.finalMoney.toLocaleString('id-ID')}*
${bonusMsg}
${musimBonusMsg}
│
│ ⏱️ *Efek Hari & Musim:*
│ ${timeInfo}
│ 📊 Hari Mult: ×${reward.dayMult} ${reward.hari.isWeekend ? '🎉 (WEEKEND BONUS!)' : ''}
│
│ ➤ Klaim lagi minggu depan!`),
        { react: true, reactDone: '📅', mentions: [m.sender] }
      )
    }

  }
}