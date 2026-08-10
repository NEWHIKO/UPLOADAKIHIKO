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

    case 'daily': 'menu'; {
      /* CONSTANTS */
      const STREAK_BONUS_DAY = 7
      const timeout = 86400000 // 24 jam

      /* HELPER */
      const u = global.db.data.users[m.sender]
      function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min }
      function pickRandom(arr) { return arr[Math.floor(Math.random() * arr.length)] }
      function msToTime(duration) {
        let s = Math.floor((duration / 1000) % 60)
        let mn = Math.floor((duration / 60000) % 60)
        let h = Math.floor(duration / 3600000)
        return `${h} jam ${mn} menit ${s} detik`
      }

      /* HANDLER */
      let now = new Date()
      let lastClaim = u.rpgdaily || 0
      let timeSinceLast = now - lastClaim
      let time = lastClaim + timeout

      if (timeSinceLast < timeout) {
        return sendWithTemplate(
          dino, m,
          decorate(`*⏳ Sudah Klaim!*
│
│ Kamu sudah klaim hadiah daily hari ini.
│
│ Tunggu: *${msToTime(time - now)}*`),
          { react: false, mentions: [m.sender] }
        )
      }

      // Streak
      if (!u.streakdaily || isNaN(u.streakdaily)) u.streakdaily = 0
      if (timeSinceLast > timeout * 2) u.streakdaily = 0
      u.streakdaily += 1

      // Bunga bank harian 0.5% (cap 50.000/hari)
      let bungaBank = 0
      if ((u.bank || 0) > 0) {
        bungaBank = Math.floor(u.bank * 0.005)
        bungaBank = Math.min(bungaBank, 50000)
        u.bank = (u.bank || 0) + bungaBank
      }

      // Daily: hanya dayMult (weekend bonus), tidak ada timeMult
      const reward = hitungReward('mulung',
        rand(8000, 35000),
        0, 1
      )
      const timeInfo = buildTimeInfo('mulung')
      const dropBonus = getDropBonus()


      u.money = (u.money || 0) + reward.finalMoney

      // Bonus harian random
      let bonusMsg = ''
      let bonusRoll = Math.random() - (dropBonus / 500)
      if (bonusRoll < 0.10) {
        let potion = rand(1, 2)
        u.potion = (u.potion || 0) + potion
        bonusMsg = `│ 🧪 Bonus  : *+${potion} Potion*`
      } else if (bonusRoll < 0.20) {
        let trash = rand(5, 15)
        u.trash = (u.trash || 0) + trash
        bonusMsg = `│ 🗑️ Bonus  : *+${trash} Trash*`
      } else if (bonusRoll < 0.27) {
        let iron = rand(3, 10)
        u.iron = (u.iron || 0) + iron
        bonusMsg = `│ 🔩 Bonus  : *+${iron} Iron*`
      } else if (bonusRoll < 0.32) {
        u.common = (u.common || 0) + 1
        bonusMsg = `│ ⚪ Bonus  : *+1 Common Crate*`
      }

      // Musim mempengaruhi bonus item
      let musimBonusMsg = ''
      if (reward.musim.key === 'hujan') {
        if (Math.random() < 0.3) {
          let wood = rand(50, 200)
          u.wood = (u.wood || 0) + wood
          musimBonusMsg = `│ 🪵 Musim Hujan Bonus: *+${wood} Wood*`
        }
      } else if (reward.musim.key === 'semi') {
        if (Math.random() < 0.4) {
          let bibit = rand(100, 500)
          let jenisBibit = ['bibitapel', 'bibitpisang', 'bibitmangga', 'bibitanggur', 'bibitjeruk']
          let chosen = jenisBibit[Math.floor(Math.random() * jenisBibit.length)]
          u[chosen] = (u[chosen] || 0) + bibit
          musimBonusMsg = `│ 🌱 Musim Semi Bonus: *+${bibit} ${chosen.replace('bibit', 'Bibit ')}*`
        }
      } else if (reward.musim.key === 'kemarau') {
        musimBonusMsg = `│ ☀️ Musim Kemarau: Money -10% (cuaca panas bikin males beraktivitas)`
      } else if (reward.musim.key === 'gugur') {
        if (Math.random() < 0.3) {
          let rock = rand(20, 100)
          u.rock = (u.rock || 0) + rock
          musimBonusMsg = `│ 🍂 Musim Gugur Bonus: *+${rock} Rock*`
        }
      }

      // Streak bonus
      let streakMsg = ''
      let streakBonusMsg = ''
      if (u.streakdaily % STREAK_BONUS_DAY === 0) {
        u.uncommon = (u.uncommon || 0) + 1
        streakBonusMsg = `│\n│ 🎊 *STREAK ${u.streakdaily} HARI!*\n│ 🟢 Bonus Streak: *+1 Uncommon Crate*\n│ ➤ *${usedPrefix}open uncommon*`
      } else {
        let sisa = STREAK_BONUS_DAY - (u.streakdaily % STREAK_BONUS_DAY)
        streakMsg = `│ 📅 Streak : *${u.streakdaily} hari* (${sisa} lagi → Uncommon Crate!)`
      }

      let sapaan = pickRandom([
        '🌞 Selamat pagi, rajin banget!', '🌙 Malam-malam masih klaim, semangat!',
        '☀️ Hari baru, rezeki baru!', '🎯 Konsisten itu keren!', '💫 Terus klaim setiap hari!'
      ])
      let statusTag = '🆓 *FREE*'

      u.rpgdaily = now * 1

      let bungaLine = bungaBank > 0
        ? `│ 📈 Bunga Bank: *+${bungaBank.toLocaleString('id-ID')}* (0.5% dari ${(u.bank - bungaBank).toLocaleString('id-ID')})`
        : `│ 💡 Simpan di bank untuk dapat bunga 0.5%/hari!`

      return sendWithTemplate(
        dino, m,
        decorate(`*🎁 Hadiah Daily!*
│
│ ${sapaan}
│ Status: ${statusTag}
│ ${streakMsg}
│
│ 🎁 *Reward:*
│ 💰 Money  : *+${reward.finalMoney.toLocaleString('id-ID')}*
${bungaLine}
${bonusMsg}
${musimBonusMsg}
│
│ ⏱️ *Efek Hari & Musim:*
│ ${timeInfo}
│ 📊 Hari Mult: ×${reward.dayMult} ${reward.hari.isWeekend ? '🎉 (WEEKEND BONUS!)' : ''}
│ ${reward.hari.isWeekend ? '🎉 Weekend: Drop rate +15%!' : ''}
${streakBonusMsg}`),
        { react: true, reactDone: '🎁', mentions: [m.sender] }
      )
    }

  }
}