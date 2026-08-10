const { sendWithTemplate } = require('../../../sendWithTemplate')

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

    case 'ikhlasin': 'menu'; {
      /* CONSTANTS */

      /* HELPER */

      /* HANDLER */
      const dbSender = global.db.data.users[m.sender]

      if (dbSender.pasangan === '') {
        return sendWithTemplate(
          dino, m,
          decorate(`*❌ Tidak Ada Ajakan Aktif!*
│
│ Kamu tidak sedang mengajak siapapun berpacaran.
│
│ ➤ *${usedPrefix}tembak @user* untuk mengajak seseorang.`),
          { mentions: [m.sender] }
        )
      }

      // Kalau sudah resmi jadian → suruh putus dulu
      if (global.db.data.users[dbSender.pasangan]?.pasangan === m.sender) {
        return sendWithTemplate(
          dino, m,
          decorate(`*💕 Kamu Sudah Berpacaran!*
│
│ Kamu sudah resmi berpacaran dengan @${dbSender.pasangan.split('@')[0]}.
│
│ Gunakan *${usedPrefix}putus* untuk mengakhiri hubungan.`),
          { mentions: [m.sender, dbSender.pasangan] }
        )
      }

      // Batalkan ajakan yang belum dijawab
      const exTarget = dbSender.pasangan
      dbSender.pasangan = ''

      return sendWithTemplate(
        dino, m,
        decorate(`*🕊️ Ikhlas...*
│
│ Kamu telah mengikhlaskan @${exTarget.split('@')[0]} yang belum memberi jawaban.
│
│ Semoga kamu menemukan orang yang lebih baik. 🌸`),
        { react: true, reactDone: '🕊️', mentions: [m.sender, exTarget] }
      )
    }

  }
}