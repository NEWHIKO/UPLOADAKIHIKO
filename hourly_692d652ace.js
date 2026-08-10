const { sendWithTemplate } = require('../../../sendWithTemplate')
const { hitungReward, buildTimeInfo } = require('../rpg-time-system.js')

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

    case 'hourly': 'menu'; {
      /* CONSTANTS */
      const timeout = 3600000 // 1 jam

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
      let time = (u.rpghourly || 0) + timeout
      if (new Date() - (u.rpghourly || 0) < timeout) {
        return sendWithTemplate(
          dino, m,
          decorate(`*⏳ Sudah Klaim!*
│
│ Kamu sudah klaim hadiah hourly tadi.
│
│ Tunggu: *${msToTime(time - new Date())}*`),
          { react: false, mentions: [m.sender] }
        )
      }

      // Hourly: jam sibuk [06-11] & [20-23] ×1.35, normal [12-19] ×1.00, sepi [00-05] ×0.70
      // Weekend: dayMult ×1.10–1.45
      const reward = hitungReward('mulung',
        rand(4000, 15000),
        rand(8000, 18000),
        1
      )
      const timeInfo = buildTimeInfo('mulung')

      let sapaan = pickRandom([
        '⚡ Semangat terus ya!', '🌟 Rajin klaim, cepat kaya!', '💪 Terus berjuang!',
        '🔥 Gaskeun terus!', '✨ Konsisten itu kunci!'
      ])

      let waktuBonus = ''
      if (reward.jam.kategori === 'SIBUK') {
        waktuBonus = '🔥 JAM SIBUK: Reward ×1.35! Rajin klaim pas jam sibuk ya!'
      } else if (reward.jam.kategori === 'SEPI') {
        waktuBonus = '💤 JAM SEPI: Reward ×0.70 — Klaim pas jam sibuk untuk hasil lebih!'
      }

      let statusTag = '🆓 *FREE*'

      u.exp = (u.exp || 0) + reward.finalExp
      u.money = (u.money || 0) + reward.finalMoney
      u.rpghourly = new Date() * 1

      return sendWithTemplate(
        dino, m,
        decorate(`*⚡ Hadiah Hourly!*
│
│ ${sapaan}
│ Status: ${statusTag}
│
│ 🎁 *Reward:*
│ ✨ EXP    : *+${reward.finalExp.toLocaleString('id-ID')}*
│ 💰 Money  : *+${reward.finalMoney.toLocaleString('id-ID')}*
│
│ ⏱️ *Efek Waktu & Musim:*
│ ${timeInfo}
│ 🔢 Total Multiplier: ×${reward.totalMult}
│ ${waktuBonus}
│ ${reward.hari.isWeekend ? '🎉 WEEKEND! Drop rate bonus aktif!' : ''}
│
│ ➤ Klaim lagi dalam 1 jam!`),
        { react: true, reactDone: '⚡', mentions: [m.sender] }
      )
    }

  }
}