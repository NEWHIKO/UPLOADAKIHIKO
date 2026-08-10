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

    case 'exp': 'menu'; {
      /* CONSTANTS */

      /* HELPER */

      /* HANDLER */
      let who

      if (m.isGroup) {
        if (m.mentionedJid?.[0]) {
          who = m.mentionedJid[0]
        } else if (m.quoted) {
          who = m.quoted.sender
        } else {
          who = m.sender
        }
      } else {
        who = m.sender
      }

      if (typeof global.db.data.users[who] === 'undefined') {
        return sendWithTemplate(
          dino, m,
          decorate(`*⚠️ Pengguna Tidak Ditemukan!*\n│\n│ User tidak ada di database.\n│ Coba cek lagi, mungkin ada yang salah.`),
          { mentions: [m.sender] }
        )
      }

      const exp = global.db.data.users[who].exp || 0
      const targetName = who === m.sender ? 'kamu' : `@${who.split('@')[0]}`

      return sendWithTemplate(
        dino, m,
        decorate(`*🔥 Info EXP*\n│\n│ EXP ${targetName} saat ini:\n│ ✨ *${exp.toLocaleString('id-ID')}* EXP\n│\n│ Terus semangat naikin level dan jadi makin GG! 💪💥`),
        { mentions: [who] }
      )
    }

  }
}