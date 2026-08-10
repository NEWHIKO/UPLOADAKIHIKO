const { sendWithTemplate } = require('../../sendWithTemplate')

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

    case 'judipvp': 'menu'; {
      /* CONSTANTS */
      const TIMEOUT = (dino.config?.gamewaktu || global.gamewaktu || 60) * 1000

      /* HELPER */
      const fmt = (n) => (n || 0).toLocaleString('id-ID')

      /* HANDLER */
      const bet = parseInt(args[0])
      const opponent = m.mentionedJid?.[0]

      // Validasi input
      if (!args[0] || isNaN(bet)) {
        return sendWithTemplate(
          dino, m,
          decorate(`*💰 JUDI PVP — ADU NASIB!* 💥
│
│ *📌 Cara Main:*
│ 1. Ketik: *${usedPrefix}judipvp <taruhan> @tag*
│ 2. Lawan ketik *terima* untuk menerima
│    atau *tolak* untuk menolak.
│ 3. Setelah diterima, kedua pemain
│    ketik *SPIN* di grup.
│
│ ➤ *${usedPrefix}judipvp 5000 @user*
│
│ 🎯 Ayo uji keberuntunganmu!`),
          { mentions: [m.sender] }
        )
      }

      if (!opponent) {
        return sendWithTemplate(
          dino, m,
          decorate(`*🚨 Tag Lawan Dulu!*
│
│ Contoh: *${usedPrefix}judipvp 5000 @user*`),
          { mentions: [m.sender] }
        )
      }

      if (bet <= 0) {
        return sendWithTemplate(
          dino, m,
          decorate(`*❌ Taruhan Tidak Valid!*
│
│ Minimal taruhan: *1 money*`),
          { mentions: [m.sender] }
        )
      }

      const senderMoney   = global.db.data.users[m.sender]?.money || 0
      const opponentMoney = global.db.data.users[opponent]?.money || 0

      if (senderMoney < bet) {
        return sendWithTemplate(
          dino, m,
          decorate(`*❌ Uangmu Tidak Cukup!*
│
│ 💰 Money kamu : *${fmt(senderMoney)}*
│ 🎲 Taruhan    : *${fmt(bet)}*`),
          { mentions: [m.sender] }
        )
      }

      if (opponentMoney < bet) {
        return sendWithTemplate(
          dino, m,
          decorate(`*❌ Uang Lawan Tidak Cukup!*
│
│ 💰 Money lawan : *${fmt(opponentMoney)}*
│ 🎲 Taruhan     : *${fmt(bet)}*`),
          { mentions: [m.sender, opponent] }
        )
      }

      dino.judipvp = dino.judipvp || {}

      // Cek apakah pemain sudah berada di room lain
      const senderInRoom   = Object.values(dino.judipvp).find(r => [r.p, r.p2].includes(m.sender))
      const opponentInRoom = Object.values(dino.judipvp).find(r => [r.p, r.p2].includes(opponent))

      if (senderInRoom) {
        return sendWithTemplate(
          dino, m,
          decorate(`*⚠️ Selesaikan Permainan Sebelumnya!*
│
│ Kamu masih berada di room judi PVP lain.`),
          { mentions: [m.sender] }
        )
      }

      if (opponentInRoom) {
        return sendWithTemplate(
          dino, m,
          decorate(`*⚠️ Lawan Sedang Main!*
│
│ Lawan sedang berada di permainan lain.`),
          { mentions: [m.sender, opponent] }
        )
      }

      const id = 'judipvp_' + Date.now()

      dino.judipvp[id] = {
        id,
        chat: m.chat,
        p: m.sender,
        p2: opponent,
        bet,
        status: 'wait',
        waktu: setTimeout(() => {
          if (dino.judipvp[id]) {
            sendWithTemplate(
              dino, m,
              decorate(`*⏳ Waktu Habis!*
│
│ Tantangan judi PVP dibatalkan karena tidak ada respons.`),
              { mentions: [m.sender, opponent] }
            )
            delete dino.judipvp[id]
          }
        }, TIMEOUT),
      }

      return sendWithTemplate(
        dino, m,
        decorate(`*🔥 JUDI PVP DIMULAI!*
│
│ 👤 @${m.sender.split('@')[0]} menantang
│ 👤 @${opponent.split('@')[0]}
│ 💵 Taruhan : *${fmt(bet)} money*
│
│ 📢 @${opponent.split('@')[0]}, berani terima?
│ ✅ Ketik *terima* → Menerima tantangan
│ ❌ Ketik *tolak*  → Menolak tantangan
│
│ ⏳ Batas waktu: *1 menit*`),
        { mentions: [m.sender, opponent] }
      )
    }

  }
}