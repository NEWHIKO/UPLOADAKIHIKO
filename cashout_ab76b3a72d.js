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

  switch (command) {

    case 'cashout': 'menu'; {
      /* CONSTANTS */

      /* HELPER */

      /* HANDLER */
      global.spacemanGames = global.spacemanGames || {}

      if (global.spacemanGames[m.sender]) {
        global.spacemanGames[m.sender].isCashedOut = true
        return sendWithTemplate(
          dino, m,
          decorate(`*✅ Cash Out Berhasil!*
│
│ Permintaan cashout diterima.
│ Tunggu hasil akhir game...`),
          { mentions: [m.sender] }
        )
      } else {
        return sendWithTemplate(
          dino, m,
          decorate(`*❌ Tidak Ada Game!*
│
│ Tidak ada game spaceman yang sedang berjalan.
│
│ ➤ Mulai dengan *${usedPrefix}spaceman <jumlah>*`),
          { mentions: [m.sender] }
        )
      }
    }

  }
}