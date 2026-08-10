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

    case 'putus': 'menu'; {
      /* CONSTANTS */

      /* HELPER */

      /* HANDLER */
      const dbSender = global.db.data.users[m.sender]

      if (dbSender.pasangan === '') {
        return sendWithTemplate(
          dino, m,
          decorate(`*❌ Tidak Punya Pasangan!*
│
│ Kamu saat ini tidak memiliki pasangan.
│
│ ➤ *${usedPrefix}tembak @user* untuk mengajak seseorang berpacaran.`),
          { mentions: [m.sender] }
        )
      }

      const exPasangan = dbSender.pasangan
      const dbEx = global.db.data.users[exPasangan]

      // Pasangan tidak ada di DB (akun dihapus dll)
      if (typeof dbEx === 'undefined') {
        dbSender.pasangan = ''
        return sendWithTemplate(
          dino, m,
          decorate(`*💔 Hubungan Berakhir*
│
│ Kamu telah mengakhiri hubungan dengan @${exPasangan.split('@')[0]}.
│
│ Semoga ini keputusan yang terbaik.`),
          { react: true, reactDone: '💔', mentions: [m.sender, exPasangan] }
        )
      }

      // Resmi berpacaran → putus kedua pihak
      if (dbEx.pasangan === m.sender) {
        dbSender.pasangan = ''
        dbEx.pasangan = ''
        return sendWithTemplate(
          dino, m,
          decorate(`*💔 Hubungan Berakhir*
│
│ Kamu telah mengakhiri hubungan dengan @${exPasangan.split('@')[0]}.
│
│ Semoga ini keputusan yang terbaik untuk kalian berdua.`),
          { react: true, reactDone: '💔', mentions: [m.sender, exPasangan] }
        )
      }

      // Status tidak konsisten → reset
      dbSender.pasangan = ''
      return sendWithTemplate(
        dino, m,
        decorate(`*❌ Tidak Punya Pasangan!*
│
│ Kamu saat ini tidak memiliki pasangan yang aktif.
│
│ ➤ *${usedPrefix}tembak @user* untuk mengajak seseorang berpacaran.`),
        { mentions: [m.sender] }
      )
    }

  }
}